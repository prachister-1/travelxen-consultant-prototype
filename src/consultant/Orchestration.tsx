import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bot,
  FileText,
  GraduationCap,
  Headphones,
  Shield,
  Sparkles,
  UserRound,
  Workflow,
} from 'lucide-react'
import { useDemo } from './store'
import { ChannelLabel, MetricCard } from './ui'
import { DeskCopilot } from './DeskCopilot'
import type { Interaction, ServiceCase, SupervisorRoute } from './types'

const HELPERS = [
  {
    id: 'summariser',
    name: 'PNR summariser',
    owner: 'Ava',
    job: 'Turns a messy PNR, chat and disruption into a few sentences. Native language, no cryptic.',
    speeds: 'A new hire reads Maya’s miss-connect without opening a GDS mask.',
  },
  {
    id: 'rules',
    name: 'Fare-rule reader',
    owner: 'TravelXen',
    job: 'Reads fare family, residual, waiver and penalties so the consultant does not decode CAT rules.',
    speeds: 'EI 60 is already tagged same-family / €0 before anyone shops.',
  },
  {
    id: 'gds',
    name: 'GDS copilot',
    owner: 'Ava',
    job: 'Proposes availability, price and ticket commands. Executes only after attest or Ava containment.',
    speeds: 'Consultants who were never Sabre/Amadeus trained can still finish a reissue.',
  },
  {
    id: 'inventory',
    name: 'Inventory scout',
    owner: 'TravelXen',
    job: 'Keeps the fare snapshot under 5 minutes so nobody tickets stale availability.',
    speeds: 'Removes the 11-minute hold on Daniel before anyone promises a seat.',
  },
  {
    id: 'policy',
    name: 'Policy checker',
    owner: 'TravelXen',
    job: 'Confirms company policy and disruption cap against the proposed itinerary.',
    speeds: 'Stops a residual that would need a supervisor exception.',
  },
  {
    id: 'calendar',
    name: 'Constraint watch',
    owner: 'TravelXen',
    job: 'Pins meeting times into the brief so routing is judged against a calendar, not a guess.',
    speeds: 'Consultant attests one field instead of rebuilding the itinerary from chat.',
  },
  {
    id: 'draft',
    name: 'Message drafter',
    owner: 'Ava',
    job: 'Writes the traveller update, then locks send until ticketing verifies.',
    speeds: 'Alex does not type a WhatsApp from scratch after every reissue.',
  },
  {
    id: 'quality',
    name: 'Quality loop',
    owner: 'Quality',
    job: 'Turns a verified handle into a playbook so Ava can take the next one.',
    speeds: 'Today’s attest becomes tomorrow’s containment.',
  },
]

