import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Bot, Check, FileText, Lock, RefreshCw, Send, Sparkles, Star } from 'lucide-react'
import { avaBlockedReason, ESCALATE_REASONS, useDemo } from './store'
import { ChannelLabel, PriorityChip } from './ui'
import { DeskCopilot } from './DeskCopilot'
import type { AgentWorkflow, FlightSegment, RebookOption, ServiceCase } from './types'

const WORKFLOW_LABEL: Record<AgentWorkflow, string> = {
  rebook: 'Rebook',
  triage: 'Triage hold',
  ava_contained: 'Ava owned',
  servicing: 'Servicing',
  specialist: 'Specialist',
}

export function ConsultantWorkspace() {
  const { cases, selectedCaseId, dispatch, search } = useDemo()
  const navigate = useNavigate()
  const filtered = cases.filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return `${c.traveller} ${c.caseNumber} ${c.pnr} ${c.intent} ${c.trip}`.toLowerCase().includes(q)
  })
  const active = cases.find((c) => c.id === selectedCaseId)

  if (!active) {
    return (
      <div className="grid min-h-[calc(100vh-56px)] place-items-center p-6">
        <div className="card max-w-lg p-8 text-center">
          <div className="text-sm font-medium text-purple">TravelXen</div>
          <h1 className="mt-1 text-2xl font-medium tracking-tight">Open a trip</h1>
          <p className="mt-2 text-sm text-muted">
            Start from Inbox so the itinerary, policy alerts and Ava chat land in one console.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium"
                onClick={() => dispatch({ type: 'select-case', id: c.id })}
              >
                {c.traveller}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-primary mt-5" onClick={() => navigate('/')}>
            Go to Inbox
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col bg-canvas">
      <TravelerBar c={active} cases={filtered} />
      <div className="grid min-h-0 flex-1 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 overflow-y-auto p-4 md:p-5">
          <PolicyAlerts c={active} />
          <ItineraryCanvas c={active} />
          <WorkflowPanel c={active} />
        </div>
        <ChatPane c={active} />
      </div>
    </div>
  )
}

