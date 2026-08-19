import { Lock, Languages } from 'lucide-react'
import type { ServiceCase } from './types'
import { deskBrief } from './deskBrief'

export function DeskCopilot({ c }: { c: ServiceCase }) {
  const brief = deskBrief(c)
  return (
    <section className="card mb-4 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line px-4 py-3">
        <div>
          <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">Desk copilot · non-GDS</div>
          <div className="text-sm font-medium">{brief.headline}</div>
        </div>
        <span className="chip bg-purple-soft text-purple">
          <Languages size={11} className="mr-1" /> Plain language · demo data
        </span>
      </div>
      <div className="grid gap-0 md:grid-cols-2">
        <div className="border-b border-line p-4 md:border-r md:border-b-0">
          <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">Summary</div>
          <p className="mt-1 text-sm">{brief.summary}</p>
          <dl className="mt-3 space-y-2 text-[13px]">
            <Row label="Routing" value={brief.routing} />
            <Row label="Policy" value={brief.policy} />
            <Row label="Language" value={brief.language} />
          </dl>
          <div className="mt-3 text-[11px] font-medium tracking-[0.12em] text-muted uppercase">Fare rules</div>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-[13px] text-muted">
            {brief.fareRules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
        <div className="p-4">
          <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">
            {brief.gdsRequired ? 'Proposed GDS / PSS (Ava executes)' : 'No cryptic commands'}
          </div>
          {brief.proposed.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {brief.proposed.map((p) => (
                <li key={p.command} className="rounded-xl border border-line bg-canvas px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-[12px] font-medium">{p.command}</code>
                    {p.locked ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber">
                        <Lock size={10} /> Locked
                      </span>
                    ) : (
                      <span className="text-[11px] text-teal">Ready</span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[12px] text-muted">{p.meaning}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[13px] text-muted">Nothing to enter in a GDS. Ava or a specialist finishes this without cryptic.</p>
          )}
          <p className="mt-3 rounded-xl bg-purple-soft/60 px-3 py-2 text-[12px] text-ink">{brief.consultantMustKnow}</p>
        </div>
      </div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="max-w-[240px] text-right font-medium">{value}</dd>
    </div>
  )
}
