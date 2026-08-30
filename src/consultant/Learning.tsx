import { Link } from 'react-router-dom'
import { useDemo } from './store'
import { MetricCard, SectionTitle, SourceTag } from './ui'
import type { LearningSignal, ServiceCase } from './types'

const LOOP_STEPS = [
  { n: '1', title: 'Verify the outcome', body: 'Correct, complete, and no avoidable repeat contact.' },
  { n: '2', title: 'Detect repeat failures', body: 'Find patterns across trips, suppliers, policies, and workflows.' },
  { n: '3', title: 'Identify the root cause', body: 'Knowledge gap, workflow gap, data-quality issue, or coaching need.' },
  { n: '4', title: 'Improve the system', body: 'Update guidance, workflows, training, and automation policies.' },
  { n: '5', title: 'Teach Ava to do more, safely', body: 'Expand autonomy only when quality, reliability, and risk thresholds are proven.' },
] as const

const FEATURED_IDS = ['case-jordan', 'case-maya', 'case-daniel'] as const

export function QualityLearning() {
  const { signals, avaResolvedToday, contextCompleteness, avaRuns, cases, selectedCase, dispatch } = useDemo()
  const sessionSignals = signals.filter((s) => s.time.startsWith('Today') || s.id.startsWith('sig-case'))
  const featured = FEATURED_IDS.map((id) => cases.find((c) => c.id === id)).filter((c): c is ServiceCase => Boolean(c))
  const active = selectedCase ?? featured[0]
  const activeSignal = active ? signals.find((s) => s.caseNumber === active.caseNumber) : undefined
  const handled = featured.filter((c) => c.stage === 'verified' || c.stage === 'learned' || c.resolvedByAva)
  const avaToday = avaRuns.filter((r) => r.status === 'resolved')
  const humanDecided = cases.filter((c) => c.decision === 'approve' || c.decision === 'modify' || c.decision === 'override')
  const verifiedResolution = handled.length >= 2 ? '76%' : handled.length === 1 ? '74%' : '71%'
  const repeatContact = handled.some((c) => c.id === 'case-maya') ? '0' : '6%'
  const detectTime = handled.some((c) => c.id === 'case-daniel') ? 'Same session' : '11 min'
  const cycleTime = sessionSignals.length > 0 ? 'Same session' : '—'
  const latest = sessionSignals[0] ?? signals[0]

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-medium tracking-tight">Resolution hub</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            What was verified, what we learned, what Ava can do next time. Handle a trip on Workspace, capture the outcome, and it shows up here.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/context"
            className="btn btn-ghost text-xs"
            onClick={() => {
              if (active) dispatch({ type: 'select-case', id: active.id })
            }}
          >
            This trip’s context
          </Link>
          <Link
            to="/orchestration"
            className="btn btn-ghost text-xs"
            onClick={() => {
              if (active) dispatch({ type: 'select-case', id: active.id })
            }}
          >
            Agents
          </Link>
        </div>
      </div>

      {active ? (
        <section className={`card mb-5 p-4 ${activeSignal || active.resolvedByAva || active.stage === 'learned' || active.stage === 'verified' ? 'ring-2 ring-purple' : ''}`}>
          <div className="text-[11px] font-medium tracking-[0.12em] text-purple uppercase">This trip</div>
          <div className="mt-1 text-sm font-medium">
            {active.traveller} · {active.caseNumber} · {active.pnr}
          </div>
          <p className="mt-1 text-[13px] text-muted">
            {activeSignal
              ? `${activeSignal.outcome}. ${activeSignal.playbookImpact}`
              : active.resolvedByAva || active.stage === 'verified' || active.stage === 'learned'
                ? `${active.avaOutcome} Capture it so the next similar trip stays with Ava.`
                : `${active.intent}. Handle this trip, then capture the outcome to close the loop.`}
          </p>
        </section>
      ) : null}

      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-5">
        <MetricCard label="Verified resolution" value={verifiedResolution} hint={handled.length ? 'Updated from this session' : 'Pilot baseline · demo'} />
        <MetricCard label="Repeat-contact rate" value={repeatContact} hint={repeatContact === '0' ? 'No avoidable repeat after a verified handle' : 'Avoidable repeats · demo'} />
        <MetricCard label="Time to issue detection" value={detectTime} hint="Stale inventory and missed-connect patterns" />
        <MetricCard label="Issue-to-improvement" value={cycleTime} hint={sessionSignals.length ? 'Playbook write from a captured handle' : 'Capture a handle to start the clock'} />
        <MetricCard label="Safe automation rate" value={`${avaResolvedToday}%`} hint={`Share of trips Ava can finish without a consultant · handoff ${contextCompleteness}%`} />
      </div>

      <section className="card mb-4 p-4">
        <SectionTitle title="Learn from every signal" action={<SourceTag system="Quality loop" freshness="session" />} />
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <InputTile label="Verified outcome + feedback" value={`${handled.length} of 3 demo trips`} hint="Jordan, Maya, Daniel" />
          <InputTile label="Consultant actions + notes" value={`${humanDecided.length} decisions`} hint="Approve, edit, or override this session" />
          <InputTile label="QA reviews" value={`${sessionSignals.length} captured`} hint="Signals written this session" />
          <InputTile label="Knowledge + playbook updates" value={`${signals.length} writes`} hint="Guidance Agents will read next time" />
          <InputTile label="Ops + workflow signals" value={`${avaToday.length} Ava finishes`} hint="Performance from this desk" />
        </div>
      </section>

      <section className="card mb-4 p-4">
        <SectionTitle title="Resolution intelligence loop" />
        <p className="mb-3 text-[13px] text-muted">From action to verified outcome to improvement.</p>
        <ol className="grid gap-2 md:grid-cols-5">
          {LOOP_STEPS.map((step) => (
            <li key={step.n} className="rounded-xl bg-canvas px-3 py-3">
              <div className="grid h-6 w-6 place-items-center rounded-full bg-purple text-[11px] font-medium text-white">{step.n}</div>
              <div className="mt-2 text-sm font-medium">{step.title}</div>
              <p className="mt-1 text-[12px] text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="card mb-4 p-4">
        <SectionTitle title="Close the loop" />
        <p className="mb-3 text-[13px] text-muted">Outcome → what we learned → what Ava can do next time.</p>
        <div className="grid gap-3 lg:grid-cols-3">
          {featured.map((c) => {
            const signal = signals.find((s) => s.caseNumber === c.caseNumber)
            return (
              <LoopCard
                key={c.id}
                c={c}
                signal={signal}
                selected={c.id === active?.id}
                onSelect={() => dispatch({ type: 'select-case', id: c.id })}
              />
            )
          })}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="card p-4">
          <SectionTitle title="Repeat-failure patterns" />
          <ul className="space-y-3">
            {repeatPatterns(featured, signals).map((row) => (
              <li key={row.title} className="rounded-xl bg-canvas px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`chip ${row.closed ? 'bg-teal-soft text-teal' : 'bg-amber-soft text-amber'}`}>{row.closed ? 'Improved' : 'Open'}</span>
                  <span className="text-sm font-medium">{row.title}</span>
                </div>
                <p className="mt-1 text-[13px] text-muted">{row.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-3">
          <section className="card p-4">
            <SectionTitle title="Written back to knowledge" />
            <ul className="space-y-2 text-sm">
              {(sessionSignals.length ? sessionSignals : signals).slice(0, 4).map((s) => (
                <li key={s.id} className="rounded-lg bg-teal-soft/50 px-3 py-2">
                  <div className="font-medium">
                    {s.traveller} · {s.caseNumber}
                  </div>
                  <p className="mt-1 text-[12px] text-muted">{s.playbookImpact}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12px] text-muted">These writes go back into trip context and the guidance Agents use next time.</p>
          </section>
          <section className="card p-4">
            <SectionTitle title="Ava resolved without a consultant" />
            <ul className="space-y-2 text-sm">
              {avaToday.length === 0 ? (
                <li className="text-muted">Hand a trip back to Ava on Workspace to populate this list.</li>
              ) : (
                avaToday.map((run) => (
                  <li key={run.id} className="rounded-lg bg-teal-soft/50 px-3 py-2">
                    <div className="font-medium">
                      {run.traveller} · {run.caseNumber}
                    </div>
                    <div className="text-[12px] text-muted">
                      {run.intent} · {run.outcome}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>
          <section className="card p-4">
            <SectionTitle title="Latest capture" />
            {latest ? (
              <div className="text-sm">
                <div className="font-semibold">
                  {latest.traveller} · {latest.caseNumber}
                </div>
                <p className="mt-2 text-muted">{latest.whatWorked}</p>
                <p className="mt-2 rounded-lg bg-teal-soft px-3 py-2 text-teal">{latest.playbookImpact}</p>
              </div>
            ) : (
              <p className="text-sm text-muted">Verify a trip and capture it to close the loop.</p>
            )}
          </section>
        </aside>
      </div>

      <section className="card mt-4 p-4">
        <div className="text-[11px] font-medium tracking-[0.12em] text-purple uppercase">What this changes next time</div>
        <p className="mt-1 text-sm">
          Better trip context, better agent recommendations, and more trips Ava can finish safely on its own.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/context"
            className="btn btn-ghost text-xs"
            onClick={() => {
              if (active) dispatch({ type: 'select-case', id: active.id })
            }}
          >
            Open Shared context
          </Link>
          <Link
            to="/orchestration"
            className="btn btn-primary text-xs"
            onClick={() => {
              if (active) dispatch({ type: 'select-case', id: active.id })
            }}
          >
            Open Agents
          </Link>
        </div>
      </section>
    </div>
  )
}

function InputTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl bg-canvas px-3 py-3">
      <div className="text-[11px] font-medium tracking-[0.08em] text-muted uppercase">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
      <p className="mt-1 text-[12px] text-muted">{hint}</p>
    </div>
  )
}

function LoopCard({
  c,
  signal,
  selected,
  onSelect,
}: {
  c: ServiceCase
  signal?: LearningSignal
  selected: boolean
  onSelect: () => void
}) {
  const waiting = !signal && c.stage !== 'verified' && c.stage !== 'learned' && !c.resolvedByAva
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border bg-white px-4 py-3 text-left ${selected ? 'border-purple ring-2 ring-purple' : 'border-line'}`}
    >
      <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">{c.traveller}</div>
      <div className="mt-2 grid gap-2 text-sm">
        <LoopRow label="Outcome" value={signal?.outcome ?? (c.resolvedByAva ? c.avaOutcome : waiting ? 'Not verified yet' : c.avaOutcome)} />
        <LoopRow label="Learned" value={signal?.whatWorked ?? (waiting ? 'Handle the trip, then capture.' : 'Waiting for capture.')} />
        <LoopRow label="Ava next time" value={signal?.playbookImpact ?? (waiting ? 'Nothing written back yet.' : 'Capture to teach Ava.')} />
      </div>
    </button>
  )
}

function LoopRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium tracking-[0.08em] text-muted uppercase">{label}</div>
      <p className="mt-0.5">{value}</p>
    </div>
  )
}

function repeatPatterns(featured: ServiceCase[], signals: LearningSignal[]) {
  const jordan = featured.find((c) => c.id === 'case-jordan')
  const maya = featured.find((c) => c.id === 'case-maya')
  const daniel = featured.find((c) => c.id === 'case-daniel')
  const jordanClosed = Boolean(signals.find((s) => s.caseNumber === jordan?.caseNumber) || jordan?.resolvedByAva)
  const mayaClosed = Boolean(signals.find((s) => s.caseNumber === maya?.caseNumber) || maya?.stage === 'learned')
  const danielClosed = Boolean(signals.find((s) => s.caseNumber === daniel?.caseNumber) || (daniel?.inventoryFresh && daniel.resolvedByAva))
  return [
    {
      title: 'Issued ticket + waiver still opened by a consultant',
      body: jordanClosed
        ? 'Closed on Jordan Hale. Next miss-connect with an issued ticket and a fresh waiver stays with Ava.'
        : 'Open. Jordan Hale is the proof path: ticket issued, waiver available, supplier 2 min old.',
      closed: jordanClosed,
    },
    {
      title: 'Traveller asked for a person after self-serve',
      body: mayaClosed
        ? 'Closed on Maya Patel. Attest the meeting, then Ava tickets. Do not re-shop from scratch.'
        : 'Open. Maya Patel asked for a person so fare family and the 19:30 meeting stay protected.',
      closed: mayaClosed,
    },
    {
      title: 'Ticketing on stale inventory',
      body: danielClosed
        ? 'Closed on Daniel Kim. Hard-stop Ava when the seat snapshot is older than 5 minutes, then hand back.'
        : 'Open. Daniel Kim is holding because the seat list is more than 5 minutes old.',
      closed: danielClosed,
    },
  ]
}
