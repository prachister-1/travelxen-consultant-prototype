import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Bot,
  Check,
  FileText,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Send,
  Sparkles,
  Star,
} from 'lucide-react'
import { avaBlockedReason, ESCALATE_REASONS, OVERRIDE_REASONS, useDemo } from './store'
import { ChannelLabel, PriorityChip } from './ui'
import { AgentWorkStrip } from './AgentActivity'
import { DeskCopilot } from './DeskCopilot'
import type { AgentWorkflow, Channel, FlightSegment, RebookOption, ServiceCase } from './types'

const WORKFLOW_LABEL: Record<AgentWorkflow, string> = {
  rebook: 'Rebook',
  triage: 'Triage hold',
  ava_contained: 'Ava owned',
  servicing: 'Servicing',
  specialist: 'Specialist',
}

type TripTab = 'flights' | 'hotels' | 'cars'
type ChatTab = 'chat' | 'phone' | 'email'

export function ConsultantWorkspace() {
  const { cases, selectedCaseId, dispatch, search, interactions } = useDemo()
  const navigate = useNavigate()
  const [tripTab, setTripTab] = useState<TripTab>('flights')
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
            Profile, itinerary, policy alerts and live chat land in one agent portal — no GDS tab.
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
    <div className="grid min-h-[calc(100vh-56px)] bg-canvas xl:grid-cols-[268px_minmax(0,1fr)_352px]">
      <TravelerRail c={active} cases={filtered} />
      <div className="min-w-0 overflow-y-auto border-x border-line">
        <LastActionStrip c={active} />
        <AgentWorkStrip
          c={active}
          onOpen={() => {
            const i = interactions.find((x) => x.caseId === active.id)
            if (i) dispatch({ type: 'select-interaction', id: i.id })
            navigate('/orchestration')
          }}
        />
        <TripChrome c={active} tab={tripTab} onTab={setTripTab} />
        <div className="p-4 md:p-5">
          {tripTab === 'flights' ? (
            <>
              <ItineraryCanvas c={active} />
              <WorkflowPanel c={active} />
            </>
          ) : (
            <EmptyInventory tab={tripTab} pnr={active.pnr} />
          )}
        </div>
      </div>
      <ChatPane c={active} />
    </div>
  )
}

