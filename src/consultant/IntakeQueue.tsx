import { useNavigate } from 'react-router-dom'
import {
  Bot,
  Clock,
  Mail,
  MessageCircle,
  MessagesSquare,
  Phone,
  Sparkles,
  Workflow,
} from 'lucide-react'
import { useDemo } from './store'
import { ChannelLabel, Confidence, MetricCard, PriorityChip, SectionTitle, SourceTag, StateChip } from './ui'
import { GenesysIntakeBar, useInboundPlayback } from './PipelineBar'
import { InboxAgentStrip } from './AgentActivity'
import { RouteChip, SupervisorTape } from './SupervisorTape'
import type { AvaRun, Channel, Interaction, ServiceCase } from './types'

const channelIcon = {
  whatsapp: MessageCircle,
  phone: Phone,
  chat: MessagesSquare,
  email: Mail,
} as const

function matchesSearch(i: Interaction, q: string) {
  if (!q.trim()) return true
  const hay = `${i.traveller} ${i.company} ${i.intent} ${i.caseId} ${i.genesysId}`.toLowerCase()
  return hay.includes(q.trim().toLowerCase())
}

export function IntakeQueue() {
  const {
    interactions,
    cases,
    search,
    selectedInteractionId,
    dispatch,
    openCases,
    urgentDisruptions,
    avaResolvedToday,
    contextCompleteness,
    avaRuns,
  } = useDemo()
  const navigate = useNavigate()
  const visible = interactions.filter((i) => matchesSearch(i, search))
  const selected = interactions.find((i) => i.id === selectedInteractionId) ?? visible[0]
  const selectedCase = cases.find((c) => c.id === selected?.caseId)
  const playback = useInboundPlayback(selected?.id)

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-5">
        <h1 className="text-[28px] font-medium tracking-tight">Inbox</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Genesys creates the case. Ava contains what it can. Consultants only take judgment, exceptions, and specialist routes.
        </p>
      </div>

      <GenesysIntakeBar
        interaction={selected}
        serviceCase={selectedCase}
        active={playback.active}
        playing={playback.playing}
        onReplay={playback.play}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Open cases" value={String(openCases)} hint="TravelXen · demo data" />
        <MetricCard label="Urgent disruptions" value={String(urgentDisruptions)} hint="Same-day IRROPS" />
        <MetricCard label="Ava resolved today" value={`${avaResolvedToday}%`} hint="Hand in-policy work back to raise this" />
        <MetricCard label="Average handoff context completeness" value={`${contextCompleteness}%`} hint="Identity + intent + booking" />
      </div>

      <AvaLiveBoard
        runs={avaRuns}
        onOpen={(run) => {
          if (!run.caseId) return
          const interaction = interactions.find((i) => i.caseId === run.caseId)
          if (interaction) dispatch({ type: 'select-interaction', id: interaction.id })
        }}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section>
          <SectionTitle title="Inbound interactions" />
          <div className="space-y-2">
            {visible.map((item) => {
              const Icon = channelIcon[item.channel as Channel]
              const active = item.id === selected?.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => dispatch({ type: 'select-interaction', id: item.id })}
                  className={`card flex w-full items-start gap-3 px-4 py-3 text-left transition ${
                    active ? 'ring-2 ring-purple' : 'hover:border-purple/30'
                  }`}
                >
                  <span
                    className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                      item.channel === 'whatsapp' ? 'bg-teal-soft text-teal' : 'bg-purple-soft text-purple'
                    }`}
                  >
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{item.traveller}</span>
                      <span className="text-[12px] text-muted">{item.company}</span>
                      <PriorityChip value={item.priority} />
                      <RouteChip route={item.supervisor.routeTo} />
                      <StateChip value={item.state} />
                    </span>
                    <span className="mt-1 block text-sm">{item.intent}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-muted">
                      <ChannelLabel channel={item.channel} />
                      <span>· {item.time}</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} /> {item.wait} wait
                      </span>
                      <span>{item.genesysId}</span>
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <aside className="space-y-3">
          <SupervisorTape interaction={selected} active={playback.active} playing={playback.playing} />
          <CaseCreationPanel
            interaction={selected}
            serviceCase={selectedCase}
            active={playback.active}
            playing={playback.playing}
            onOpen={() => {
              if (!selected) return
              dispatch({ type: 'open-case', id: selected.caseId })
              navigate('/workspace')
            }}
          />
          {playback.active >= 3 && selectedCase ? (
            <InboxAgentStrip
              c={selectedCase}
              onOpen={() => {
                if (!selected) return
                dispatch({ type: 'select-interaction', id: selected.id })
                navigate('/orchestration')
              }}
            />
          ) : null}

          {playback.active >= 3 && selectedCase ? (
            <section className="card p-4">
              <SectionTitle
                title="Ava attempt"
                action={
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal">
                    <Sparkles size={12} /> Self-service
                  </span>
                }
              />
              <ul className="space-y-2 text-sm">
                {selectedCase.transcript.slice(0, 3).map((line) => (
                  <li key={line.time + line.from} className="rounded-lg bg-canvas px-3 py-2">
                    <div className="text-[11px] font-semibold text-muted">
                      {line.time} · {line.from}
                    </div>
                    <div className="mt-0.5">{line.text}</div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  )
}

function AvaLiveBoard({ runs, onOpen }: { runs: AvaRun[]; onOpen: (run: AvaRun) => void }) {
  const running = runs.filter((r) => r.status === 'running')
  const resolved = runs.filter((r) => r.status === 'resolved').slice(0, 4)
  return (
    <section className="card mb-5 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.12em] text-muted uppercase">
            <Bot size={12} className="text-purple" /> Ava live
          </div>
          <div className="text-sm font-medium">
            {running.length} in progress · {resolved.length} resolved in this snapshot
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal">
          <Sparkles size={12} /> Self-serve first
        </span>
      </div>
      <div className="grid gap-0 md:grid-cols-2">
        <div className="border-b border-line p-4 md:border-r md:border-b-0">
          <div className="mb-2 text-[11px] font-medium tracking-[0.12em] text-muted uppercase">In progress</div>
          <div className="space-y-2">
            {running.map((run) => (
              <button
                key={run.id}
                type="button"
                onClick={() => onOpen(run)}
                className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-left hover:border-purple/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{run.traveller}</span>
                  <span className="chip bg-teal-soft text-teal">Running</span>
                </div>
                <div className="mt-0.5 text-[12px] text-muted">
                  {run.intent} · {run.outcome}
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="p-4">
          <div className="mb-2 text-[11px] font-medium tracking-[0.12em] text-muted uppercase">Resolved without consultant</div>
          <ul className="space-y-2">
            {resolved.map((run) => (
              <li key={run.id} className="flex items-start justify-between gap-3 text-sm">
                <span>
                  <span className="font-medium">{run.traveller}</span>
                  <span className="mt-0.5 block text-[12px] text-muted">
                    {run.intent} · {run.outcome}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] text-muted">{run.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function CaseCreationPanel({
  interaction,
  serviceCase,
  active,
  playing,
  onOpen,
}: {
  interaction?: Interaction
  serviceCase?: ServiceCase
  active: number
  playing: boolean
  onOpen: () => void
}) {
  const created = active >= 4 && interaction && serviceCase
  const drafting = active > 0 && active < 4

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">TravelXen case</div>
          <div className="text-sm font-medium">{created ? serviceCase.caseNumber : 'Waiting for Genesys inbound'}</div>
        </div>
        {created ? (
          <span className="chip bg-teal-soft text-teal">Created automatically</span>
        ) : drafting ? (
          <span className="chip bg-amber-soft text-amber">Writing from Genesys…</span>
        ) : (
          <span className="chip bg-canvas text-muted">Idle</span>
        )}
      </div>

      <div className="space-y-2 px-4 py-3">
        <FieldRow show={active >= 1} label="Traveller" value={interaction?.traveller} />
        <FieldRow show={active >= 1} label="Channel" value={interaction ? channelName(interaction.channel) : undefined} />
        <FieldRow show={active >= 2} label="Genesys ID" value={interaction?.genesysId} />
        <FieldRow show={active >= 2} label="Queue / skill" value={interaction?.routing} />
        <FieldRow show={active >= 3} label="Intent" value={interaction?.intent} />
        <FieldRow show={active >= 3} label="Ava" value={interaction?.ava} />
        <FieldRow show={active >= 4} label="Case" value={serviceCase?.caseNumber} />
        <FieldRow show={active >= 4} label="PNR" value={serviceCase?.pnr} />
        <FieldRow show={active >= 4} label="Completeness" value={serviceCase ? `${serviceCase.contextCompleteness}%` : undefined} />
      </div>

      {playing && active < 4 ? (
        <p className="border-t border-line bg-canvas px-4 py-2 text-[12px] text-muted">
          No agent is opening a ticket. Genesys identity is streaming into TravelXen.
        </p>
      ) : null}

      {created ? (
        <div className="border-t border-line bg-purple-soft/40 px-4 py-3">
          <p className="text-[12px] leading-relaxed text-ink">
            {interaction.traveller} contacted via <ChannelLabel channel={interaction.channel} />. TravelXen opened{' '}
            <span className="font-medium">{serviceCase.caseNumber}</span> automatically — no consultant typed a case.
          </p>
          <div className="mt-2 flex items-center justify-between rounded-lg bg-white px-3 py-2">
            <span className="text-xs text-muted">Brief confidence</span>
            <Confidence value={serviceCase.confidence} />
          </div>
          <button type="button" className="btn btn-primary mt-3 w-full" onClick={onOpen}>
            <Workflow size={15} />
            Open trip
          </button>
          <p className="mt-2 text-[11px] text-muted">
            <SourceTag system="Genesys → TravelXen" freshness="auto" />
          </p>
        </div>
      ) : null}
    </section>
  )
}

function FieldRow({ show, label, value }: { show: boolean; label: string; value?: string }) {
  return (
    <div className={`flex items-start justify-between gap-3 text-sm transition-opacity ${show ? 'opacity-100' : 'opacity-35'}`}>
      <span className="text-muted">{label}</span>
      {show && value ? (
        <span className="max-w-[220px] text-right font-medium">{value}</span>
      ) : (
        <span className="h-4 w-28 animate-pulse rounded bg-canvas" />
      )}
    </div>
  )
}

function channelName(channel: Channel) {
  return { whatsapp: 'WhatsApp', phone: 'Phone', chat: 'Chat', email: 'Email' }[channel]
}
