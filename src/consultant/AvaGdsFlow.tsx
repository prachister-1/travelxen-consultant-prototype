import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Sparkles } from 'lucide-react'
import { useDemo } from './store'
import type { GdsFact, ServiceCase } from './types'

const TONE: Record<GdsFact['tone'], string> = {
  alert: 'border-amber/40 bg-amber-soft/80',
  ok: 'border-teal/30 bg-teal-soft/70',
  info: 'border-line bg-canvas',
}

const CHIP: Record<GdsFact['tone'], string> = {
  alert: 'bg-amber-soft text-amber',
  ok: 'bg-teal-soft text-teal',
  info: 'bg-canvas text-muted',
}

export function AvaGdsFlow({ c }: { c: ServiceCase }) {
  const { dispatch } = useDemo()
  const navigate = useNavigate()
  const facts = c.gdsFacts ?? []
  const playback = useGdsPlayback(c.id, facts.length)
  const done = c.resolvedByAva || c.stage === 'verified' || c.stage === 'learned'
  const rec = c.options.find((o) => o.recommended) ?? c.options[0]
  const planReady = playback.step >= facts.length

  return (
    <section className="card mb-4 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-ink px-4 py-3 text-white">
        <div>
          <div className="text-[11px] font-medium tracking-[0.12em] text-white/50 uppercase">Ava · GDS read</div>
          <div className="text-sm font-medium">Issued ticket + waiver + fresh supplier → Ava tickets. Do not open a GDS mask.</div>
        </div>
        <div className="flex items-center gap-2">
          {playback.playing ? <span className="chip bg-amber-soft text-amber">Reading GDS…</span> : <span className="chip bg-teal-soft text-teal">Facts loaded</span>}
          <button type="button" className="rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium hover:bg-white/15" onClick={playback.play}>
            Replay Ava
          </button>
        </div>
      </div>

      <div className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {facts.map((fact, i) => {
          const visible = playback.step >= i
          const current = playback.playing && playback.step === i
          return (
            <button
              key={fact.id}
              type="button"
              onClick={() => playback.jump(i)}
              className={`rounded-xl border px-3 py-3 text-left ${visible ? TONE[fact.tone] : 'border-line bg-white opacity-40'} ${current ? 'tx-working ring-2 ring-purple' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">{fact.label}</div>
                <span className={`chip ${visible ? CHIP[fact.tone] : 'bg-canvas text-muted'}`}>
                  {!visible ? 'Queued' : current ? 'Working' : 'Read'}
                </span>
              </div>
              <div className="mt-1 text-sm font-medium">{visible ? fact.value : 'Waiting…'}</div>
            </button>
          )
        })}
      </div>

      {planReady && rec ? (
        <div className="border-t border-line px-4 py-4">
          <div className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">Ava plan</div>
          <div className="mt-1 text-sm font-medium">
            {rec.flight} · {rec.route} · {rec.depart}–{rec.arrive} · {rec.travellerCost}
          </div>
          <p className="mt-1 text-[13px] text-muted">{rec.policyFit}</p>
          <ol className="mt-3 space-y-1.5 text-[13px]">
            {c.avaPlan.map((step, i) => (
              <li key={step} className="flex gap-2">
                <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-purple-soft text-[10px] font-medium text-purple">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn btn-teal" disabled={done} onClick={() => dispatch({ type: 'ava-complete', caseId: c.id })}>
              <Sparkles size={14} /> Let Ava ticket {rec.flight}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={c.stage !== 'verified'}
              onClick={() => {
                dispatch({ type: 'capture-learning', caseId: c.id })
                navigate('/learning')
              }}
            >
              <Check size={14} /> Capture learning
            </button>
          </div>
          {done ? <p className="mt-3 text-[12px] text-teal">Ava reissued on PNR {c.pnr}. Consultant never typed GDS.</p> : null}
        </div>
      ) : (
        <p className="border-t border-line px-4 py-3 text-[12px] text-muted">Ava is still reading GDS facts. Ticketing stays locked until the waiver and freshness pass.</p>
      )}
    </section>
  )
}

function useGdsPlayback(caseId: string, factCount: number) {
  const last = Math.max(factCount, 0)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(true)
  const timers = useRef<number[]>([])

  function clear() {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  function play() {
    clear()
    setPlaying(true)
    setStep(0)
    timers.current = Array.from({ length: last + 1 }, (_, n) =>
      window.setTimeout(() => {
        setStep(n)
        if (n === last) setPlaying(false)
      }, 550 * n),
    )
  }

  function jump(n: number) {
    clear()
    setPlaying(false)
    setStep(Math.max(0, Math.min(last, n)))
  }

  useEffect(() => {
    play()
    return clear
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId])

  return { step, playing, play, jump }
}