function TravelerRail({ c, cases }: { c: ServiceCase; cases: ServiceCase[] }) {
  const { dispatch } = useDemo()
  const initials = c.traveller
    .split(' ')
    .map((p) => p[0])
    .join('')
  return (
    <aside className="hidden min-h-0 overflow-y-auto bg-white xl:block">
      <div className="border-b border-line px-4 py-3">
        <div className="text-[10px] font-medium tracking-[0.14em] text-muted uppercase">Open trips</div>
        <div className="mt-2 flex flex-wrap gap-1">
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
      </div>
      <div className="px-4 py-5">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-purple text-sm font-medium text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="text-base font-medium tracking-tight">{c.traveller}</h1>
              <PriorityChip value={c.urgency} />
            </div>
            <p className="mt-0.5 text-[12px] text-muted">
              {c.role}
              <br />
              {c.company}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="chip bg-ink text-white">{WORKFLOW_LABEL[c.workflow]}</span>
          <span className="chip bg-purple-soft text-purple">{c.intent}</span>
          {c.resolvedByAva ? <span className="chip bg-teal-soft text-teal">Ava resolved</span> : null}
        </div>
      </div>
      <AlertBlock
        tone="amber"
        icon={<AlertTriangle size={13} />}
        title="Policy / meeting"
        body={c.meetingConstraint}
      />
      <AlertBlock tone="purple" icon={<Star size={13} />} title="Loyalty" body={c.loyalty} />
      <RailSection title="Company policy">{c.policy}</RailSection>
      <RailSection title="Payment on file">{cardOnFile(c)}</RailSection>
      <RailSection title="Preferences">{c.preferences.join(' · ')}</RailSection>
      <RailSection title="Location now">{c.locationNow}</RailSection>
      <RailSection title="Last traveler action">{lastTravelerAction(c)}</RailSection>
      <div className="border-t border-line px-4 py-4">
        <div className="text-[10px] font-medium tracking-[0.14em] text-muted uppercase">Booking history</div>
        <ul className="mt-2 space-y-2">
          {bookingHistory(c).map((row) => (
            <li key={row.title} className="rounded-xl border border-line bg-canvas px-3 py-2">
              <div className="text-[13px] font-medium">{row.title}</div>
              <div className="text-[11px] text-muted">{row.meta}</div>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-line px-4 py-4 text-[12px] text-muted">
        <div className="flex items-center gap-2">
          <Phone size={12} /> {c.phone}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <Mail size={12} /> {c.email}
        </div>
        <div className="mt-3">
          Context {c.contextCompleteness}% · {c.confidence}% confidence
        </div>
        <div className="mt-1">
          PNR {c.pnr}
          {c.newPnr ? ` → ${c.newPnr}` : ''}
        </div>
      </div>
    </aside>
  )
}

function AlertBlock({
  tone,
  icon,
  title,
  body,
}: {
  tone: 'amber' | 'purple'
  icon: ReactNode
  title: string
  body: string
}) {
  const cls = tone === 'amber' ? 'bg-amber-soft text-amber' : 'bg-purple-soft text-purple'
  return (
    <div className={`mx-4 mb-3 rounded-xl px-3 py-2.5 ${cls}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-medium tracking-[0.12em] uppercase">
        {icon}
        {title}
      </div>
      <p className="mt-1 text-[12px] text-ink">{body}</p>
    </div>
  )
}

function RailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-line px-4 py-3">
      <div className="text-[10px] font-medium tracking-[0.14em] text-muted uppercase">{title}</div>
      <p className="mt-1 text-[13px] leading-snug">{children}</p>
    </div>
  )
}

function LastActionStrip({ c }: { c: ServiceCase }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-purple-soft/60 px-4 py-2.5 md:px-5">
      <p className="text-[12px] text-ink">
        <span className="font-medium">Last traveler action · </span>
        {lastTravelerAction(c)}
      </p>
      <span className="chip bg-white text-purple">Same-agent routing if they return today</span>
    </div>
  )
}

function TripChrome({ c, tab, onTab }: { c: ServiceCase; tab: TripTab; onTab: (t: TripTab) => void }) {
  const initials = c.traveller
    .split(' ')
    .map((p) => p[0])
    .join('')
  return (
    <div className="border-b border-line bg-white px-4 py-3 md:px-5">
      <div className="flex flex-wrap items-center gap-3 xl:hidden">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-purple text-xs font-medium text-white">{initials}</div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{c.traveller}</div>
          <div className="truncate text-[12px] text-muted">
            {c.company} · {c.policy} · PNR {c.pnr}
          </div>
        </div>
        <PriorityChip value={c.urgency} />
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3 xl:pt-0">
        <div className="hidden xl:block">
          <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">Trip visualization</div>
          <div className="text-base font-medium tracking-tight">{c.trip}</div>
        </div>
        <div className="flex gap-1 rounded-full bg-canvas p-1">
          {(['flights', 'hotels', 'cars'] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onTab(id)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-medium capitalize ${
                tab === id ? 'bg-white text-ink shadow-sm' : 'text-muted'
              }`}
            >
              {id}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function EmptyInventory({ tab, pnr }: { tab: TripTab; pnr: string }) {
  return (
    <section className="card p-6">
      <div className="text-sm font-medium">No {tab} on PNR {pnr}</div>
      <p className="mt-1 text-sm text-muted">
        Agents change or cancel {tab} from this portal when they exist on the trip — no 15 minutes in a GDS.
      </p>
    </section>
  )
}

function ItineraryCanvas({ c }: { c: ServiceCase }) {
  const selected = c.options.find((o) => o.id === c.selectedOptionId)
  const nodes = c.segments.flatMap((s, i) => (i === 0 ? [s.from, s.to] : [s.to]))
  return (
    <section className="card mb-4 overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div>
          <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">Current itinerary</div>
          <div className="text-sm font-medium">{c.originBooking}</div>
        </div>
        <div className="text-right text-[12px] text-muted">
          {c.caseNumber}
          <div>PNR {c.pnr}</div>
        </div>
      </div>
      <div className="px-5 py-6">
        <div className="flex items-center gap-0">
          {nodes.map((code, i) => (
            <div key={code + i} className="flex min-w-0 flex-1 items-center">
              <div className="flex w-14 shrink-0 flex-col items-center">
                <div
                  className={`tx-node grid h-10 w-10 place-items-center rounded-full text-[11px] font-medium ${
                    c.segments.some((s) => s.to === code && s.status === 'missed')
                      ? 'bg-critical-soft text-critical'
                      : 'bg-purple text-white'
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
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {c.segments.map((s) => (
            <SegmentCard key={s.flight} s={s} />
          ))}
        </div>
        {selected ? (
          <div className="mt-3 rounded-xl border border-dashed border-purple bg-purple-soft/50 px-4 py-3">
            <div className="text-[11px] font-medium tracking-wide text-purple uppercase">Change held in portal</div>
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
      <FareDrawer c={c} />
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

function FareDrawer({ c }: { c: ServiceCase }) {
  const [open, setOpen] = useState(false)
  return (
    <section className="card mb-4 overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">Fare rules in the portal</div>
          <div className="text-sm font-medium">Plain language · Ava executes ticketing</div>
        </div>
        <span className="text-[12px] text-purple">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open ? (
        <div className="border-t border-line">
          <DeskCopilot c={c} embedded />
        </div>
      ) : null}
    </section>
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
      ? 'Maya asked for a person. Attest that EI 60 still lands before 19:30 ET, then Ava can ticket from this portal.'
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
    <section className={`mb-4 rounded-[14px] border px-4 py-3 ${blocked ? 'border-critical/30 bg-critical-soft/40' : 'border-purple/25 bg-purple-soft/50'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Bot size={16} className="text-purple" />
            Ava
            {done ? (
              <span className="chip bg-teal-soft text-teal">Resolved</span>
            ) : blocked ? (
              <span className="chip bg-critical-soft text-critical">Blocked</span>
            ) : (
              <span className="chip bg-white text-purple">Can automate</span>
            )}
          </div>
          <p className="mt-1 text-[13px] text-muted">{attest}</p>
          {c.avaPlan.length > 0 ? (
            <ol className="mt-2 space-y-1 text-[13px]">
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
            <div className="text-sm font-medium">{c.inventoryFresh ? 'Inventory is fresh — change unlocked' : 'Do not ticket yet'}</div>
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
  const shopRoute = c.options[0]?.route ?? '—'
  return (
    <section className="mb-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Change flight</h2>
          <p className="text-[12px] text-muted">
            {shopRoute} · today · Business · in-portal change, no GDS
            {lockedOverride ? ' · locked until inventory refresh' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          <span className="rounded-full border border-line bg-white px-2.5 py-1">Cabin: Business</span>
          <span className="rounded-full border border-line bg-white px-2.5 py-1">Stops: Nonstop</span>
          <span className="rounded-full bg-purple-soft px-2.5 py-1 text-purple">Sort: Recommended</span>
        </div>
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
  const code = airlineCode(option.airline)
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`card flex w-full flex-wrap items-center gap-4 px-4 py-4 text-left ${
        selected ? 'ring-2 ring-purple' : 'hover:border-purple/40'
      }`}
    >
      <div className="flex w-[132px] shrink-0 items-start gap-2.5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink text-[11px] font-medium text-white">{code}</div>
        <div>
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
      </div>
      <div className="flex min-w-[240px] flex-1 items-center gap-3">
        <div>
          <div className="text-2xl font-medium tabular-nums tracking-tight">{option.depart}</div>
          <div className="text-[12px] text-muted">{from}</div>
        </div>
        <div className="min-w-[80px] flex-1 text-center">
          <div className="text-[11px] text-muted">{option.duration}</div>
          <div className="route-line my-1" />
          <div className="text-[11px] text-muted">nonstop</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-medium tabular-nums tracking-tight">{option.arrive}</div>
          <div className="text-[12px] text-muted">{to}</div>
        </div>
      </div>
      <div className="ml-auto w-[120px] text-right">
        <div className="text-xl font-medium text-purple">{option.travellerCost}</div>
        <div className="text-[11px] text-muted">
          {option.seats} seats · {option.confidence}%
        </div>
        <div className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${selected ? 'bg-purple text-white' : 'bg-canvas text-ink'}`}>
          {selected ? 'Selected' : 'Select'}
        </div>
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
        <h2 className="text-sm font-medium">Issue change in portal</h2>
        <span className="text-[11px] text-muted">
          {ticketDisabled ? 'Locked until inventory is fresh' : 'No GDS · traveler sees the update in their profile'}
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
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
          Override Ava
          <select
            value={c.overrideReason}
            disabled={locked || awaitingVerify}
            onChange={(e) => dispatch({ type: 'set-override-reason', caseId: c.id, reason: e.target.value })}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-purple"
          >
            <option value="">Why is the recommendation wrong?</option>
            {OVERRIDE_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
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
          Change in portal
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={!canDecide}
          onClick={() => dispatch({ type: 'decide', caseId: c.id, decision: 'override' })}
        >
          Override Ava
        </button>
        <button
          type="button"
          className="btn btn-teal"
          disabled={locked || awaitingVerify || ticketDisabled || c.resolvedByAva}
          onClick={() => dispatch({ type: 'ava-complete', caseId: c.id })}
        >
          <Sparkles size={14} /> Hand back to Ava
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
  const [tab, setTab] = useState<ChatTab>(c.channel === 'phone' ? 'phone' : c.channel === 'email' ? 'email' : 'chat')
  return (
    <aside className="flex min-h-[480px] flex-col bg-white">
      <div className="border-b border-line px-4 pt-3">
        <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">
          <ChannelLabel channel={c.channel} /> · live
        </div>
        <div className="text-sm font-medium">{c.traveller}</div>
        <p className="text-[12px] text-muted">{c.avaOutcome}</p>
        <div className="mt-3 flex gap-4 text-[12px] font-medium">
          {(
            [
              ['chat', MessageCircle, 'Chat'],
              ['phone', Phone, 'Phone'],
              ['email', Mail, 'Email'],
            ] as const
          ).map(([id, Icon, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 border-b-2 pb-2 ${
                tab === id ? 'border-purple text-ink' : 'border-transparent text-muted'
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'phone' ? (
        <PhoneIdle c={c} />
      ) : tab === 'email' ? (
        <EmailThread c={c} />
      ) : (
        <>
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
          <Composer c={c} onSend={() => dispatch({ type: 'verify-message', caseId: c.id })} />
        </>
      )}
    </aside>
  )
}

function PhoneIdle({ c }: { c: ServiceCase }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-surface px-6 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-purple-soft text-purple">
        <Phone size={22} />
      </div>
      <p className="mt-3 text-sm font-medium">No live call</p>
      <p className="mt-1 text-[12px] text-muted">
        Last contact was <ChannelLabel channel={c.channel} />. If {c.traveller.split(' ')[0]} calls back today, they route to Alex.
      </p>
      <button type="button" className="btn btn-ghost mt-4" disabled>
        Start call · demo
      </button>
    </div>
  )
}

function EmailThread({ c }: { c: ServiceCase }) {
  return (
    <div className="flex flex-1 flex-col bg-surface p-4">
      <div className="card p-4 text-sm">
        <div className="text-[11px] text-muted">To · {c.email}</div>
        <div className="mt-1 font-medium">Re: {c.originBooking}</div>
        <p className="mt-3 text-muted">{c.messagePreview.body}</p>
      </div>
      <p className="mt-3 text-[11px] text-muted">Send from Chat after ticketing verifies — one message, all channels.</p>
    </div>
  )
}

function Composer({ c, onSend }: { c: ServiceCase; onSend: () => void }) {
  return (
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
          onClick={onSend}
          aria-label="Send traveller update"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}

function lastTravelerAction(c: ServiceCase) {
  const channelLabel: Record<Channel, string> = {
    whatsapp: 'WhatsApp',
    phone: 'phone',
    chat: 'in-app chat',
    email: 'email',
  }
  if (c.workflow === 'rebook') {
    return `Tried Ava self-serve rebook on ${channelLabel[c.channel]} after a missed connection, then asked for a person.`
  }
  if (c.workflow === 'triage') {
    return `Opened ${channelLabel[c.channel]} after a cancellation. Inventory was stale, so Ava held the case.`
  }
  if (c.workflow === 'ava_contained') {
    return `Started ${channelLabel[c.channel]} with Ava. Still in self-serve — do not take over.`
  }
  if (c.workflow === 'servicing') {
    return `Requested a VAT invoice from ${channelLabel[c.channel]}. No itinerary change.`
  }
  return `Raised a document question on ${channelLabel[c.channel]}. Last booking action did not include visa checks.`
}

function cardOnFile(c: ServiceCase) {
  return `${c.company.split(' ')[0]} virtual card · Visa ••${c.caseNumber.replace(/\D/g, '').slice(-4) || '1842'}`
}

function bookingHistory(c: ServiceCase) {
  return [
    { title: c.trip, meta: `PNR ${c.pnr} · Active${c.workflow === 'rebook' || c.workflow === 'triage' ? ' · disrupted' : ''}` },
    { title: 'SFO → LHR · 12–16 Jun 2026', meta: 'Completed · same policy' },
  ]
}

function airlineCode(airline: string) {
  const map: Record<string, string> = {
    'Aer Lingus': 'EI',
    'American Airlines': 'AA',
    'British Airways': 'BA',
    United: 'UA',
    'Air India': 'AI',
    'ITA Airways': 'AZ',
    Alitalia: 'AZ',
    ITA: 'AZ',
  }
  return map[airline] ?? airline.slice(0, 2).toUpperCase()
}
