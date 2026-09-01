import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Bot,
  CalendarClock,
  FileText,
  GraduationCap,
  Headphones,
  Languages,
  Library,
  MessageSquare,
  Radar,
  Route,
  ShieldCheck,
  Tags,
  Terminal,
  UserRound,
  Workflow,
} from 'lucide-react'
import { statusClass } from './AgentActivity'
import { assignmentsFor, HELPERS, helperOwnerLabel, type HelperId, type HelperStatus } from './agentWork'
import { useDemo } from './store'
import type { Interaction, ServiceCase, SupervisorRoute } from './types'

const ICONS: Record<HelperId, typeof Languages> = {
  intent: Tags,
  routing: Route,
  knowledge: Library,
  summariser: Languages,
  calendar: CalendarClock,
  inventory: Radar,
  rules: BookOpen,
  policy: ShieldCheck,
  gds: Terminal,
  draft: MessageSquare,
  quality: GraduationCap,
}

const LEAD_AGENTS = [
  {
    id: 'genesys',
    simple: 'Takes the message',
    name: 'Genesys',
    job: 'Takes the traveller’s WhatsApp, phone call, chat, or email and opens the trip. You do not create the case.',
    icon: Headphones,
  },
  {
    id: 'ava',
    simple: 'Tickets when it is safe',
    name: 'Ava',
    job: 'Books the new flight when the ticket, waiver, and seats are already confirmed. You do not type GDS.',
    icon: Bot,
  },
] as const

const FEATURED = ['int-jordan', 'int-maya', 'int-daniel'] as const