function TravelerBar({ c, cases }: { c: ServiceCase; cases: ServiceCase[] }) {
  const { dispatch } = useDemo()
  const initials = c.traveller
    .split(' ')
    .map((p) => p[0])
    .join('')
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line bg-white px-4 py-3 md:px-5">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-purple text-sm font-medium text-white">{initials}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-medium tracking-tight">{c.traveller}</h1>
          <PriorityChip value={c.urgency} />
          <span className="chip bg-ink text-white">{WORKFLOW_LABEL[c.workflow]}</span>
          <span className="chip bg-purple-soft text-purple">{c.intent}</span>
          {c.resolvedByAva ? <span className="chip bg-teal-soft text-teal">Ava resolved</span> : null}
        </div>
        <p className="truncate text-[12px] text-muted">
          {c.role} · {c.company} · {c.policy} · PNR {c.pnr}
          {c.newPnr ? ` → ${c.newPnr}` : ''}
        </p>
      </div>
      <div className="hidden items-center gap-2 md:flex">
        {cases.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => dispatch({ type: 'select-case', id: item.id })}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
              item.id === c.id ? 'bg-ink text-white' : 'bg-canvas text-muted'
            }`}
          >
            {item.traveller.split(' ')[0]}
          </button>
        ))}
      </div>
      <div className="text-right text-[12px]">
        <div className="font-medium">{c.confidence}% confidence</div>
        <div className="text-muted">Context {c.contextCompleteness}%</div>
      </div>
    </div>
  )
}

function PolicyAlerts({ c }: { c: ServiceCase }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <span className="chip bg-amber-soft text-amber">
        <AlertTriangle size={11} className="mr-1" /> {c.meetingConstraint}
      </span>
      <span className="chip bg-purple-soft text-purple">
        <Star size={11} className="mr-1" /> {c.loyalty}
      </span>
      <span className="chip bg-canvas text-ink">{c.locationNow}</span>
      {c.preferences.slice(0, 2).map((p) => (
        <span key={p} className="chip bg-white text-muted">
          {p}
        </span>
      ))}
    </div>
  )
}

function ItineraryCanvas({ c }: { c: ServiceCase }) {
  const selected = c.options.find((o) => o.id === c.selectedOptionId)
  const nodes = c.segments.flatMap((s, i) => (i === 0 ? [s.from, s.to] : [s.to]))
  return (
    <section className="card mb-4 overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div>
          <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">Trip</div>
          <div className="text-sm font-medium">{c.trip}</div>
        </div>
        <div className="text-right text-[12px] text-muted">
          {c.caseNumber}
          <div>Original PNR {c.pnr}</div>
        </div>
      </div>
      <div className="px-5 py-6">
        <div className="flex items-center gap-0">
          {nodes.map((code, i) => (
            <div key={code + i} className="flex min-w-0 flex-1 items-center">
              <div className="flex w-14 shrink-0 flex-col items-center">
                <div
                  className={`grid h-9 w-9 place-items-center rounded-full text-[11px] font-medium ${
                    c.segments.some((s) => s.to === code && s.status === 'missed')
                      ? 'bg-critical-soft text-critical'
                      : 'bg-purple-soft text-purple'
                  }`}
                >
                  {code}
                </div>
              </div>
              {i < nodes.length - 1 ? (
                <div className={`h-0.5 min-w-0 flex-1 ${c.segments[i]?.status === 'missed' ? 'route-line broken' : 'route-line'}`} />
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          {c.segments.map((s) => (
            <SegmentCard key={s.flight} s={s} />
          ))}
        </div>
        {selected ? (
          <div className="mt-3 rounded-xl border border-dashed border-purple bg-purple-soft/50 px-4 py-3">
            <div className="text-[11px] font-medium tracking-wide text-purple uppercase">Proposed reissue</div>
            <div className="mt-1 text-sm font-medium">
              {selected.flight} · {selected.route} · {selected.depart}–{selected.arrive}
            </div>
            <div className="text-[12px] text-muted">
              {selected.cabin} · {selected.travellerCost} · {selected.policyFit}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function SegmentCard({ s }: { s: FlightSegment }) {
  const tone =
    s.status === 'missed'
      ? 'border-critical/30 bg-critical-soft/40'
      : s.status === 'delayed'
        ? 'border-amber/30 bg-amber-soft/50'
        : 'border-line bg-white'
  const label = s.status === 'missed' ? 'Missed' : s.status === 'delayed' ? 'Delayed' : 'Confirmed'
  return (
    <div className={`rounded-xl border px-4 py-3 ${tone}`}>
      <div className="flex items-center justify-between text-[11px] font-medium">
        <span>
          {s.airline} · {s.flight}
        </span>
        <span className={s.status === 'ok' ? 'text-teal' : s.status === 'delayed' ? 'text-amber' : 'text-critical'}>{label}</span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <div className="text-xl font-medium tabular-nums">{s.depart}</div>
          <div className="text-[12px] text-muted">
            {s.from} · {s.fromCity}
          </div>
        </div>
        <div className="mb-3 h-px flex-1 bg-line" />
        <div className="text-right">
          <div className="text-xl font-medium tabular-nums">{s.arrive}</div>
          <div className="text-[12px] text-muted">
            {s.to} · {s.toCity}
          </div>
        </div>
      </div>
    </div>
  )
}

function WorkflowPanel({ c }: { c: ServiceCase }) {
  return (
    <>
      <AvaCopilot c={c} />
      <DeskCopilot c={c} />
      {c.workflow === 'triage' ? (
        <TriagePanel c={c} />
      ) : c.workflow === 'ava_contained' ? (
        <AvaContainedPanel c={c} />
      ) : c.workflow === 'servicing' ? (
        <ServicingPanel c={c} />
      ) : c.workflow === 'specialist' ? (
        <SpecialistPanel c={c} />
      ) : (
        <>
          <FlightShop c={c} />
          <AgentActions c={c} />
        </>
      )}
    </>
  )
}

function AvaCopilot({ c }: { c: ServiceCase }) {
  const { dispatch } = useDemo()
  const blocked = avaBlockedReason(c)
  const done = c.resolvedByAva || c.stage === 'verified' || c.stage === 'learned'
  const recommended = c.options.find((o) => o.recommended)
  const cta = blocked
    ? 'Ava cannot take this'
    : c.workflow === 'servicing'
      ? 'Let Ava send invoice'
      : c.workflow === 'ava_contained'
        ? 'Let Ava finish'
        : recommended
          ? `Hand ${recommended.flight} back to Ava`
          : 'Hand back to Ava'
  const attest =
    c.workflow === 'rebook'
      ? 'Maya asked for a person. Attest that EI 60 still lands before 19:30 ET, then Ava can ticket.'
      : c.workflow === 'triage'
        ? c.inventoryFresh
          ? 'Inventory is fresh. UA 15 is $0 Polaris — Ava can ticket without a consultant handle.'
          : 'Ava is ready to ticket UA 15 the moment inventory is under 5 minutes old.'
        : c.workflow === 'ava_contained'
          ? 'Do not take this chat. Ava already has an in-policy plan.'
          : c.workflow === 'servicing'
            ? 'Document-only. Ava can generate and send from the stored PNR.'
            : 'Immigration and documents stay with a specialist. Ava will not answer.'

  return (
    <section className={`mb-4 rounded-[14px] border px-4 py-4 ${blocked ? 'border-critical/30 bg-critical-soft/40' : 'border-purple/25 bg-purple-soft/50'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Bot size={16} className="text-purple" />
            Ava copilot
            {done ? <span className="chip bg-teal-soft text-teal">Resolved</span> : blocked ? <span className="chip bg-critical-soft text-critical">Blocked</span> : <span className="chip bg-white text-purple">Can automate</span>}
          </div>
          <p className="mt-1 text-[13px] text-muted">{attest}</p>
          {c.avaPlan.length > 0 ? (
            <ol className="mt-3 space-y-1.5 text-[13px]">
              {c.avaPlan.map((step, i) => (
                <li key={step} className="flex gap-2">
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-white text-[10px] font-medium text-purple">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
        <button
          type="button"
          className="btn btn-teal shrink-0"
          disabled={Boolean(blocked) || done}
          onClick={() => dispatch({ type: 'ava-complete', caseId: c.id })}
        >
          <Sparkles size={14} /> {cta}
        </button>
      </div>
    </section>
  )
}

function TriagePanel({ c }: { c: ServiceCase }) {
  const { dispatch } = useDemo()
  return (
    <>
      <section className={`mb-4 rounded-[14px] border px-4 py-3 ${c.inventoryFresh ? 'border-teal bg-teal-soft' : 'border-amber bg-amber-soft'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">{c.inventoryFresh ? 'Inventory is fresh — ticketing unlocked' : 'Do not ticket yet'}</div>
            <p className="text-[12px] text-muted">
              {c.inventoryFresh
                ? 'UA 15 snapshot is 1 min old. Last Polaris seat is still showing.'
                : 'UA 918 cancelled. Snapshot is 11 minutes stale. Hold Daniel in the Club until TravelXen refreshes.'}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={c.inventoryFresh}
            onClick={() => dispatch({ type: 'refresh-inventory', caseId: c.id })}
          >
            <RefreshCw size={14} /> Refresh inventory
          </button>
        </div>
      </section>
      <FlightShop c={c} lockedOverride={!c.inventoryFresh} />
      <AgentActions c={c} ticketDisabled={!c.inventoryFresh} />
    </>
  )
}

function AvaContainedPanel({ c }: { c: ServiceCase }) {
  const { dispatch } = useDemo()
  const navigate = useNavigate()
  const done = c.stage === 'verified' || c.stage === 'learned'
  return (
    <section className="card p-5">
      <div className="chip bg-teal-soft text-teal">Ava owned — consultant should not take this</div>
      <h2 className="mt-3 text-base font-medium">{c.intent}</h2>
      <p className="mt-1 text-sm text-muted">{c.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn btn-teal" disabled={done} onClick={() => dispatch({ type: 'ava-complete', caseId: c.id })}>
          Let Ava finish
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={c.stage !== 'verified'}
          onClick={() => {
            dispatch({ type: 'capture-learning', caseId: c.id })
            navigate('/learning')
          }}
        >
          <Check size={14} /> Capture learning
        </button>
      </div>
    </section>
  )
}

function ServicingPanel({ c }: { c: ServiceCase }) {
  const { dispatch } = useDemo()
  const navigate = useNavigate()
  const sent = c.verifiedMessage
  return (
    <section className="card p-5">
      <div className="chip bg-canvas text-muted">No disruption · document only</div>
      <h2 className="mt-3 flex items-center gap-2 text-base font-medium">
        <FileText size={16} /> VAT invoice · PNR {c.pnr}
      </h2>
      <p className="mt-1 text-sm text-muted">{c.summary}</p>
      <div className="mt-3 rounded-xl border border-line bg-canvas px-4 py-3 text-sm">
        <div className="font-medium">Preview</div>
        <p className="mt-1 text-muted">{c.messagePreview.body}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn btn-teal" disabled={sent} onClick={() => dispatch({ type: 'ava-complete', caseId: c.id })}>
          Let Ava send invoice
        </button>
        <button type="button" className="btn btn-ghost" disabled={sent} onClick={() => dispatch({ type: 'send-servicing', caseId: c.id })}>
          Send myself
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={c.stage !== 'verified'}
          onClick={() => {
            dispatch({ type: 'capture-learning', caseId: c.id })
            navigate('/learning')
          }}
        >
          <Check size={14} /> Capture learning
        </button>
      </div>
    </section>
  )
}

function SpecialistPanel({ c }: { c: ServiceCase }) {
  const { dispatch } = useDemo()
  const navigate = useNavigate()
  const locked = c.stage === 'escalated' || c.stage === 'learned'
  return (
    <section className="card border-critical/30 p-5">
      <div className="chip bg-critical-soft text-critical">Do not give immigration advice</div>
      <h2 className="mt-3 text-base font-medium">Document / visa risk on {c.originBooking}</h2>
      <p className="mt-1 text-sm text-muted">{c.summary}</p>
      <p className="mt-2 text-sm">Keep AZ 610 on hold. Route to a documents specialist. The travel agent must not confirm ESTA validity.</p>
      <label className="mt-4 block text-[12px] text-muted">
        Escalation reason
        <select
          value={c.escalateReason}
          disabled={locked}
          onChange={(e) => dispatch({ type: 'set-escalate-reason', caseId: c.id, reason: e.target.value })}
          className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-purple"
        >
          <option value="">Select reason…</option>
          {ESCALATE_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-danger"
          disabled={locked}
          onClick={() => dispatch({ type: 'decide', caseId: c.id, decision: 'escalate' })}
        >
          Send to documents specialist
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={c.stage !== 'escalated'}
          onClick={() => dispatch({ type: 'verify-message', caseId: c.id })}
        >
          Send holding message
        </button>
        <button
          type="button"
          className="btn btn-teal"
          disabled={c.stage !== 'escalated' && c.stage !== 'verified'}
          onClick={() => {
            dispatch({ type: 'capture-learning', caseId: c.id })
            navigate('/learning')
          }}
        >
          <Check size={14} /> Capture learning
        </button>
      </div>
      <p className="mt-3 text-[12px] text-muted">Ticketing is disabled on this workflow.</p>
    </section>
  )
}

function FlightShop({ c, lockedOverride = false }: { c: ServiceCase; lockedOverride?: boolean }) {
  const { dispatch } = useDemo()
  const locked =
    lockedOverride ||
    c.stage === 'verified' ||
    c.stage === 'learned' ||
    c.stage === 'escalated' ||
    c.stage === 'approved' ||
    c.stage === 'modified'
  if (c.options.length === 0) {
    return (
      <section className="card mb-4 p-5">
        <h2 className="text-sm font-medium">No air alternatives</h2>
        <p className="mt-1 text-sm text-muted">Use escalate if a specialist is required.</p>
      </section>
    )
  }
  return (
    <section className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-medium">Change flight</h2>
        <span className="text-[11px] text-muted">
          {lockedOverride ? 'Locked until inventory refresh' : 'Inventory snapshot · demo data'}
        </span>
      </div>
      <div className="space-y-2">
        {c.options.map((opt) => (
          <FlightResult
            key={opt.id}
            option={opt}
            selected={c.selectedOptionId === opt.id}
            disabled={locked}
            onSelect={() => dispatch({ type: 'select-option', caseId: c.id, optionId: opt.id })}
          />
        ))}
      </div>
    </section>
  )
}

function FlightResult({
  option,
  selected,
  disabled,
  onSelect,
}: {
  option: RebookOption
  selected: boolean
  disabled: boolean
  onSelect: () => void
}) {
  const [from, to] = option.route.split(' → ')
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`card flex w-full flex-wrap items-center gap-4 px-4 py-3 text-left ${
        selected ? 'ring-2 ring-purple' : 'hover:border-purple/40'
      }`}
    >
      <div className="w-[120px] shrink-0">
        <div className="text-sm font-medium">{option.airline}</div>
        <div className="text-[12px] text-muted">{option.flight}</div>
        {option.recommended ? (
          <span className="mt-1 inline-flex chip bg-teal-soft text-teal">
            <Sparkles size={10} className="mr-1" /> In policy
          </span>
        ) : (
          <span className="mt-1 chip bg-canvas text-muted">{option.cabin}</span>
        )}
      </div>
      <div className="flex min-w-[220px] flex-1 items-center gap-3">
        <div>
          <div className="text-lg font-medium tabular-nums">{option.depart}</div>
          <div className="text-[12px] text-muted">{from}</div>
        </div>
        <div className="min-w-[72px] flex-1 text-center">
          <div className="text-[11px] text-muted">{option.duration}</div>
          <div className="route-line my-1" />
          <div className="text-[11px] text-muted">nonstop</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-medium tabular-nums">{option.arrive}</div>
          <div className="text-[12px] text-muted">{to}</div>
        </div>
      </div>
      <div className="ml-auto w-[110px] text-right">
        <div className="text-lg font-medium">{option.travellerCost}</div>
        <div className="text-[11px] text-muted">{option.seats} seats · {option.confidence}%</div>
      </div>
    </button>
  )
}

function AgentActions({ c, ticketDisabled = false }: { c: ServiceCase; ticketDisabled?: boolean }) {
  const { dispatch } = useDemo()
  const navigate = useNavigate()
  const selected = c.options.find((o) => o.id === c.selectedOptionId)
  const locked = c.stage === 'verified' || c.stage === 'learned' || c.stage === 'escalated'
  const awaitingVerify = c.stage === 'approved' || c.stage === 'modified'
  const canDecide = Boolean(c.selectedOptionId) && !locked && !awaitingVerify && !ticketDisabled
  const ready = awaitingVerify

  return (
    <section className="card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium">Ticket and notify</h2>
        <span className="text-[11px] text-muted">
          {ticketDisabled ? 'Ticketing locked until inventory is fresh' : 'Human-controlled · no live GDS'}
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-[12px] text-muted">
          Agent note
          <textarea
            value={c.decisionNote}
            disabled={locked || awaitingVerify}
            onChange={(e) => dispatch({ type: 'set-note', caseId: c.id, note: e.target.value })}
            rows={2}
            className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm text-ink outline-none focus:border-purple"
            placeholder="Protect business fare. Aisle if available."
          />
        </label>
        <label className="block text-[12px] text-muted">
          Escalate to specialist
          <select
            value={c.escalateReason}
            disabled={locked || awaitingVerify}
            onChange={(e) => dispatch({ type: 'set-escalate-reason', caseId: c.id, reason: e.target.value })}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-purple"
          >
            <option value="">Select reason…</option>
            {ESCALATE_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" disabled={!canDecide} onClick={() => dispatch({ type: 'decide', caseId: c.id, decision: 'approve' })}>
          Ticket selected flight
        </button>
        <button
          type="button"
          className="btn btn-teal"
          disabled={locked || awaitingVerify || ticketDisabled || c.resolvedByAva}
          onClick={() => dispatch({ type: 'ava-complete', caseId: c.id })}
        >
          <Sparkles size={14} /> Hand back to Ava
        </button>
        <button type="button" className="btn btn-ghost" disabled={!canDecide} onClick={() => dispatch({ type: 'decide', caseId: c.id, decision: 'modify' })}>
          Save as modified
        </button>
        <button type="button" className="btn btn-danger" disabled={locked || awaitingVerify} onClick={() => dispatch({ type: 'decide', caseId: c.id, decision: 'escalate' })}>
          Escalate
        </button>
        <button type="button" className="btn btn-ghost" disabled={!ready || c.verifiedBooking} onClick={() => dispatch({ type: 'verify-booking', caseId: c.id })}>
          <Lock size={14} /> Confirm ticketed
        </button>
        <button
          type="button"
          className="btn btn-teal"
          disabled={c.stage !== 'verified'}
          onClick={() => {
            dispatch({ type: 'capture-learning', caseId: c.id })
            navigate('/learning')
          }}
        >
          <Check size={14} /> Capture learning
        </button>
      </div>
      {selected && (ready || c.verifiedBooking) ? (
        <p className="mt-3 text-[12px] text-muted">
          {selected.flight} · {c.newPnr ? `PNR ${c.newPnr}` : 'ticketing pending'} · {selected.depart}–{selected.arrive}
        </p>
      ) : null}
    </section>
  )
}

function ChatPane({ c }: { c: ServiceCase }) {
  const { dispatch } = useDemo()
  return (
    <aside className="flex min-h-[480px] flex-col border-l border-line bg-white">
      <div className="border-b border-line px-4 py-3">
        <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">
          <ChannelLabel channel={c.channel} /> · live
        </div>
        <div className="text-sm font-medium">{c.traveller}</div>
        <p className="text-[12px] text-muted">{c.avaOutcome}</p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto bg-surface p-4">
        {c.transcript.map((line) => {
        const fromTraveller = line.from === c.traveller.split(' ')[0] || line.from === c.traveller
        return (
            <div key={line.time + line.from + line.text.slice(0, 12)} className={`flex ${fromTraveller ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  fromTraveller ? 'rounded-br-md bg-purple text-white' : 'rounded-bl-md bg-white text-ink shadow-sm'
                }`}
              >
                <div className={`text-[10px] font-medium ${fromTraveller ? 'text-white/70' : 'text-muted'}`}>
                  {line.from} · {line.time}
                </div>
                {line.text}
              </div>
            </div>
          )
        })}
        {c.verifiedMessage ? (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white px-3 py-2 text-sm shadow-sm">
              <div className="text-[10px] font-medium text-muted">{c.resolvedByAva ? 'Ava' : 'Alex'} · sent</div>
              {c.messagePreview.body}
            </div>
          </div>
        ) : null}
      </div>
      <div className="border-t border-line p-3">
        <p className="mb-2 text-[11px] text-muted">
          {c.workflow === 'ava_contained'
            ? c.verifiedMessage
              ? 'Ava already messaged the traveller.'
              : 'Do not message — Ava owns this chat.'
            : c.workflow === 'servicing'
              ? c.verifiedMessage
                ? 'Invoice already sent from the servicing panel.'
                : 'Send the invoice from the servicing panel — not as a free-text chat.'
              : c.workflow === 'specialist'
                ? c.stage === 'escalated'
                  ? 'Specialist queued. Send a holding message only.'
                  : 'Do not confirm documents. Escalate first.'
                : c.verifiedBooking
                  ? 'Ticketing verified. Send the traveller update.'
                  : 'Message is locked until the ticket is confirmed.'}
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={c.messagePreview.body}
            className="min-w-0 flex-1 rounded-full border border-line bg-canvas px-3 py-2 text-[12px] outline-none"
            aria-label="Message preview"
          />
          <button
            type="button"
            className="btn btn-primary px-3"
            disabled={
              c.verifiedMessage ||
              c.workflow === 'ava_contained' ||
              c.workflow === 'servicing' ||
              (c.workflow === 'specialist' ? c.stage !== 'escalated' : !c.verifiedBooking)
            }
            onClick={() => dispatch({ type: 'verify-message', caseId: c.id })}
            aria-label="Send traveller update"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
