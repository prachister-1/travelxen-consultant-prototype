import { useNavigate } from 'react-router-dom'
import { Workflow } from 'lucide-react'
import { useDemo } from './store'
import { ChannelLabel, PriorityChip } from './ui'
import type { Channel, FlightSegment, Interaction, Sentiment, ServiceCase, SupervisorRoute } from './types'

const FEATURED = ['int-jordan', 'int-maya', 'int-daniel'] as const

export function SharedContext() {
  const { interactions, cases, selectedInteractionId, dispatch } = useDemo()
  const navigate = useNavigate()
  const selected = interactions.find((i) => i.id === selectedInteractionId) ?? interactions[0]
  const selectedCase = cases.find((c) => c.id === selected?.caseId)

  function pickTrip(id: string) {
    dispatch({ type: 'select-interaction', id })
    const item = interactions.find((i) => i.id === id)
    if (item) dispatch({ type: 'select-case', id: item.caseId })
  }

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-5">
        <h1 className="text-[28px] font-medium tracking-tight">Shared context</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Everything on this trip in one place — traveller, flights, policy, Ava handoff, and supplier status. Pick a trip and Inbox, Workspace, and Agents stay on the same person.
        </p>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        {FEATURED.map((id) => {
          const item = interactions.find((i) => i.id === id)
          const c = cases.find((x) => x.id === item?.caseId)
          if (!item || !c) return null
          const on = item.id === selected?.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => pickTrip(item.id)}
              className={`card p-4 text-left ${on ? 'ring-2 ring-purple' : 'hover:border-purple/40'}`}
            >
              <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">{pathLabel(item, c)}</div>
              <div className="mt-1 text-sm font-medium">{item.traveller}</div>
              <p className="mt-1 text-[12px] text-muted">{pathHint(c)}</p>
            </button>
          )
        })}
      </div>

      {selected && selectedCase ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">Case on this desk</div>
              <div className="mt-0.5 text-sm font-medium">
                {selectedCase.traveller} · {selectedCase.caseNumber} · {selectedCase.pnr}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  dispatch({ type: 'open-case', id: selected.caseId })
                  navigate('/workspace')
                }}
              >
                Open this trip
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  pickTrip(selected.id)
                  navigate('/orchestration')
                }}
              >
                <Workflow size={15} /> Open in Agents
              </button>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <TravellerCard c={selectedCase} item={selected} />
            <TripCard c={selectedCase} />
            <PolicyCard c={selectedCase} />
            <AvaHandoffCard c={selectedCase} item={selected} />
            <SupplierCard c={selectedCase} />
            <IntentRoutingCard c={selectedCase} item={selected} />
          </div>

          <CompletenessCard value={selectedCase.contextCompleteness} />

          <section className="card mt-4 flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <div className="text-[11px] font-medium tracking-[0.12em] text-purple uppercase">Work this trip</div>
              <p className="mt-1 text-sm">Open Agents to see who should handle it and what they already did.</p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                pickTrip(selected.id)
                navigate('/orchestration')
              }}
            >
              <Workflow size={15} /> Open in Agents
            </button>
          </section>
        </>
      ) : null}
    </div>
  )
}

function TravellerCard({ c, item }: { c: ServiceCase; item: Interaction }) {
  const d = item.supervisor
  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Traveller</h2>
      </div>
      <div className="text-base font-medium">{c.traveller}</div>
      <p className="mt-1 text-sm text-muted">
        {c.role} · {c.company}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className={`chip ${d.vip ? 'bg-amber-soft text-amber' : 'bg-canvas text-muted'}`}>{d.vip ? 'VIP' : 'Not VIP'}</span>
        <span className="chip bg-purple-soft text-purple">{d.language}</span>
        <span className={`chip ${sentimentChip(d.sentiment)}`}>{titleWord(d.sentiment)}</span>
        <PriorityChip value={c.urgency} />
        <span className="chip bg-canvas text-muted">
          <ChannelLabel channel={c.channel} />
        </span>
      </div>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <Fact label="Loyalty" value={c.loyalty} />
        <Fact label="Where now" value={c.locationNow} />
        <Fact label="Payment on file" value={cardOnFile(c)} />
        <Fact label="Phone" value={c.phone} />
        <Fact label="Email" value={c.email} />
        <Fact label="Last traveler action" value={lastTravelerAction(c)} />
      </dl>
    </section>
  )
}