export function AgentOrchestration() {
  const { interactions, cases, selectedInteractionId, dispatch } = useDemo()
  const navigate = useNavigate()
  const selected = interactions.find((i) => i.id === selectedInteractionId) ?? interactions[0]
  const selectedCase = cases.find((c) => c.id === selected?.caseId)
  const work = useMemo(() => (selectedCase ? assignmentsFor(selectedCase) : []), [selectedCase])
  const playback = useOrchPlayback(selected?.id, Math.max(HELPERS.length - 1, 0))
  const owner = ownerCopy(selected, selectedCase)

  return (
    <div className="mx-auto max-w-[920px]">
      <div className="mb-5">
        <h1 className="text-[28px] font-medium tracking-tight">Who is helping you</h1>
        <p className="mt-1 text-sm text-muted">
          Ava talks to the traveller and tickets when it is safe. Copilot is TravelXen on your desk — it proposes; you attest when a person is needed.
        </p>
        <p className="mt-2 text-sm text-ink">
          <Link to="/context" className="font-medium text-purple underline-offset-2 hover:underline">
            Back to this trip’s context
          </Link>
        </p>
      </div>

      <section className="card mb-5 p-4">
        <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">What each AI agent does</div>
        <p className="mt-1 text-[13px] text-muted">Copilot helps you. Ava tickets. Read this list, then pick a trip.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {LEAD_AGENTS.filter((agent) => agent.id === 'genesys').map((agent) => {
            const Icon = agent.icon
            return (
              <div key={agent.id} className="rounded-xl border border-line bg-canvas px-3 py-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-purple">
                    <Icon size={14} />
                  </span>
                  <div>
                    <div className="text-sm font-medium">{agent.simple}</div>
                    <div className="text-[11px] text-muted">{agent.name}</div>
                  </div>
                </div>
                <p className="mt-2 text-[13px] text-ink">{agent.job}</p>
                <div className="mt-2 text-[10px] font-medium tracking-[0.12em] text-muted uppercase">Channel</div>
              </div>
            )
          })}
          {HELPERS.map((h) => {
            const Icon = ICONS[h.id]
            const assignment = work.find((w) => w.helperId === h.id)
            const onTrip = Boolean(assignment) && !assignment?.skip
            return (
              <div key={h.id} className={`rounded-xl border px-3 py-3 ${onTrip ? 'border-purple/40 bg-purple-soft/30' : 'border-line bg-canvas'}`}>
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-purple">
                    <Icon size={14} />
                  </span>
                  <div>
                    <div className="text-sm font-medium">{h.simple}</div>
                    <div className="text-[11px] text-muted">{h.name}</div>
                  </div>
                </div>
                <p className="mt-2 text-[13px] text-ink">{h.job}</p>
                <div className="mt-2 text-[10px] font-medium tracking-[0.12em] text-purple uppercase">{helperOwnerLabel()}</div>
              </div>
            )
          })}
          {LEAD_AGENTS.filter((agent) => agent.id === 'ava').map((agent) => {
            const Icon = agent.icon
            return (
              <div key={agent.id} className="rounded-xl border border-teal/30 bg-teal-soft/40 px-3 py-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-teal">
                    <Icon size={14} />
                  </span>
                  <div>
                    <div className="text-sm font-medium">{agent.simple}</div>
                    <div className="text-[11px] text-muted">{agent.name}</div>
                  </div>
                </div>
                <p className="mt-2 text-[13px] text-ink">{agent.job}</p>
                <div className="mt-2 text-[10px] font-medium tracking-[0.12em] text-teal uppercase">Ava · tickets</div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {FEATURED.map((id) => {
          const item = interactions.find((i) => i.id === id)
          const c = cases.find((x) => x.id === item?.caseId)
          if (!item || !c) return null
          const on = item.id === selected?.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                dispatch({ type: 'select-interaction', id: item.id })
                dispatch({ type: 'select-case', id: item.caseId })
              }}
              className={`card p-4 text-left ${on ? 'ring-2 ring-purple' : 'hover:border-purple/40'}`}
            >
              <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">{pathLabel(item, c)}</div>
              <div className="mt-1 text-sm font-medium">{item.traveller}</div>
              <p className="mt-1 text-[12px] text-muted">{pathHint(item, c)}</p>
            </button>
          )
        })}
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {interactions
          .filter((i) => !FEATURED.includes(i.id as (typeof FEATURED)[number]))
          .map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                dispatch({ type: 'select-interaction', id: item.id })
                dispatch({ type: 'select-case', id: item.caseId })
              }}
              className={`rounded-full px-3 py-1 text-[12px] font-medium ${
                item.id === selected?.id ? 'bg-ink text-white' : 'bg-white text-muted ring-1 ring-line'
              }`}
            >
              {item.traveller.split(' ')[0]}
            </button>
          ))}
      </div>

      {selected && selectedCase ? (
        <>
          <section className="card mb-4 overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3">
              <div>
                <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">Who should handle this trip</div>
                <div className="mt-1 flex items-center gap-2 text-sm font-medium">
                  <span className={`grid h-8 w-8 place-items-center rounded-lg ${owner.tone}`}>{owner.icon}</span>
                  {owner.headline}
                </div>
              </div>
              <span className={`chip ${routeChip(selected.supervisor.routeTo)}`}>{routeLabel(selected.supervisor.routeTo)}</span>
            </div>
            <p className="px-4 py-3 text-sm">{plainReason(selected, selectedCase)}</p>
          </section>

          <section className="card mb-4 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
              <div>
                <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">What they already did</div>
                <div className="text-sm font-medium">Play this to watch each agent work on {selected.traveller.split(' ')[0]}.</div>
              </div>
              <button type="button" className="btn btn-primary text-xs" onClick={playback.play}>
                Play
              </button>
            </div>
            <ol className="divide-y divide-line">
              {HELPERS.map((h, i) => {
                const row = work.find((w) => w.helperId === h.id)
                const skipped = !row || row.skip
                const visible = playback.step >= i
                const active = playback.playing && playback.step === i && !skipped
                const status: HelperStatus = skipped ? 'skipped' : !visible ? 'idle' : active ? 'working' : row.blocked ? 'blocked' : 'done'
                const Icon = ICONS[h.id]
                return (
                  <li key={h.id}>
                    <button
                      type="button"
                      onClick={() => playback.jump(i)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left ${
                        active ? 'bg-purple-soft/50' : skipped ? 'bg-white opacity-50' : visible ? 'bg-white' : 'bg-white opacity-45'
                      }`}
                    >
                      <span
                        className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                          active ? 'bg-purple text-white' : 'bg-canvas text-muted'
                        }`}
                      >
                        <Icon size={14} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">{h.simple}</span>
                          <span className="text-[11px] text-muted">{h.name}</span>
                          <span className="text-[10px] font-medium tracking-[0.12em] text-purple uppercase">{helperOwnerLabel()}</span>
                          <span className={`chip ${statusClass(status)}`}>{statusWord(status, active)}</span>
                        </span>
                        <span className="mt-0.5 block text-[13px] text-ink">{h.job}</span>
                        <span className="mt-0.5 block text-[13px] text-muted">
                          {skipped ? 'Not needed on this trip.' : visible ? row.result : 'Waiting to run on this trip.'}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </section>

          <div className="mb-5">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                dispatch({ type: 'open-case', id: selected.caseId })
                navigate('/workspace')
              }}
            >
              <Workflow size={15} /> Open this trip
            </button>
          </div>
        </>
      ) : null}

      <section className="card p-4">
        <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">When you ticket vs when Ava tickets</div>
        <ul className="mt-3 space-y-3 text-sm">
          <li>
            <div className="font-medium">Ticket already issued, waiver exists, seats checked in the last 5 minutes</div>
            <p className="text-[13px] text-muted">Ava tickets. Example: Jordan Hale. You do not type anything.</p>
          </li>
          <li>
            <div className="font-medium">Traveller asked for a person</div>
            <p className="text-[13px] text-muted">You confirm the meeting time. Then Ava tickets. Example: Maya Patel.</p>
          </li>
          <li>
            <div className="font-medium">Seat check is older than 5 minutes</div>
            <p className="text-[13px] text-muted">Do not ticket. Refresh first. Example: Daniel Kim.</p>
          </li>
        </ul>
      </section>
    </div>
  )
}

