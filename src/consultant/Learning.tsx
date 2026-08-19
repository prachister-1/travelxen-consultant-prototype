import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useDemo } from './store'
import { MetricCard, SectionTitle, SourceTag } from './ui'

const intentMix = [
  { intent: 'Misconnect', count: 28 },
  { intent: 'Cancel / IRROPS', count: 19 },
  { intent: 'Seat / servicing', count: 41 },
  { intent: 'Invoice', count: 14 },
  { intent: 'Schedule change', count: 17 },
  { intent: 'Documents', count: 9 },
]

export function QualityLearning() {
  const { signals, avaResolvedToday, contextCompleteness, avaRuns, cases } = useDemo()
  const latest = signals[0]
  const avaToday = avaRuns.filter((r) => r.status === 'resolved')
  const maya = cases.find((c) => c.id === 'case-maya')
  const mayaClosed =
    maya &&
    (maya.stage === 'verified' || maya.stage === 'learned' || maya.resolvedByAva || maya.verifiedBooking)
  const humanDecided = cases.filter((c) => c.decision === 'approve' || c.decision === 'modify' || c.decision === 'override')
  const accepted = humanDecided.filter((c) => c.decision === 'approve').length
  const recAcceptance = humanDecided.length === 0 ? '88%' : `${Math.round((accepted / humanDecided.length) * 100)}%`
  const verifiedResolution = mayaClosed ? '74%' : '71%'
  const repeatContact = mayaClosed ? '0' : '6%'

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-5">
        <h1 className="text-[28px] font-semibold tracking-tight">Quality & learning</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Verified traveller outcomes — not chat scores. Capture Maya’s disruption rebook so Ava can take the next same-fare-family miss-connect.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Verified resolution" value={verifiedResolution} hint={mayaClosed ? 'Maya’s outcome captured this session' : 'Pilot baseline · demo'} />
        <MetricCard label="Repeat contact" value={repeatContact} hint={mayaClosed ? 'No avoidable repeat after verified WhatsApp' : 'Avoidable repeats · demo'} />
        <MetricCard label="Recommendation accepted" value={recAcceptance} hint="Approve vs override this session" />
        <MetricCard label="Ava safe to automate" value={`${avaResolvedToday}%`} hint={`Handoff completeness ${contextCompleteness}%`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="card p-4">
          <SectionTitle title="Learning signals" action={<SourceTag system="Quality loop" freshness="session" />} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] font-semibold tracking-wide text-muted uppercase">
                  <th className="py-2 pr-3 font-semibold">When</th>
                  <th className="py-2 pr-3 font-semibold">Case</th>
                  <th className="py-2 pr-3 font-semibold">Intent</th>
                  <th className="py-2 pr-3 font-semibold">Consultant</th>
                  <th className="py-2 pr-3 font-semibold">Outcome</th>
                  <th className="py-2 font-semibold">Playbook impact</th>
                </tr>
              </thead>
              <tbody>
                {signals.map((s) => (
                  <tr key={s.id} className={`border-b border-line ${s.id.startsWith('sig-case') || s.time.startsWith('Today') ? 'bg-purple-soft/40' : ''}`}>
                    <td className="py-3 pr-3 whitespace-nowrap text-muted">{s.time}</td>
                    <td className="py-3 pr-3">
                      <div className="font-semibold">{s.traveller}</div>
                      <div className="text-[12px] text-muted">{s.caseNumber}</div>
                    </td>
                    <td className="py-3 pr-3">{s.intent}</td>
                    <td className="py-3 pr-3">{s.consultantAction}</td>
                    <td className="py-3 pr-3">{s.outcome}</td>
                    <td className="py-3">{s.playbookImpact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-3">
          <section className="card p-4">
            <SectionTitle title="Intent mix (7 days · demo)" />
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={intentMix} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="#e6e8f0" vertical={false} />
                  <XAxis dataKey="intent" tick={{ fontSize: 10, fill: '#5c6485' }} interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: '#5c6485' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6526D9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="card p-4">
            <SectionTitle title="Ava resolved (demo)" />
            <ul className="space-y-2 text-sm">
              {avaToday.length === 0 ? (
                <li className="text-muted">Hand a case back to Ava on Trip to populate this list.</li>
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
              <p className="text-sm text-muted">Verify a case to capture a signal.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
