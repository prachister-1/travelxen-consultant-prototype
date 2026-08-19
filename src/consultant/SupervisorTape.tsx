import { useNavigate } from 'react-router-dom'
import type { Interaction, SupervisorRoute } from './types'

const ROUTE_LABEL: Record<SupervisorRoute, string> = {
  ava: 'Keep with Ava',
  human: 'Route to consultant',
  specialist: 'Route to specialist',
}

export function SupervisorTape({
  interaction,
  active,
  playing,
}: {
  interaction?: Interaction
  active: number
  playing: boolean
}) {
  const navigate = useNavigate()
  const d = interaction?.supervisor
  const decided = active >= 4 && d
  const scoring = active >= 3

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line bg-ink px-4 py-3 text-white">
        <div>
          <div className="text-[11px] font-medium tracking-[0.12em] text-white/50 uppercase">AI Supervisor</div>
          <div className="text-sm font-medium">Decision tape · demo data</div>
        </div>
        {playing && active < 4 ? (
          <span className="chip bg-amber-soft text-amber">Scoring…</span>
        ) : decided ? (
          <span className={`chip ${routeChip(d.routeTo)}`}>{ROUTE_LABEL[d.routeTo]}</span>
        ) : (
          <span className="chip bg-white/10 text-white/70">Idle</span>
        )}
      </div>

      <div className="space-y-2 px-4 py-3">
        <Field show={active >= 1} label="Intent" value={interaction?.intent} />
        <Field show={active >= 2} label="Queue" value={interaction?.routing} />
        <Field show={scoring} label="Sentiment" value={d ? title(d.sentiment) : undefined} />
        <Field show={scoring} label="Complexity" value={d ? title(d.complexity) : undefined} />
        <Field show={scoring} label="VIP" value={d ? (d.vip ? 'Yes' : 'No') : undefined} />
        <Field show={scoring} label="Language" value={d?.language} />
        <Field show={active >= 4} label="Supervisor confidence" value={d ? `${d.confidence}%` : undefined} />
        <Field show={active >= 4} label="Decision" value={d ? ROUTE_LABEL[d.routeTo] : undefined} />
      </div>

      {decided ? (
        <div className={`border-t px-4 py-3 text-[12px] leading-relaxed ${reasonTone(d.routeTo)}`}>
          <div className="text-[11px] font-medium tracking-[0.12em] uppercase opacity-70">Why this route</div>
          <p className="mt-1 text-sm text-ink">{d.reason}</p>
          <button
            type="button"
            className="btn btn-ghost mt-3 w-full bg-white text-xs"
            onClick={() => navigate('/orchestration')}
          >
            See how agents work together
          </button>
        </div>
      ) : (
        <p className="border-t border-line bg-canvas px-4 py-2 text-[12px] text-muted">
          Supervisor scores intent, sentiment and complexity, then sends the case to Ava, a consultant, or a specialist.
        </p>
      )}
    </section>
  )
}

export function RouteChip({ route }: { route: SupervisorRoute }) {
  return <span className={`chip ${routeChip(route)}`}>{shortRoute(route)}</span>
}

function Field({ show, label, value }: { show: boolean; label: string; value?: string }) {
  return (
    <div className={`flex items-start justify-between gap-3 text-sm ${show ? 'opacity-100' : 'opacity-35'}`}>
      <span className="text-muted">{label}</span>
      {show && value ? (
        <span className="max-w-[220px] text-right font-medium">{value}</span>
      ) : (
        <span className="h-4 w-24 animate-pulse rounded bg-canvas" />
      )}
    </div>
  )
}

function routeChip(route: SupervisorRoute) {
  if (route === 'ava') return 'bg-teal-soft text-teal'
  if (route === 'specialist') return 'bg-critical-soft text-critical'
  return 'bg-purple-soft text-purple'
}

function shortRoute(route: SupervisorRoute) {
  if (route === 'ava') return 'Ava'
  if (route === 'specialist') return 'Specialist'
  return 'Human'
}

function reasonTone(route: SupervisorRoute) {
  if (route === 'ava') return 'border-teal/30 bg-teal-soft/70'
  if (route === 'specialist') return 'border-critical/30 bg-critical-soft/70'
  return 'border-purple/30 bg-purple-soft/70'
}

function title(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
