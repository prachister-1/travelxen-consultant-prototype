import { Link } from 'react-router-dom'
import { useDemo } from './store'
import type { ServiceCase } from './types'

const FEATURED_IDS = ['case-jordan', 'case-maya', 'case-daniel'] as const

export function QualityLearning() {
  const { cases, selectedCase, dispatch } = useDemo()
  const featured = FEATURED_IDS.map((id) => cases.find((c) => c.id === id)).filter((c): c is ServiceCase => Boolean(c))
  const active = featured.find((c) => c.id === selectedCase?.id) ?? selectedCase ?? featured[0]
  const board = active ? hubCopy(active) : null

  return (
    <div className="mx-auto max-w-[720px]">
      <div className="mb-5">
        <h1 className="text-[28px] font-medium tracking-tight">Resolution hub</h1>
        <p className="mt-1 text-sm text-muted">What happened. What we learned. What Ava does next time.</p>
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
            </button>
          )
        })}
      </div>

      {active && board ? (
        <>
          <BoardCard kicker="This trip" title={active.traveller} body={board.happened} />
          <BoardCard kicker="What we learned" title={board.learned} />
          <BoardCard kicker="Next time" title={board.next} />

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

function BoardCard({ kicker, title, body }: { kicker: string; title: string; body?: string }) {
  return (
    <section className="card mb-3 p-5">
      <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">{kicker}</div>
      <h2 className="mt-1 text-base font-medium tracking-tight">{title}</h2>
      {body ? <p className="mt-2 text-sm text-muted">{body}</p> : null}
    </section>
  )
}

function pathLabel(c: ServiceCase) {
  if (c.gdsFacts?.length) return 'Ava tickets'
  if (c.id === 'case-maya') return 'You confirm'
  if (c.id === 'case-daniel') return 'Do not ticket yet'
  return c.intent
}

function hubCopy(c: ServiceCase) {
  if (c.gdsFacts?.length) {
    return {
      happened: 'BA 117 delayed. Missed connection. Ava can ticket AA 177.',
      learned: 'Ticket issued + waiver + seats under 5 min → Ava tickets.',
      next: 'Ava tickets. You do not type GDS.',
    }
  }
  if (c.id === 'case-maya') {
    return {
      happened: 'She asked for a person. The 19:30 meeting still has to hold.',
      learned: 'Confirm the meeting, then Ava tickets.',
      next: 'You confirm one thing.',
    }
  }
  if (c.id === 'case-daniel') {
    return {
      happened: c.inventoryFresh
        ? 'Seats are fresh. Ava can ticket.'
        : 'UA 918 cancelled. Seat list is stale. Do not ticket.',
      learned: 'Seats older than 5 min → refresh first.',
      next: c.inventoryFresh ? 'Ava tickets after you hand this back.' : 'Copilot holds. Then Ava can ticket.',
    }
  }
  return {
    happened: c.avaOutcome,
    learned: c.intent,
    next: 'Handle this trip, then Ava can take the next one like it.',
  }
}
