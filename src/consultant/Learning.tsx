import { Link } from 'react-router-dom'
import { useDemo } from './store'
import type { LearningSignal, ServiceCase } from './types'

const FEATURED_IDS = ['case-jordan', 'case-maya', 'case-daniel'] as const

export function QualityLearning() {
  const { signals, cases, selectedCase, dispatch } = useDemo()
  const featured = FEATURED_IDS.map((id) => cases.find((c) => c.id === id)).filter((c): c is ServiceCase => Boolean(c))
  const active = featured.find((c) => c.id === selectedCase?.id) ?? selectedCase ?? featured[0]
  const signal = active ? signals.find((s) => s.caseNumber === active.caseNumber) : undefined
  const board = active ? hubCopy(active, signal) : null

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="mb-5">
        <h1 className="text-[28px] font-medium tracking-tight">Resolution hub</h1>
        <p className="mt-1 text-sm text-muted">What happened on this trip. What we learned. What Ava should do next time.</p>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        {featured.map((c) => {
          const on = c.id === active?.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => dispatch({ type: 'select-case', id: c.id })}
              className={`card p-4 text-left ${on ? 'ring-2 ring-purple' : 'hover:border-purple/40'}`}
            >
              <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">{pathLabel(c)}</div>
              <div className="mt-1 text-sm font-medium">{c.traveller}</div>
              <p className="mt-1 text-[12px] text-muted">PNR {c.pnr}</p>
            </button>
          )
        })}
      </div>

      {active && board ? (
        <>
          <BoardCard kicker={`This trip’s outcome · ${active.traveller}`} title={board.outcome} body={`PNR ${active.pnr}`} />
          <BoardCard kicker="What we learned" title={board.learned} body={board.learnedDetail} />
          <BoardCard kicker="Next time" title={board.next} body={board.nextDetail} tone="purple" />

          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/workspace" className="btn btn-primary text-xs" onClick={() => dispatch({ type: 'select-case', id: active.id })}>
              Open this trip
            </Link>
            <Link to="/context" className="btn btn-ghost text-xs" onClick={() => dispatch({ type: 'select-case', id: active.id })}>
              Shared context
            </Link>
          </div>
        </>
      ) : null}
    </div>
  )
}

function BoardCard({
  kicker,
  title,
  body,
  tone = 'ink',
}: {
  kicker: string
  title: string
  body?: string
  tone?: 'ink' | 'teal' | 'purple'
}) {
  const ring = tone === 'teal' ? 'border-teal/25 bg-teal-soft/40' : tone === 'purple' ? 'border-purple/25 bg-purple-soft/40' : ''
  return (
    <section className={`card mb-3 p-5 ${ring}`}>
      <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">{kicker}</div>
      <h2 className="mt-1 text-base font-medium tracking-tight">{title}</h2>
      {body && body !== title ? <p className="mt-2 text-sm text-muted">{body}</p> : null}
    </section>
  )
}

function pathLabel(c: ServiceCase) {
  if (c.gdsFacts?.length) return 'Ava tickets'
  if (c.id === 'case-maya') return 'You confirm'
  if (c.id === 'case-daniel') return 'Do not ticket yet'
  return c.intent
}

function hubCopy(c: ServiceCase, signal?: LearningSignal) {
  const closed = Boolean(signal) || c.resolvedByAva || c.stage === 'verified' || c.stage === 'learned'

  if (c.gdsFacts?.length) {
    return {
      closed,
      outcome: closed
        ? signal?.outcome ?? 'Ava ticketed the next flight. You did not type GDS.'
        : 'BA 117 delayed. AA 198 will miss. Ava can ticket AA 177 now.',
      learned: 'Ticket issued + waiver + seats under 5 min → Ava tickets.',
      learnedDetail: signal?.whatWorked ?? 'Copilot already checked this. You do not open a GDS mask.',
      next: 'Ava finishes this next time.',
      nextDetail: signal?.playbookImpact ?? 'The same miss-connect stays with Ava. Copilot does the checks. You leave the chat.',
    }
  }

  if (c.id === 'case-maya') {
    return {
      closed,
      outcome: closed
        ? signal?.outcome ?? 'You confirmed the meeting. Ava can ticket EI 60.'
        : 'Maya asked for a person. The 19:30 meeting still has to hold.',
      learned: 'She asked for a person → you confirm the meeting, then Ava tickets.',
      learnedDetail: signal?.whatWorked ?? 'Copilot already found EI 60 and the fare. You attest one time. You do not re-shop.',
      next: 'You still confirm one thing.',
      nextDetail: signal?.playbookImpact ?? 'Copilot proposes. You attest. Ava tickets after.',
    }
  }

  if (c.id === 'case-daniel') {
    return {
      closed: closed && c.inventoryFresh,
      outcome: c.inventoryFresh
        ? signal?.outcome ?? 'Seats are fresh. Ava can ticket.'
        : 'UA 918 cancelled. Seat list is more than 5 minutes old. Do not ticket.',
      learned: 'Seats older than 5 min → do not ticket. Refresh first.',
      learnedDetail: signal?.whatWorked ?? 'Copilot is holding ticketing until the snapshot is fresh.',
      next: c.inventoryFresh ? 'Ava can ticket once you hand this back.' : 'Copilot holds. Then Ava can ticket.',
      nextDetail: signal?.playbookImpact ?? 'Never ticket on a stale seat list. Refresh, then let Ava finish.',
    }
  }

  return {
    closed,
    outcome: signal?.outcome ?? c.avaOutcome,
    learned: signal?.whatWorked ?? c.intent,
    learnedDetail: 'Handle the trip, then this board updates.',
    next: signal?.playbookImpact ?? 'Capture the outcome from Workspace.',
    nextDetail: 'Ava only takes the next similar trip after this one is written down.',
  }
}