function TripCard({ c }: { c: ServiceCase }) {
  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Trip / PNR / flights</h2>
      </div>
      <div className="text-sm font-medium">{c.trip}</div>
      <p className="mt-1 text-[13px] text-muted">{c.originBooking}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="chip bg-ink text-white">{c.pnr}</span>
        {c.newPnr ? <span className="chip bg-teal-soft text-teal">New {c.newPnr}</span> : null}
        <span className="chip bg-canvas text-muted">{c.caseNumber}</span>
      </div>
      <p className="mt-3 text-sm">{c.disruption}</p>
      <ul className="mt-3 space-y-2">
        {c.segments.map((seg) => (
          <li key={`${seg.flight}-${seg.from}-${seg.to}`} className="flex flex-wrap items-center gap-2 rounded-lg bg-canvas px-3 py-2 text-sm">
            <span className="font-medium">{seg.flight}</span>
            <span className="text-muted">
              {seg.from} {seg.depart} → {seg.to} {seg.arrive}
            </span>
            <span className={`chip ${segmentChip(seg)}`}>{segmentWord(seg)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[13px] text-muted">Meeting: {c.meetingConstraint}</p>
    </section>
  )
}

function PolicyCard({ c }: { c: ServiceCase }) {
  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Policy</h2>
      </div>
      <p className="text-sm font-medium">{c.policy}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {c.preferences.map((pref) => (
          <span key={pref} className="chip bg-purple-soft text-purple">
            {pref}
          </span>
        ))}
      </div>
    </section>
  )
}

function AvaHandoffCard({ c, item }: { c: ServiceCase; item: Interaction }) {
  const toPerson = item.supervisor.routeTo !== 'ava'
  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Ava handoff</h2>
      </div>
      <p className="text-sm font-medium">{c.avaOutcome}</p>
      <p className="mt-2 text-[13px] text-muted">{toPerson ? item.supervisor.reason : 'Ava can finish this without a consultant handle.'}</p>
      <ul className="mt-3 space-y-1.5 text-sm">
        {c.avaPlan.map((step) => (
          <li key={step} className="rounded-lg bg-canvas px-3 py-2">
            {step}
          </li>
        ))}
      </ul>
    </section>
  )
}

function SupplierCard({ c }: { c: ServiceCase }) {
  const ticket = c.gdsFacts?.find((f) => f.id === 'ticket')
  const waiver = c.gdsFacts?.find((f) => f.id === 'waiver')
  const fresh = c.gdsFacts?.find((f) => f.id === 'fresh')
  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Supplier status</h2>
        <span className="text-[11px] text-muted">{c.inventoryFresh ? 'Updated 2 min ago' : 'Stale · 11 min'}</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <StatusTile
          label="Ticket"
          value={ticket?.value ?? (c.workflow === 'ava_contained' ? 'Issued' : 'See PNR')}
          ok={ticket?.tone === 'ok' || Boolean(c.gdsFacts?.length)}
        />
        <StatusTile
          label="Waiver"
          value={waiver?.value ?? (c.policy.toLowerCase().includes('waiver') ? 'In policy' : 'Check policy')}
          ok={waiver?.tone === 'ok' || c.policy.toLowerCase().includes('waiver')}
        />
        <StatusTile
          label="Inventory"
          value={fresh?.value ?? (c.inventoryFresh ? 'Fresh' : 'Stale — do not ticket')}
          ok={c.inventoryFresh}
        />
      </div>
      {c.gdsFacts && c.gdsFacts.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {c.gdsFacts.map((fact) => (
            <span key={fact.id} className={`chip ${fact.tone === 'ok' ? 'bg-teal-soft text-teal' : fact.tone === 'alert' ? 'bg-amber-soft text-amber' : 'bg-canvas text-muted'}`}>
              {fact.label}: {fact.value}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function IntentRoutingCard({ c, item }: { c: ServiceCase; item: Interaction }) {
  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Intent + routing</h2>
      </div>
      <p className="text-sm font-medium">{c.intent}</p>
      <p className="mt-1 text-[13px] text-muted">{item.routing}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className={`chip ${routeChip(item.supervisor.routeTo)}`}>{routeWord(item.supervisor.routeTo)}</span>
        <span className="chip bg-canvas text-muted">{titleWord(item.supervisor.complexity)} complexity</span>
        <span className="chip bg-purple-soft text-purple">{item.supervisor.confidence}% confidence</span>
      </div>
      <p className="mt-3 text-sm">{item.supervisor.reason}</p>
    </section>
  )
}

function CompletenessCard({ value }: { value: number }) {
  const tone = value >= 90 ? 'bg-teal' : value >= 75 ? 'bg-amber' : 'bg-critical'
  return (
    <section className="card mt-4 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Context completeness</h2>
        <span className="text-sm font-semibold tabular-nums">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-canvas">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${value}%` }} />
      </div>
      <p className="mt-2 text-[13px] text-muted">
        {value >= 90
          ? 'Enough for Agents to propose a next action with evidence.'
          : value >= 75
            ? 'Usable, but one field is still thin — usually inventory or a meeting time.'
            : 'Not complete enough to ticket. Refresh supplier data before Agents acts.'}
      </p>
    </section>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium tracking-[0.08em] text-muted uppercase">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
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
  if (c.gdsFacts?.length) {
    return `Opened ${channelLabel[c.channel]} after BA 117 delay. Ava is reading GDS: ticket issued, eligibility confirmed, waiver available.`
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

function StatusTile({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className={`rounded-xl px-3 py-2 ${ok ? 'bg-teal-soft' : 'bg-amber-soft'}`}>
      <div className="text-[11px] font-medium tracking-[0.08em] text-muted uppercase">{label}</div>
      <div className={`mt-1 text-sm font-medium ${ok ? 'text-teal' : 'text-amber'}`}>{value}</div>
    </div>
  )
}

function pathLabel(item: Interaction, c: ServiceCase) {
  if (c.gdsFacts?.length) return 'Ava can ticket'
  if (item.supervisor.routeTo === 'human' && c.workflow === 'triage') return 'Wait'
  if (item.supervisor.routeTo === 'human') return 'Needs you'
  return 'Ava can ticket'
}

function pathHint(c: ServiceCase) {
  if (c.gdsFacts?.length) return 'Ticket issued, waiver available, supplier 2 min old.'
  if (c.id === 'case-maya') return 'Asked for a person. Fare and 19:30 meeting stay in this layer.'
  if (c.id === 'case-daniel') return 'Seat list may be stale. Do not ticket from this snapshot.'
  return c.disruption
}

function segmentChip(seg: FlightSegment) {
  if (seg.status === 'ok') return 'bg-teal-soft text-teal'
  if (seg.status === 'delayed') return 'bg-amber-soft text-amber'
  if (seg.status === 'missed') return 'bg-critical-soft text-critical'
  return 'bg-purple-soft text-purple'
}

function segmentWord(seg: FlightSegment) {
  if (seg.status === 'ok') return 'On time'
  if (seg.status === 'delayed') return 'Delayed'
  if (seg.status === 'missed') return 'Missed'
  return 'Proposed'
}

function sentimentChip(value: Sentiment) {
  if (value === 'calm') return 'bg-teal-soft text-teal'
  if (value === 'stressed' || value === 'anxious') return 'bg-amber-soft text-amber'
  return 'bg-canvas text-muted'
}

function titleWord(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function routeWord(route: SupervisorRoute) {
  if (route === 'ava') return 'Ava tickets'
  if (route === 'specialist') return 'Documents specialist'
  return 'You confirm, then Ava'
}

function routeChip(route: SupervisorRoute) {
  if (route === 'ava') return 'bg-teal-soft text-teal'
  if (route === 'specialist') return 'bg-critical-soft text-critical'
  return 'bg-purple-soft text-purple'
}