export function AgentOrchestration() {
  const { interactions, cases, signals, avaRuns, selectedInteractionId, dispatch } = useDemo()
  const navigate = useNavigate()
  const selected = interactions.find((i) => i.id === selectedInteractionId) ?? interactions[0]
  const selectedCase = cases.find((c) => c.id === selected?.caseId)
  const playback = useOrchPlayback(selected?.id)

  const routed = {
    ava: interactions.filter((i) => i.supervisor.routeTo === 'ava').length,
    human: interactions.filter((i) => i.supervisor.routeTo === 'human').length,
    specialist: interactions.filter((i) => i.supervisor.routeTo === 'specialist').length,
  }
  const playbooks = buildPlaybooks(cases, signals)

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-5">
        <h1 className="text-[28px] font-medium tracking-tight">Agents</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Qualified GDS agents are scarce. The Supervisor routes the contact. Ava summarises the PNR, reads fare rules and proposes commands in plain language so a consultant who was never PSS-trained can still attest — then Quality writes that handle back into Ava.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Supervisor → Ava" value={String(routed.ava)} hint="Contained or Ava-owned" />
        <MetricCard label="Supervisor → consultant" value={String(routed.human)} hint="Judgment / attest only" />
        <MetricCard label="Supervisor → specialist" value={String(routed.specialist)} hint="Out of travel scope" />
        <MetricCard label="GDS commands typed" value="0" hint="Ava proposes · consultant attests" />
      </div>

      <SupervisorHub selected={selected} playing={playback.playing} step={playback.step} />

      <AgentStrip route={selected?.supervisor.routeTo} step={playback.step} />

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">How they work this contact</h2>
            <button type="button" className="btn btn-ghost text-xs" onClick={playback.play}>
              Replay handoff
            </button>
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {interactions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => dispatch({ type: 'select-interaction', id: item.id })}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${
                  item.id === selected?.id ? 'bg-ink text-white' : 'bg-white text-muted ring-1 ring-line'
                }`}
              >
                {item.traveller.split(' ')[0]}
                <span className="ml-1.5 opacity-70">{shortRoute(item.supervisor.routeTo)}</span>
              </button>
            ))}
          </div>
          <HandoffTape interaction={selected} serviceCase={selectedCase} step={playback.step} playing={playback.playing} />
          {selectedCase ? <DeskCopilot c={selectedCase} /> : null}
          <HelperGrid />
        </section>

        <aside className="space-y-3">
          <KnowledgeBackToAva playbooks={playbooks} avaRuns={avaRuns} />
          <section className="card p-4">
            <h2 className="text-sm font-semibold">Open this trip</h2>
            <p className="mt-3 text-[12px] leading-relaxed text-ink">
              Shortage of GDS-trained people is why Ava proposes commands. Alex attests. Quality writes the rule back so the next hire never sees cryptic.
            </p>
            <button
              type="button"
              className="btn btn-primary mt-3 w-full"
              disabled={!selected}
              onClick={() => {
                if (!selected) return
                dispatch({ type: 'open-case', id: selected.caseId })
                navigate('/workspace')
              }}
            >
              <Workflow size={15} /> Open trip
            </button>
          </section>
        </aside>
      </div>
    </div>
  )
}

function SupervisorHub({
  selected,
  playing,
  step,
}: {
  selected?: Interaction
  playing: boolean
  step: number
}) {
  const d = selected?.supervisor
  const scored = step >= 2
  const decided = step >= 3
  return (
    <section className="mb-5 overflow-hidden rounded-[14px] border border-line bg-ink text-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <div>
          <div className="text-[11px] font-medium tracking-[0.12em] text-white/50 uppercase">AI Supervisor</div>
          <div className="text-sm font-medium">Scores every inbound, then picks Ava, a consultant, or a specialist</div>
        </div>
        {playing && step < 3 ? (
          <span className="chip bg-amber-soft text-amber">Scoring…</span>
        ) : decided && d ? (
          <span className={`chip ${routeChip(d.routeTo)}`}>{routeLabel(d.routeTo)}</span>
        ) : (
          <span className="chip bg-white/10 text-white/70">Waiting for Genesys</span>
        )}
      </div>
      <div className="grid gap-0 md:grid-cols-6">
        <ScoreCell label="Intent" value={selected?.intent} show={step >= 1} />
        <ScoreCell label="Sentiment" value={d ? title(d.sentiment) : undefined} show={scored} />
        <ScoreCell label="Complexity" value={d ? title(d.complexity) : undefined} show={scored} />
        <ScoreCell label="VIP" value={d ? (d.vip ? 'Yes' : 'No') : undefined} show={scored} />
        <ScoreCell label="Language" value={d?.language} show={scored} />
        <ScoreCell label="Confidence" value={d ? `${d.confidence}%` : undefined} show={decided} />
      </div>
      <div className={`border-t border-white/10 px-4 py-3 text-sm ${decided ? 'bg-white/5' : ''}`}>
        {decided && d ? (
          <>
            <div className="text-[11px] font-medium tracking-[0.12em] text-white/50 uppercase">Why this route</div>
            <p className="mt-1 text-white/90">{d.reason}</p>
          </>
        ) : (
          <p className="text-white/60">
            Supervisor never tickets. It only decides who is allowed to act — Ava, a travel consultant, or a documents specialist.
          </p>
        )}
      </div>
    </section>
  )
}

function ScoreCell({ label, value, show }: { label: string; value?: string; show: boolean }) {
  return (
    <div className="border-b border-white/10 px-4 py-3 md:border-b-0 md:border-r md:last:border-r-0">
      <div className="text-[11px] tracking-[0.12em] text-white/45 uppercase">{label}</div>
      {show && value ? (
        <div className="mt-1 text-sm font-medium">{value}</div>
      ) : (
        <div className="mt-2 h-4 w-20 animate-pulse rounded bg-white/10" />
      )}
    </div>
  )
}

function AgentStrip({ route, step }: { route?: SupervisorRoute; step: number }) {
  const nodes = [
    { id: 'genesys', name: 'Genesys', icon: Headphones, on: step >= 1 },
    { id: 'supervisor', name: 'Supervisor', icon: Shield, on: step >= 2 },
    { id: 'ava', name: 'Ava', icon: Bot, on: step >= 4 && route === 'ava' },
    { id: 'consultant', name: 'Consultant', icon: UserRound, on: step >= 4 && route === 'human' },
    { id: 'specialist', name: 'Specialist', icon: FileText, on: step >= 4 && route === 'specialist' },
    { id: 'quality', name: 'Quality → Ava', icon: GraduationCap, on: step >= 6 },
  ]
  return (
    <ol className="mb-1 grid grid-cols-2 gap-2 md:grid-cols-6">
      {nodes.map((n) => {
        const Icon = n.icon
        const chosen =
          (n.id === 'ava' && route === 'ava') ||
          (n.id === 'consultant' && route === 'human') ||
          (n.id === 'specialist' && route === 'specialist') ||
          n.id === 'genesys' ||
          n.id === 'supervisor' ||
          n.id === 'quality'
        return (
          <li
            key={n.id}
            className={`card flex items-center gap-2 px-3 py-2 text-sm ${
              n.on ? 'ring-2 ring-purple' : chosen ? '' : 'opacity-40'
            }`}
          >
            <span className={`grid h-8 w-8 place-items-center rounded-lg ${n.on ? 'bg-purple text-white' : 'bg-canvas text-muted'}`}>
              <Icon size={15} />
            </span>
            <span className="font-medium">{n.name}</span>
          </li>
        )
      })}
    </ol>
  )
}

function HandoffTape({
  interaction,
  serviceCase,
  step,
  playing,
}: {
  interaction?: Interaction
  serviceCase?: ServiceCase
  step: number
  playing: boolean
}) {
  const lines = useMemo(() => (interaction && serviceCase ? tapeFor(interaction, serviceCase) : []), [interaction, serviceCase])
  return (
    <section className="card mb-4 overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">Handoff tape</div>
          <div className="text-sm font-medium">
            {interaction ? (
              <>
                {interaction.traveller} · <ChannelLabel channel={interaction.channel} /> · {interaction.genesysId}
              </>
            ) : (
              'Select a contact'
            )}
          </div>
        </div>
        {playing ? <span className="chip bg-amber-soft text-amber">Live</span> : <span className="chip bg-canvas text-muted">Paused</span>}
      </div>
      <ol className="divide-y divide-line">
        {lines.map((line, i) => {
          const visible = step >= i
          return (
            <li key={line.title} className={`px-4 py-3 ${visible ? 'opacity-100' : 'opacity-35'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">{line.actor}</div>
                  <div className="text-sm font-medium">{line.title}</div>
                  <p className="mt-0.5 text-[13px] text-muted">{visible ? line.detail : 'Waiting…'}</p>
                </div>
                {visible ? <span className="chip bg-teal-soft text-teal">Done</span> : <span className="chip bg-canvas text-muted">Queued</span>}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function HelperGrid() {
  return (
    <section className="card p-4">
      <h2 className="text-sm font-semibold">Agents that replace GDS training, not the consultant</h2>
      <p className="mt-1 text-[13px] text-muted">
        Shortage of Sabre/Amadeus-qualified people is the hiring bottleneck. These agents summarise, read rules, check policy and propose GDS. The human only attests judgment — meeting fit, stale inventory, or specialist risk.
      </p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {HELPERS.map((h) => (
          <div key={h.id} className="rounded-xl border border-line bg-canvas px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium">{h.name}</div>
              <span className="chip bg-white text-muted">{h.owner}</span>
            </div>
            <p className="mt-1 text-[12px] text-muted">{h.job}</p>
            <p className="mt-2 text-[12px] text-teal">{h.speeds}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function KnowledgeBackToAva({
  playbooks,
  avaRuns,
}: {
  playbooks: ReturnType<typeof buildPlaybooks>
  avaRuns: { id: string; traveller: string; intent: string; outcome: string; status: string }[]
}) {
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-line bg-teal-soft/60 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-teal">
          <Sparkles size={15} /> Knowledge back to Ava
        </div>
        <p className="mt-1 text-[12px] text-ink/80">
          Consultant attests → Quality captures → playbook updates → Ava contains the next one without a handle.
        </p>
      </div>
      <ul className="divide-y divide-line">
        {playbooks.map((p) => (
          <li key={p.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-medium">{p.title}</div>
                <p className="mt-0.5 text-[12px] text-muted">{p.rule}</p>
              </div>
              <span className={`chip ${p.live ? 'bg-teal-soft text-teal' : 'bg-canvas text-muted'}`}>{p.live ? 'Live in Ava' : 'Queued'}</span>
            </div>
            <p className="mt-1 text-[12px] text-purple">{p.from}</p>
          </li>
        ))}
      </ul>
      <div className="border-t border-line px-4 py-3">
        <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">Ava already using</div>
        <ul className="mt-2 space-y-1.5 text-[12px] text-muted">
          {avaRuns
            .filter((r) => r.status === 'resolved')
            .slice(0, 3)
            .map((r) => (
              <li key={r.id}>
                {r.traveller} · {r.intent} · {r.outcome}
              </li>
            ))}
        </ul>
      </div>
    </section>
  )
}

function tapeFor(interaction: Interaction, c: ServiceCase) {
  const route = interaction.supervisor.routeTo
  const handed = c.resolvedByAva
  const lines = [
    {
      actor: 'Genesys',
      title: `${labelChannel(interaction.channel)} captured`,
      detail: `${interaction.genesysId} · ${interaction.routing}`,
    },
    {
      actor: 'AI Supervisor',
      title: 'Score intent, sentiment, complexity',
      detail: `${title(interaction.supervisor.sentiment)} · ${interaction.supervisor.complexity} complexity · VIP ${interaction.supervisor.vip ? 'yes' : 'no'}`,
    },
    {
      actor: 'AI Supervisor',
      title: routeLabel(route),
      detail: interaction.supervisor.reason,
    },
    {
      actor: route === 'ava' ? 'Ava' : route === 'specialist' ? 'Documents specialist' : 'Helper agents',
      title:
        route === 'ava'
          ? 'Ava keeps the chat'
          : route === 'specialist'
            ? 'Travel consultant is skipped'
            : 'Inventory, policy and calendar pre-fill the trip',
      detail:
        route === 'ava'
          ? c.avaPlan[0] ?? interaction.ava
          : route === 'specialist'
            ? 'Ava must not give immigration advice. Booking stays on hold.'
            : 'Scout, policy checker and constraint watch finish before Alex opens the trip.',
    },
    {
      actor: 'TravelXen',
      title: `${c.caseNumber} is already complete enough to act`,
      detail: `Context ${c.contextCompleteness}% · PNR ${c.pnr} · ${c.inventoryFresh ? 'inventory fresh' : 'inventory hold'}`,
    },
    {
      actor: handed ? 'Ava' : route === 'human' ? 'Consultant' : 'Ava',
      title: handed
        ? 'Handed back — Ava finished it'
        : route === 'human'
          ? 'Alex attests or tickets, then Quality writes the playbook'
          : route === 'specialist'
            ? 'Specialist owns documents. No ticketing from travel.'
            : 'Ava resolves without a consultant handle',
      detail: handed
        ? 'The attest is now a rule Ava can reuse.'
        : 'Quality is the only path that makes Ava better. Handles that are not captured do not change routing.',
    },
  ]
  return lines
}

function buildPlaybooks(cases: ServiceCase[], signals: { id: string; time: string; intent: string; playbookImpact: string; traveller: string }[]) {
  const session = signals.filter((s) => s.time.startsWith('Today'))
  const handed = cases.filter((c) => c.resolvedByAva)
  return [
    {
      id: 'pb-seat',
      title: 'Seat-only, in-policy → Ava',
      rule: 'No itinerary change, paid seat inside policy. Supervisor keeps with Ava.',
      from: 'Learned from Olivia-style chats',
      live: true,
    },
    {
      id: 'pb-invoice',
      title: 'VAT invoice from stored PNR → Ava',
      rule: 'No booking change. Servicing agent generates and emails.',
      from: 'Learned from billing intents',
      live: true,
    },
    {
      id: 'pb-sked',
      title: 'Same-ticket schedule change → Ava',
      rule: 'Carrier retimes, meeting still holds, no residual. Accept on original PNR.',
      from: 'Learned from Luca Bianchi',
      live: true,
    },
    {
      id: 'pb-misconnect',
      title: 'Same-fare-family misconnect after attest → Ava',
      rule: 'If a consultant attests the calendar constraint, Ava may ticket the €0 recommended flight.',
      from: handed.some((c) => c.id === 'case-maya')
        ? 'Live from Maya Patel hand-back this session'
        : session.find((s) => s.intent.toLowerCase().includes('misconnect') || s.intent.toLowerCase().includes('rebook'))
          ? `Captured today · ${session[0]?.traveller}`
          : 'Queued until a consultant hands EI 60 back',
      live: handed.some((c) => c.id === 'case-maya'),
    },
    {
      id: 'pb-inventory',
      title: 'Stale inventory → never autopilot',
      rule: 'If snapshot > 5 min, Supervisor holds for a human until Inventory scout refreshes, then Ava may ticket.',
      from: 'Hard stop from Daniel Kim',
      live: true,
    },
  ]
}

function useOrchPlayback(interactionId?: string) {
  const [step, setStep] = useState(6)
  const [playing, setPlaying] = useState(false)
  const timers = useRef<number[]>([])

  function clear() {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  function play() {
    clear()
    setPlaying(true)
    setStep(0)
    timers.current = [0, 1, 2, 3, 4, 5, 6].map((n, i) =>
      window.setTimeout(() => {
        setStep(n)
        if (n === 6) setPlaying(false)
      }, 700 * i),
    )
  }

  useEffect(() => {
    play()
    return clear
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactionId])

  return { step, playing, play }
}

function routeLabel(route: SupervisorRoute) {
  if (route === 'ava') return 'Keep with Ava'
  if (route === 'specialist') return 'Route to specialist'
  return 'Route to consultant'
}

function shortRoute(route: SupervisorRoute) {
  if (route === 'ava') return 'Ava'
  if (route === 'specialist') return 'Specialist'
  return 'Human'
}

function routeChip(route: SupervisorRoute) {
  if (route === 'ava') return 'bg-teal-soft text-teal'
  if (route === 'specialist') return 'bg-critical-soft text-critical'
  return 'bg-purple-soft text-purple'
}

function title(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function labelChannel(channel: Interaction['channel']) {
  return { whatsapp: 'WhatsApp', phone: 'Phone', chat: 'Chat', email: 'Email' }[channel]
}
