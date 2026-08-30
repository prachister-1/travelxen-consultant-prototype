import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Bot,
  CalendarClock,
  GraduationCap,
  Languages,
  MessageSquare,
  Radar,
  ShieldCheck,
  Terminal,
  UserRound,
  FileText,
  Workflow,
} from 'lucide-react'
import { statusClass } from './AgentActivity'
import {
  assignmentsFor,
  helperDef,
  type HelperId,
  type HelperStatus,
} from './agentWork'
import { useDemo } from './store'
import type { Interaction, ServiceCase, SupervisorRoute } from './types'

const ICONS: Record<HelperId, typeof Languages> = {
  summariser: Languages,
  calendar: CalendarClock,
  inventory: Radar,
  rules: BookOpen,
  policy: ShieldCheck,
  gds: Terminal,
  draft: MessageSquare,
  quality: GraduationCap,
}

const FEATURED = ['int-jordan', 'int-maya', 'int-daniel'] as const

export function AgentOrchestration() {
  const { interactions, cases, selectedInteractionId, dispatch } = useDemo()
  const navigate = useNavigate()
  const selected = interactions.find((i) => i.id === selectedInteractionId) ?? interactions[0]
  const selectedCase = cases.find((c) => c.id === selected?.caseId)
  const work = useMemo(
    () => (selectedCase ? assignmentsFor(selectedCase).filter((a) => !a.skip) : []),
    [selectedCase],
  )
  const playback = useOrchPlayback(selected?.id, Math.max(work.length - 1, 0))
  const owner = ownerCopy(selected, selectedCase)

  return (
    <div className="mx-auto max-w-[820px]">
      <div className="mb-5">
        <h1 className="text-[28px] font-medium tracking-tight">Agents</h1>
        <p className="mt-1 text-sm text-muted">
          Pick a contact. See who owns it. Replay what the helpers already did. Then open the trip.
        </p>
      </div>

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
              onClick={() => dispatch({ type: 'select-interaction', id: item.id })}
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
              onClick={() => dispatch({ type: 'select-interaction', id: item.id })}
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
                <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">Who owns this</div>
                <div className="mt-1 flex items-center gap-2 text-sm font-medium">
                  <span className={`grid h-8 w-8 place-items-center rounded-lg ${owner.tone}`}>{owner.icon}</span>
                  {owner.headline}
                </div>
              </div>
              <span className={`chip ${routeChip(selected.supervisor.routeTo)}`}>{routeLabel(selected.supervisor.routeTo)}</span>
            </div>
            <p className="px-4 py-3 text-sm text-ink">{selected.supervisor.reason}</p>
          </section>

          <section className="card mb-4 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
              <div>
                <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">Helpers on this contact</div>
                <div className="text-sm font-medium">Consultant does not type GDS. Helpers already did the cryptic.</div>
              </div>
              <button type="button" className="btn btn-primary text-xs" onClick={playback.play}>
                Replay
              </button>
            </div>
            <ol className="divide-y divide-line">
              {work.map((row, i) => {
                const visible = playback.step >= i
                const active = playback.playing && playback.step === i
                const status: HelperStatus = !visible ? 'idle' : active ? 'working' : 'done'
                const Icon = ICONS[row.helperId]
                const def = helperDef(row.helperId)
                return (
                  <li key={row.helperId}>
                    <button
                      type="button"
                      onClick={() => playback.jump(i)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left ${
                        active ? 'bg-purple-soft/50' : visible ? 'bg-white' : 'bg-white opacity-45'
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
                          <span className="text-sm font-medium">{def.name}</span>
                          <span className={`chip ${statusClass(status)}`}>{active ? 'Working' : visible ? 'Done' : 'Queued'}</span>
                        </span>
                        <span className="mt-0.5 block text-[13px] text-muted">{visible ? row.result : row.doing}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </section>

          <div className="mb-5 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                dispatch({ type: 'open-case', id: selected.caseId })
                navigate('/workspace')
              }}
            >
              <Workflow size={15} /> Open {selected.traveller.split(' ')[0]}’s trip
            </button>
          </div>
        </>
      ) : null}

      <section className="card p-4">
        <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">Three rules Ava follows</div>
        <ul className="mt-3 space-y-3 text-sm">
          <li>
            <div className="font-medium">Issued ticket + waiver + snapshot under 5 min → Ava tickets</div>
            <p className="text-[13px] text-muted">Jordan Hale. Consultant does not open GDS.</p>
          </li>
          <li>
            <div className="font-medium">Traveller asked for a person → consultant attests, then Ava</div>
            <p className="text-[13px] text-muted">Maya Patel. Attest the meeting. Hand EI 60 back.</p>
          </li>
          <li>
            <div className="font-medium">Stale inventory → never autopilot</div>
            <p className="text-[13px] text-muted">Daniel Kim. Refresh first, then Ava may ticket.</p>
          </li>
        </ul>
      </section>
    </div>
  )
}

function pathLabel(item: Interaction, c: ServiceCase) {
  if (c.gdsFacts?.length) return 'Ava GDS'
  if (item.supervisor.routeTo === 'human' && c.workflow === 'triage') return 'Hold'
  if (item.supervisor.routeTo === 'human') return 'Human'
  if (item.supervisor.routeTo === 'specialist') return 'Specialist'
  return 'Ava'
}

function pathHint(item: Interaction, c: ServiceCase) {
  if (c.gdsFacts?.length) return 'BA 117 delay. Ava tickets AA 177.'
  if (c.id === 'case-maya') return 'Asked for a person. Attest EI 60.'
  if (c.id === 'case-daniel') return 'Inventory stale. Do not ticket yet.'
  return item.intent
}

function ownerCopy(selected?: Interaction, c?: ServiceCase) {
  const route = selected?.supervisor.routeTo
  if (route === 'ava') {
    return {
      headline: c?.gdsFacts?.length ? 'Ava tickets. Do not take this chat.' : 'Ava owns this. Leave it.',
      icon: <Bot size={15} />,
      tone: 'bg-teal-soft text-teal',
    }
  }
  if (route === 'specialist') {
    return {
      headline: 'Documents specialist. Ava will not answer.',
      icon: <FileText size={15} />,
      tone: 'bg-critical-soft text-critical',
    }
  }
  return {
    headline: 'Consultant attests. Ava still does the GDS.',
    icon: <UserRound size={15} />,
    tone: 'bg-purple-soft text-purple',
  }
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
  if (route === 'ava') return 'Keep with Ava'
  if (route === 'specialist') return 'Specialist'
  return 'Consultant attests'
}

function routeChip(route: SupervisorRoute) {
  if (route === 'ava') return 'bg-teal-soft text-teal'
  if (route === 'specialist') return 'bg-critical-soft text-critical'
  return 'bg-purple-soft text-purple'
}
