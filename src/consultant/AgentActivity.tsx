import {
  BookOpen,
  CalendarClock,
  GraduationCap,
  Languages,
  Library,
  MessageSquare,
  Radar,
  Route,
  ShieldCheck,
  Tags,
  Terminal,
} from 'lucide-react'
import {
  assignmentsFor,
  HELPERS,
  helperDef,
  liveStatus,
  statusLabel,
  type HelperId,
  type HelperStatus,
} from './agentWork'
import type { ServiceCase } from './types'

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

export function statusClass(status: HelperStatus) {
  if (status === 'working') return 'bg-purple-soft text-purple'
  if (status === 'done') return 'bg-teal-soft text-teal'
  if (status === 'blocked') return 'bg-critical-soft text-critical'
  if (status === 'skipped') return 'bg-canvas text-muted'
  return 'bg-amber-soft text-amber'
}

export function AgentWorkStrip({
  c,
  onOpen,
}: {
  c: ServiceCase
  onOpen?: () => void
}) {
  const rows = assignmentsFor(c)
    .filter((a) => !a.skip)
    .map((a) => ({ ...a, status: liveStatus(a, c) }))
  const working = rows.filter((r) => r.status === 'working' || r.status === 'blocked')
  const shown = (working.length ? working : rows.filter((r) => r.status === 'done')).slice(0, 3)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-wrap items-center gap-2 border-b border-line bg-white px-4 py-2.5 text-left md:px-5"
    >
      <span className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">Agents on this trip</span>
      {shown.map((row) => {
        const Icon = ICONS[row.helperId]
        return (
          <span key={row.helperId} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusClass(row.status)}`}>
            <Icon size={11} />
            {helperDef(row.helperId).simple}
            <span className="opacity-80">· {statusLabel(row.status)}</span>
          </span>
        )
      })}
      {onOpen ? <span className="ml-auto text-[11px] text-purple">See who is working</span> : null}
    </button>
  )
}

export function InboxAgentStrip({ c, onOpen }: { c: ServiceCase; onOpen: () => void }) {
  const rows = assignmentsFor(c)
    .filter((a) => !a.skip)
    .map((a) => ({ ...a, status: liveStatus(a, c) }))
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">Who is working this</div>
          <div className="text-sm font-medium">AI agents do the booking work. You only confirm when needed.</div>
        </div>
        <button type="button" className="btn btn-ghost text-xs" onClick={onOpen}>
          Open Agents
        </button>
      </div>
      <ul className="divide-y divide-line">
        {rows.slice(0, 5).map((row) => {
          const Icon = ICONS[row.helperId]
          return (
            <li key={row.helperId} className="flex items-start gap-2.5 px-4 py-2.5">
              <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${row.status === 'working' ? 'bg-purple text-white' : 'bg-canvas text-muted'}`}>
                <Icon size={13} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-medium">{helperDef(row.helperId).simple}</span>
                  <span className={`chip ${statusClass(row.status)}`}>{statusLabel(row.status)}</span>
                </div>
                <p className="text-[12px] text-muted">{row.doing}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function HelperBoard({
  c,
  statuses,
  selectedId,
  onSelect,
}: {
  c: ServiceCase
  statuses: Record<HelperId, HelperStatus>
  selectedId: HelperId | null
  onSelect: (id: HelperId) => void
}) {
  const work = assignmentsFor(c)
  return (
    <section className="card p-4">
        <h2 className="text-sm font-semibold">AI agents that do the booking work</h2>
        <p className="mt-1 text-[13px] text-muted">
          Click one to see what it is doing. You only confirm when a person is needed.
        </p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {HELPERS.map((h) => {
          const assignment = work.find((w) => w.helperId === h.id)
          const status = statuses[h.id]
          const Icon = ICONS[h.id]
          const selected = selectedId === h.id
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => onSelect(h.id)}
              className={`rounded-xl border px-3 py-3 text-left ${
                selected ? 'border-purple ring-2 ring-purple' : 'border-line bg-canvas'
              } ${status === 'working' ? 'tx-working bg-purple-soft/40' : ''} ${status === 'skipped' ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start gap-2.5">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${status === 'working' ? 'bg-purple text-white' : 'bg-white text-muted'}`}>
                  <Icon size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-medium">{h.simple}</div>
                    <div className="text-[11px] text-muted">{h.name}</div>
                    <span className={`chip ${statusClass(status)}`}>{statusLabel(status)}</span>
                  </div>
                  <p className="mt-1 text-[12px] text-ink">{assignment?.doing ?? h.job}</p>
                  {status !== 'skipped' && assignment ? (
                    <p className="mt-1 text-[12px] text-muted">{assignment.result}</p>
                  ) : (
                    <p className="mt-1 text-[12px] text-muted">{h.speeds}</p>
                  )}
                  <div className="mt-2 text-[10px] font-medium tracking-[0.12em] text-muted uppercase">{h.owner}</div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function NowWorking({
  name,
  doing,
  playing,
}: {
  name: string
  doing: string
  playing: boolean
}) {
  return (
    <div className={`mb-4 flex flex-wrap items-center gap-2 rounded-[14px] border px-4 py-3 ${playing ? 'border-purple bg-purple-soft/50 tx-working' : 'border-line bg-white'}`}>
      <span className="chip bg-purple text-white">{playing ? 'Now working' : 'Selected'}</span>
      <span className="text-sm font-medium">{name}</span>
      <span className="text-[13px] text-muted">{doing}</span>
    </div>
  )
}
