import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDemo } from './store'
import type { ServiceCase } from './types'

const FEATURED_IDS = ['case-jordan', 'case-maya', 'case-daniel'] as const

type Verdict = 'correct' | 'wrong'
type AvaPick = 'ava' | 'person'

interface QaState {
  verdict: Verdict
  note: string
  reviewed: boolean
}

export function QualityLearning() {
  const { cases, selectedCase, dispatch } = useDemo()
  const featured = FEATURED_IDS.map((id) => cases.find((c) => c.id === id)).filter((c): c is ServiceCase => Boolean(c))
  const active = featured.find((c) => c.id === selectedCase?.id) ?? selectedCase ?? featured[0]
  const board = active ? hubCopy(active) : null
  const loop = active ? loopCopy(active) : null
  const [qaByTrip, setQaByTrip] = useState<Record<string, QaState>>({})
  const [avaByTrip, setAvaByTrip] = useState<Record<string, AvaPick>>({})

  const qa = useMemo(() => {
    if (!active || !loop) return null
    return qaByTrip[active.id] ?? { verdict: 'correct' as const, note: loop.note, reviewed: false }
  }, [active, loop, qaByTrip])
  const avaPick = active ? avaByTrip[active.id] : undefined

  return (
    <div className="mx-auto max-w-[720px]">
      <div className="mb-5">
        <h1 className="text-[28px] font-medium tracking-tight">Resolution hub</h1>
        <p className="mt-1 text-sm text-muted">
          What done means on this trip. What actually happened. Whether Ava can ticket next time.
        </p>
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
              <p className="mt-1 text-[12px] text-muted">{pathHint(c)}</p>
            </button>
          )
        })}
      </div>

      {active && board && loop && qa ? (
        <>
          <section className="card mb-3 p-5">
            <h2 className="text-base font-medium tracking-tight">Verified resolution</h2>
            <p className="mt-2 text-sm text-muted">{board.verified}</p>
          </section>

          <section className="card mb-3 p-5">
            <h2 className="text-base font-medium tracking-tight">Resolution trace</h2>
            <ol className="mt-3 space-y-2">
              {board.trace.map((step, i) => (
                <li key={`${i}-${step.actor}`} className="flex gap-3 text-sm">
                  <span className="w-10 shrink-0 tabular-nums text-muted">{step.time}</span>
                  <span>
                    <span className="font-medium">{step.actor}</span>
                    <span className="text-muted"> — {step.label}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <div className="mb-3 grid gap-3 md:grid-cols-2">
            <section className="card p-5">
              <h2 className="text-base font-medium tracking-tight">Rebooking outcome</h2>
              <p className="mt-2 text-sm text-muted">{board.rebooking}</p>
            </section>
            <section className="card p-5">
              <h2 className="text-base font-medium tracking-tight">Automation eligibility</h2>
              <p className="mt-2 text-sm text-muted">
                {avaPick === 'ava'
                  ? 'Ava can ticket this next time. A person does not confirm.'
                  : avaPick === 'person'
                    ? 'A person stays on this. Then Ava can ticket.'
                    : board.automation}
              </p>
            </section>
          </div>

          <section className="card mb-3 p-5">
            <h2 className="text-base font-medium tracking-tight">Failure patterns</h2>
            <ul className="mt-2 space-y-2 text-sm text-muted">
              {board.patterns.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>

          <div className="mb-3 grid gap-3 md:grid-cols-3">
            <section className="card p-5">
              <h2 className="text-base font-medium tracking-tight">Re-verifies</h2>
              <div className="mt-2 text-[28px] font-medium tracking-tight tabular-nums">3</div>
              <p className="mt-1 text-sm text-muted">This week. Daniel’s seats were stale. Maya asked for a person.</p>
            </section>

            <section className="card flex flex-col p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-medium tracking-tight">QA review</h2>
                {qa.reviewed ? <span className="chip bg-teal-soft text-teal">Reviewed</span> : null}
              </div>
              <p className="mt-2 text-sm text-muted">Open the trace. Mark it. One note.</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className={`btn btn-ghost text-xs ${qa.verdict === 'correct' ? 'ring-2 ring-purple' : ''}`}
                  onClick={() => setQaByTrip((prev) => ({ ...prev, [active.id]: { ...qa, verdict: 'correct' } }))}
                >
                  Correct
                </button>
                <button
                  type="button"
                  className={`btn btn-ghost text-xs ${qa.verdict === 'wrong' ? 'ring-2 ring-purple' : ''}`}
                  onClick={() => setQaByTrip((prev) => ({ ...prev, [active.id]: { ...qa, verdict: 'wrong' } }))}
                >
                  Wrong
                </button>
              </div>
              <input
                value={qa.note}
                aria-label="QA note"
                onChange={(e) => setQaByTrip((prev) => ({ ...prev, [active.id]: { ...qa, note: e.target.value } }))}
                className="mt-3 w-full rounded-full border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-purple"
              />
              <button
                type="button"
                className="btn btn-primary mt-3 w-full text-xs"
                onClick={() => {
                  setQaByTrip((prev) => ({ ...prev, [active.id]: { ...qa, reviewed: true } }))
                  dispatch({ type: 'toast', message: 'Reviewed' })
                }}
              >
                Review this trip
              </button>
            </section>

            <section className="card p-5">
              <h2 className="text-base font-medium tracking-tight">Evals</h2>
              <ul className="mt-3 space-y-2.5">
                {loop.evals.map((row) => (
                  <li key={row.label} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted">{row.label}</span>
                    <span className={`chip shrink-0 ${row.ok ? 'bg-teal-soft text-teal' : 'bg-critical-soft text-critical'}`}>
                      {row.result}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="card mb-3 p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-medium tracking-tight">Update Ava</h2>
              {avaPick ? <span className="chip bg-teal-soft text-teal">Updated</span> : null}
            </div>
            <p className="mt-2 text-sm text-muted">
              {avaPick === 'ava'
                ? 'Ava will ticket the next miss like this.'
                : avaPick === 'person'
                  ? 'A person stays on this.'
                  : loop.updateLine}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className={`btn text-xs ${preferredAva(loop.letAva, avaPick) === 'ava' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => {
                  setAvaByTrip((prev) => ({ ...prev, [active.id]: 'ava' }))
                  dispatch({ type: 'update-ava', caseId: active.id, letAva: true })
                }}
              >
                Let Ava handle this next time
              </button>
              <button
                type="button"
                className={`btn text-xs ${preferredAva(loop.letAva, avaPick) === 'person' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => {
                  setAvaByTrip((prev) => ({ ...prev, [active.id]: 'person' }))
                  dispatch({ type: 'update-ava', caseId: active.id, letAva: false })
                }}
              >
                Keep a person on this
              </button>
            </div>
          </section>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/context" className="btn btn-ghost text-xs" onClick={() => dispatch({ type: 'select-case', id: active.id })}>
              Shared context
            </Link>
            <Link to="/workspace" className="btn btn-primary text-xs" onClick={() => dispatch({ type: 'open-case', id: active.id })}>
              Workspace
            </Link>
            <Link to="/orchestration" className="btn btn-ghost text-xs" onClick={() => dispatch({ type: 'select-case', id: active.id })}>
              Agents
            </Link>
          </div>
        </>
      ) : null}
    </div>
  )
}

function preferredAva(recommended: boolean, pick?: AvaPick): AvaPick {
  if (pick) return pick
  return recommended ? 'ava' : 'person'
}

function pathLabel(c: ServiceCase) {
  if (c.gdsFacts?.length) return 'Ava tickets'
  if (c.id === 'case-maya') return 'You confirm'
  if (c.id === 'case-daniel') return 'Do not ticket yet'
  return c.intent
}

function pathHint(c: ServiceCase) {
  if (c.gdsFacts?.length) return 'AA 177 on the issued ticket'
  if (c.id === 'case-maya') return 'Attest the 19:30 meeting'
  if (c.id === 'case-daniel') return 'Seats are stale'
  return c.intent
}

function ticketed(c: ServiceCase) {
  return c.verifiedBooking || c.resolvedByAva || c.stage === 'verified' || c.stage === 'learned'
}

function loopCopy(c: ServiceCase) {
  if (c.gdsFacts?.length) {
    return {
      note: 'Trace matches.',
      evals: [
        { label: 'Ava ticketed correctly', result: 'Pass', ok: true },
        { label: 'Copilot routed correctly', result: 'Pass', ok: true },
        { label: 'Guest came back', result: 'No', ok: true },
      ],
      letAva: true,
      updateLine: 'Evals passed. Ava can ticket the next miss like Jordan’s.',
    }
  }

  if (c.id === 'case-maya') {
    const done = ticketed(c)
    return {
      note: 'Meeting time needed a person. Then Ava ticketed.',
      evals: [
        { label: 'Ava ticketed correctly', result: done ? 'Pass' : 'Hold', ok: done },
        { label: 'Copilot routed correctly', result: 'Pass', ok: true },
        { label: 'Guest came back', result: 'No', ok: true },
      ],
      letAva: false,
      updateLine: 'A person still confirms the meeting. Keep this with the desk.',
    }
  }

  if (c.id === 'case-daniel') {
    const done = ticketed(c)
    return {
      note: 'Seats were stale. Do not ticket until they refresh.',
      evals: [
        { label: 'Ava ticketed correctly', result: done ? 'Pass' : 'Fail', ok: done },
        { label: 'Copilot routed correctly', result: 'Pass', ok: true },
        { label: 'Guest came back', result: 'No', ok: true },
      ],
      letAva: false,
      updateLine: 'Evals failed on stale seats. Keep a person on this.',
    }
  }

  return {
    note: 'Trace matches.',
    evals: [
      { label: 'Ava ticketed correctly', result: ticketed(c) ? 'Pass' : 'Hold', ok: ticketed(c) },
      { label: 'Copilot routed correctly', result: 'Pass', ok: true },
      { label: 'Guest came back', result: 'No', ok: true },
    ],
    letAva: false,
    updateLine: 'Handle this trip, then decide if Ava can take the next one.',
  }
}

function hubCopy(c: ServiceCase) {
  const done = ticketed(c)

  if (c.gdsFacts?.length) {
    return {
      verified: done
        ? 'AA 177 is on the issued ticket. Jordan is going to SFO tonight. He does not come back for this miss.'
        : 'Done means AA 177 is ticketed on the issued fare, Jordan reaches SFO tonight, and he does not come back for the same miss.',
      trace: [
        { time: '12:14', actor: 'Genesys', label: 'Took Jordan’s WhatsApp.' },
        { time: '12:16', actor: 'Ava', label: 'Read ticket, eligibility, waiver, and seats.' },
        {
          time: '12:17',
          actor: 'Ava',
          label: done ? 'Ticketed AA 177. No consultant typed GDS.' : 'Held AA 177. Ready to ticket.',
        },
      ],
      rebooking: done
        ? 'AA 177 JFK–SFO 19:25 ticketed. $0 under the waiver.'
        : 'AA 177 JFK–SFO 19:25 is held. It has not ticketed yet.',
      automation: 'Ava can ticket this next time. A person does not confirm.',
      patterns: [
        'Stale inventory — do not ticket seats older than 5 minutes.',
        'Asked for a person — confirm one thing, then Ava tickets.',
      ],
    }
  }

  if (c.id === 'case-maya') {
    return {
      verified: done
        ? 'EI 60 is ticketed. Business fare is protected. Maya lands before 19:30. She does not come back for this miss.'
        : 'Done means EI 60 is ticketed, business fare is protected, she lands before 19:30, and she does not come back for the same miss.',
      trace: [
        { time: '10:18', actor: 'Genesys', label: 'Took Maya’s WhatsApp.' },
        { time: '11:51', actor: 'Ava', label: 'Offered self-serve. Maya asked for a person.' },
        {
          time: '11:52',
          actor: done ? 'Ava' : 'Copilot',
          label: done ? 'You attested the meeting. Ava ticketed EI 60.' : 'Holds EI 60 until you attest the 19:30 meeting.',
        },
      ],
      rebooking: done
        ? 'EI 60 DUB–JFK 16:15 ticketed after attest.'
        : 'EI 60 is held. It tickets after you attest the 19:30 meeting.',
      automation: 'A person still confirms the meeting time. Then Ava tickets.',
      patterns: [
        'Asked for a person — fare family and a hard meeting time.',
        'Visa questions never go to Ava.',
      ],
    }
  }

  if (c.id === 'case-daniel') {
    const fresh = c.inventoryFresh
    return {
      verified: done
        ? 'UA 15 is ticketed on fresh seats. Daniel does not call back for a ghost seat.'
        : 'Done means a same-day Newark seat is ticketed on fresh inventory, and Daniel does not call back for a ghost seat.',
      trace: [
        { time: '07:06', actor: 'Genesys', label: 'Queued Daniel’s call.' },
        { time: '07:07', actor: 'Copilot', label: 'Saw UA 918 cancelled.' },
        {
          time: '07:07',
          actor: done ? 'Ava' : 'Copilot',
          label: done
            ? 'Seats were refreshed. Ava ticketed UA 15.'
            : fresh
              ? 'Seats are fresh. Ready to ticket after you confirm.'
              : 'Seats are 11 minutes stale. Do not ticket.',
        },
      ],
      rebooking: done
        ? 'UA 15 Polaris SFO–EWR 11:05 ticketed.'
        : fresh
          ? 'UA 15 is ready. It has not ticketed yet.'
          : 'UA 15 is proposed. Seats are stale. It has not ticketed.',
      automation: fresh
        ? 'Seats are fresh. Ava can ticket after you hand this back.'
        : 'A person must confirm seats are fresh. Then Ava can ticket.',
      patterns: [
        'Stale inventory — seats older than 5 minutes.',
        'Visa questions never go to Ava.',
      ],
    }
  }

  return {
    verified: c.avaOutcome,
    trace: c.timeline.slice(0, 3).map((item) => ({ time: item.time, actor: item.actor, label: item.label })),
    rebooking: c.intent,
    automation: 'Handle this trip, then Ava can take the next one like it.',
    patterns: ['Visa questions never go to Ava.'],
  }
}