function pathLabel(item: Interaction, c: ServiceCase) {
  if (c.gdsFacts?.length) return 'Ava can ticket'
  if (item.supervisor.routeTo === 'human' && c.workflow === 'triage') return 'Wait'
  if (item.supervisor.routeTo === 'human') return 'Needs you'
  if (item.supervisor.routeTo === 'specialist') return 'Not travel'
  return 'Ava can ticket'
}

function pathHint(item: Interaction, c: ServiceCase) {
  if (c.gdsFacts?.length) return 'Flight delayed. Missed connection. Ava tickets the next flight.'
  if (c.id === 'case-maya') return 'She asked for a person. You confirm the meeting, then Ava tickets.'
  if (c.id === 'case-daniel') return 'Seat list may be out of date. Do not ticket yet.'
  return item.intent
}

function plainReason(selected: Interaction, c: ServiceCase) {
  if (c.gdsFacts?.length) {
    return 'The ticket is already issued. Rebooking is allowed. The airline waiver is available. Seats were checked 2 minutes ago. Ava can ticket. You do not take this chat.'
  }
  if (c.id === 'case-maya') {
    return 'Ava offered a self-serve rebook. Maya asked for a person so her business fare and 19:30 meeting stay protected. You confirm the meeting time. Then Ava tickets.'
  }
  if (c.id === 'case-daniel') {
    return 'The flight was cancelled. The seat list is more than 5 minutes old. Do not ticket until it is refreshed.'
  }
  if (selected.supervisor.routeTo === 'specialist') {
    return 'This is a visa or documents question. A travel consultant must not answer it. Send it to a documents specialist.'
  }
  return selected.supervisor.reason
}

function ownerCopy(selected?: Interaction, c?: ServiceCase) {
  const route = selected?.supervisor.routeTo
  if (route === 'ava') {
    return {
      headline: c?.gdsFacts?.length ? 'Ava tickets this. Leave the chat.' : 'Ava owns this. Leave the chat.',
      icon: <Bot size={15} />,
      tone: 'bg-teal-soft text-teal',
    }
  }
  if (route === 'specialist') {
    return {
      headline: 'Send to a documents specialist. Do not advise.',
      icon: <FileText size={15} />,
      tone: 'bg-critical-soft text-critical',
    }
  }
  return {
    headline: 'You confirm one thing. Ava still tickets.',
    icon: <UserRound size={15} />,
    tone: 'bg-purple-soft text-purple',
  }
}

function statusWord(status: HelperStatus, active: boolean) {
  if (active) return 'Working now'
  if (status === 'done') return 'Done'
  if (status === 'blocked') return 'Stopped'
  if (status === 'skipped') return 'Not needed'
  return 'Waiting'
}

function useOrchPlayback(interactionId?: string, maxStep = 0) {
  const [step, setStep] = useState(maxStep)
  const [playing, setPlaying] = useState(false)
  const timers = useRef<number[]>([])
  const maxRef = useRef(maxStep)
  maxRef.current = maxStep

  function clear() {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  function play() {
    clear()
    setPlaying(true)
    setStep(0)
    const last = maxRef.current
    timers.current = Array.from({ length: last + 1 }, (_, n) =>
      window.setTimeout(() => {
        setStep(n)
        if (n === last) setPlaying(false)
      }, 550 * n),
    )
  }

  function jump(n: number) {
    clear()
    setPlaying(false)
    setStep(Math.max(0, Math.min(maxRef.current, n)))
  }

  useEffect(() => {
    play()
    return clear
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactionId])

  return { step, playing, play, jump }
}

function routeLabel(route: SupervisorRoute) {
  if (route === 'ava') return 'Ava tickets'
  if (route === 'specialist') return 'Documents specialist'
  return 'You confirm, then Ava'
}

function routeChip(route: SupervisorRoute) {
  if (route === 'ava') return 'bg-teal-soft text-teal'
  if (route === 'specialist') return 'bg-critical-soft text-critical'
  return 'bg-purple-soft text-purple'
}
