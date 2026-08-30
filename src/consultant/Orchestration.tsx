import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  Headphones,
  Shield,
  Sparkles,
  UserRound,
  Workflow,
} from 'lucide-react'
import { HelperBoard, NowWorking, statusClass } from './AgentActivity'
import {
  assignmentsFor,
  flowPhases,
  HELPERS,
  helperDef,
  liveStatus,
  phaseIndexForHelper,
  statusAtPhase,
  statusLabel,
  type FlowPhase,
  type HelperId,
  type HelperStatus,
} from './agentWork'
import { useDemo } from './store'
import { ChannelLabel, MetricCard } from './ui'
import { DeskCopilot } from './DeskCopilot'
import type { Interaction, ServiceCase, SupervisorRoute } from './types'

export function AgentOrchestration() {
  const { interactions, cases, signals, avaRuns, selectedInteractionId, dispatch } = useDemo()
  const navigate = useNavigate()
  const selected = interactions.find((i) => i.id === selectedInteractionId) ?? interactions[0]
  const selectedCase = cases.find((c) => c.id === selected?.caseId)
  const phases = useMemo(
    () =>
      selected && selectedCase
        ? flowPhases(
            selectedCase,
            selected.supervisor.routeTo,
            selected.channel,
            selected.genesysId,
            selected.routing,
            selected.supervisor.reason,
          )
        : [],
    [selected, selectedCase],
  )
  const playback = useOrchPlayback(selected?.id, Math.max(phases.length - 1, 0))
  const [pickedHelper, setPickedHelper] = useState<HelperId | null>(null)

  const current = phases[playback.step]
  const selectedHelper = pickedHelper ?? current?.helperId ?? null

  const statuses = useMemo(() => {
    const map = {} as Record<HelperId, HelperStatus>
    if (!selectedCase) return map
    const work = assignmentsFor(selectedCase)
    for (const h of HELPERS) {
      const assignment = work.find((w) => w.helperId === h.id)
      if (!assignment) {
        map[h.id] = 'skipped'
        continue
      }
      const idx = phaseIndexForHelper(phases, h.id)
      map[h.id] = idx >= 0 ? statusAtPhase(assignment, idx, playback.step, playback.playing, selectedCase) : liveStatus(assignment, selectedCase)
    }
    return map
  }, [selectedCase, phases, playback.step, playback.playing])

  const routed = {
    ava: interactions.filter((i) => i.supervisor.routeTo === 'ava').length,
    human: interactions.filter((i) => i.supervisor.routeTo === 'human').length,
    specialist: interactions.filter((i) => i.supervisor.routeTo === 'specialist').length,
  }
  const playbooks = buildPlaybooks(cases, signals)

  function selectHelper(id: HelperId) {
    setPickedHelper(id)
    const idx = phaseIndexForHelper(phases, id)
    if (idx >= 0) playback.jump(idx)
  }

  const nowName = current?.helperId ? helperDef(current.helperId).name : current?.actor ?? 'Waiting'
  const nowDoing = current?.title ?? 'Replay a contact to watch helpers work.'

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-5">
        <h1 className="text-[28px] font-medium tracking-tight">Agents</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Qualified GDS agents are scarce. Replay a contact to watch each helper work — summarise, read rules, shop inventory, propose commands. The consultant only attests.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Supervisor → Ava" value={String(routed.ava)} hint="Contained or Ava-owned" />
        <MetricCard label="Supervisor → consultant" value={String(routed.human)} hint="Judgment / attest only" />
        <MetricCard label="Supervisor → specialist" value={String(routed.specialist)} hint="Out of travel scope" />
        <MetricCard label="GDS commands typed" value="0" hint="Ava proposes · consultant attests" />
      </div>

      <SupervisorHub selected={selected} playing={playback.playing} step={playback.step} />

      <AgentStrip route={selected?.supervisor.routeTo} step={playback.step} phases={phases} />

      <NowWorking name={nowName} doing={nowDoing} playing={playback.playing} />

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">How they work this contact</h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-ghost text-xs" onClick={playback.prev} aria-label="Previous step">
                <ChevronLeft size={14} /> Prev
              </button>
              <button type="button" className="btn btn-primary text-xs" onClick={playback.play}>
                Replay helpers
              </button>
              <button type="button" className="btn btn-ghost text-xs" onClick={playback.next} aria-label="Next step">
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {interactions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setPickedHelper(null)
                  dispatch({ type: 'select-interaction', id: item.id })
                }}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${
                  item.id === selected?.id ? 'bg-ink text-white' : 'bg-white text-muted ring-1 ring-line'
                }`}
              >
                {item.traveller.split(' ')[0]}
                <span className="ml-1.5 opacity-70">{shortRoute(item.supervisor.routeTo)}</span>
              </button>
            ))}
          </div>
          <HandoffTape
            interaction={selected}
            phases={phases}
            step={playback.step}
            playing={playback.playing}
            onJump={(i) => {
              const phase = phases[i]
              setPickedHelper(phase?.helperId ?? null)
              playback.jump(i)
            }}
          />
          {selectedCase ? (
            <HelperBoard c={selectedCase} statuses={statuses} selectedId={selectedHelper} onSelect={selectHelper} />
          ) : null}
          {selectedCase ? (
            <div className="mt-4">
              <DeskCopilot c={selectedCase} />
            </div>
          ) : null}
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
  const scored = step >= 1
  const decided = step >= 2
  return (
    <section className="mb-5 overflow-hidden rounded-[14px] border border-line bg-ink text-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <div>
          <div className="text-[11px] font-medium tracking-[0.12em] text-white/50 uppercase">AI Supervisor</div>
          <div className="text-sm font-medium">Scores every inbound, then picks Ava, a consultant, or a specialist</div>
        </div>
        {playing && step < 2 ? (
          <span className="chip bg-amber-soft text-amber">Scoring…</span>
        ) : decided && d ? (
          <span className={`chip ${routeChip(d.routeTo)}`}>{routeLabel(d.routeTo)}</span>
        ) : (
          <span className="chip bg-white/10 text-white/70">Waiting for Genesys</span>
        )}
      </div>
      <div className="grid gap-0 md:grid-cols-6">
        <ScoreCell label="Intent" value={selected?.intent} show={step >= 0} />
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

function AgentStrip({ route, step, phases }: { route?: SupervisorRoute; step: number; phases: FlowPhase[] }) {
  const ownerOn = phases.findIndex((p) => p.id === 'owner')
  const qualityOn = phases.findIndex((p) => p.helperId === 'quality')
  const helperOn = step >= 3 && (ownerOn < 0 || step < ownerOn)
  const nodes = [
    { id: 'genesys', name: 'Genesys', icon: Headphones, on: step >= 0 },
    { id: 'supervisor', name: 'Supervisor', icon: Shield, on: step >= 1 },
    { id: 'helpers', name: 'GDS helpers', icon: Sparkles, on: helperOn },
    { id: 'ava', name: 'Ava', icon: Bot, on: ownerOn >= 0 && step >= ownerOn && route === 'ava' },
    { id: 'consultant', name: 'Consultant', icon: UserRound, on: ownerOn >= 0 && step >= ownerOn && route === 'human' },
    { id: 'specialist', name: 'Specialist', icon: FileText, on: ownerOn >= 0 && step >= ownerOn && route === 'specialist' },
    { id: 'quality', name: 'Quality → Ava', icon: GraduationCap, on: qualityOn >= 0 && step >= qualityOn },
  ]
  return (
    <ol className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
      {nodes.map((n) => {
        const Icon = n.icon
        const chosen =
          (n.id === 'ava' && route === 'ava') ||
          (n.id === 'consultant' && route === 'human') ||
          (n.id === 'specialist' && route === 'specialist') ||
          n.id === 'genesys' ||
          n.id === 'supervisor' ||
          n.id === 'helpers' ||
          n.id === 'quality'
        return (
          <li
            key={n.id}
            className={`card flex items-center gap-2 px-3 py-2 text-sm ${n.on ? 'ring-2 ring-purple' : chosen ? '' : 'opacity-40'}`}
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
  phases,
  step,
  playing,
  onJump,
}: {
  interaction?: Interaction
  phases: FlowPhase[]
  step: number
  playing: boolean
  onJump: (index: number) => void
}) {
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
        {playing ? <span className="chip bg-amber-soft text-amber">Live</span> : <span className="chip bg-canvas text-muted">Paused · click a step</span>}
      </div>
      <ol className="divide-y divide-line">
        {phases.map((line, i) => {
          const visible = step >= i
          const active = step === i
          const status: HelperStatus = !visible ? 'idle' : active && playing ? 'working' : 'done'
          return (
            <li key={line.id}>
              <button
                type="button"
                onClick={() => onJump(i)}
                className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left ${
                  active ? 'bg-purple-soft/40' : visible ? 'bg-white' : 'bg-white opacity-40'
                }`}
              >
                <div>
                  <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">{line.actor}</div>
                  <div className="text-sm font-medium">{line.title}</div>
                  <p className="mt-0.5 text-[13px] text-muted">{visible ? line.detail : 'Waiting…'}</p>
                </div>
                <span className={`chip shrink-0 ${statusClass(status)}`}>{active && playing ? 'Working' : statusLabel(status)}</span>
              </button>
            </li>
          )
        })}
      </ol>
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
      id: 'pb-gds-waiver',
      title: 'Issued ticket + waiver + fresh GDS → Ava',
      rule: 'If the ticket is issued, eligibility is confirmed, an airline waiver is available, and supplier data is under 5 minutes, Ava reissues. Consultant does not type GDS.',
      from: handed.some((c) => c.id === 'case-jordan')
        ? 'Live from Jordan Hale BA 117 / AA 198 this session'
        : 'Live pattern from BA 117 delay / missed AA 198',
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
      }, 650 * n),
    )
  }

  function jump(n: number) {
    clear()
    setPlaying(false)
    setStep(Math.max(0, Math.min(maxRef.current, n)))
  }

  function next() {
    jump(step + 1)
  }

  function prev() {
    jump(step - 1)
  }

  useEffect(() => {
    play()
    return clear
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactionId])

  return { step, playing, play, jump, next, prev }
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
