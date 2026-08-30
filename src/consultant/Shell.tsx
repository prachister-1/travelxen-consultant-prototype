import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Bell, CircleHelp, GraduationCap, Inbox, Plane, RotateCcw, Search, Workflow } from 'lucide-react'
import { useDemo } from './store'

const nav = [
  { to: '/', label: 'Inbox', icon: Inbox, end: true },
  { to: '/orchestration', label: 'Agents', icon: Workflow },
  { to: '/workspace', label: 'Trip', icon: Plane },
  { to: '/learning', label: 'Quality', icon: GraduationCap },
]

function NavanMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#6307F8" />
      <path
        d="M8 24V11.2C8 9.2 10.4 7.8 13.1 8.6L24 12.2V24"
        fill="none"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 24h16" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

export function ConsultantShell() {
  const { search, dispatch, reset, toasts, dismissToast, interactions } = useDemo()
  const [notesOpen, setNotesOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const location = useLocation()
  const flush = location.pathname === '/workspace'
  const unread = interactions.filter((i) => i.state === 'ava_escalated' || i.priority === 'urgent').length

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNotesOpen(false)
        setHelpOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-30 flex h-[56px] items-center gap-3 border-b border-line bg-white px-4 md:px-5">
        <div className="flex items-center gap-2.5">
          <NavanMark />
          <div className="leading-tight">
            <div className="text-[15px] font-medium tracking-tight">TravelXen</div>
            <div className="text-[10px] text-muted">Agent console · demo data</div>
          </div>
        </div>
        <div className="relative mx-2 hidden min-w-[200px] flex-1 max-w-lg md:block">
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => dispatch({ type: 'search', q: e.target.value })}
            placeholder="Search traveller, PNR, trip or case"
            aria-label="Search traveller, PNR, trip or case"
            className="w-full rounded-full border border-line bg-canvas py-2 pr-3 pl-9 text-sm outline-none focus:border-purple"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" className="btn btn-ghost text-xs" onClick={reset}>
            <RotateCcw size={14} />
            Reset
          </button>
          <div className="relative">
            <button
              type="button"
              className="relative rounded-full border border-line p-2 text-muted hover:bg-canvas"
              aria-label="Notifications"
              aria-expanded={notesOpen}
              onClick={() => {
                setNotesOpen((v) => !v)
                setHelpOpen(false)
              }}
            >
              <Bell size={16} />
              {unread > 0 ? <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-critical" /> : null}
            </button>
            {notesOpen ? (
              <div className="card absolute right-0 mt-2 w-[320px] p-3" role="dialog" aria-label="Notifications">
                <div className="text-[11px] font-medium tracking-wide text-muted uppercase">Alerts</div>
                <ul className="mt-2 space-y-2 text-sm">
                  <li className="rounded-lg bg-purple-soft px-3 py-2">Jordan Hale — Ava GDS. BA 117 delay, missed AA 198. Do not type GDS.</li>
                  <li className="rounded-lg bg-amber-soft px-3 py-2">Maya Patel — missed connection, asked for a person.</li>
                  <li className="rounded-lg bg-canvas px-3 py-2">Daniel Kim holding in triage · 12 min.</li>
                </ul>
              </div>
            ) : null}
          </div>
          <div className="relative">
            <button
              type="button"
              className="rounded-full border border-line p-2 text-muted hover:bg-canvas"
              aria-label="Help"
              aria-expanded={helpOpen}
              onClick={() => {
                setHelpOpen((v) => !v)
                setNotesOpen(false)
              }}
            >
              <CircleHelp size={16} />
            </button>
            {helpOpen ? (
              <div className="card absolute right-0 mt-2 w-[360px] p-4 text-sm" role="dialog" aria-label="Demo help">
                <div className="font-medium">Presenter path</div>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-muted">
                  <li>Inbox — Jordan Hale is Ava GDS: BA 117 delay, missed AA 198. Replay the GDS facts, then Let Ava ticket AA 177.</li>
                  <li>Maya Patel asked for a person — attest EI 60. Sofia is specialist. Do not mix the two.</li>
                  <li>Agents — Replay helpers. Click GDS copilot to see who is working.</li>
                  <li>Capture learning so the next issued-ticket + waiver miss-connect stays with Ava.</li>
                </ol>
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2 pl-1">
            <span className="hidden items-center gap-1 rounded-full bg-teal-soft px-2 py-1 text-[11px] font-medium text-teal sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-teal" />
              Available
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-ink text-[11px] font-medium text-white">AM</div>
            <div className="hidden leading-tight xl:block">
              <div className="text-sm font-medium">Alex Morgan</div>
              <div className="text-[11px] text-muted">Travel agent</div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-56px)]">
        <aside className="hidden w-[200px] shrink-0 bg-ink p-3 text-white lg:flex lg:flex-col">
          <div className="px-2 pt-2 pb-3 text-[10px] font-medium tracking-[0.14em] text-white/45 uppercase">Console</div>
          {nav.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `mb-0.5 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                    isActive ? 'bg-white/10 font-medium text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon size={16} />
                {item.label}
              </NavLink>
            )
          })}
          <p className="mt-auto px-3 pt-8 pb-3 text-[11px] leading-relaxed text-white/45">All systems operational</p>
        </aside>
        <main className={`min-w-0 flex-1 ${flush ? 'p-0' : 'p-4 md:p-6'}`}>
          <nav className={`grid grid-cols-4 gap-2 lg:hidden ${flush ? 'p-3' : 'mb-4'}`}>
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-full border px-2 py-2 text-center text-[11px] font-medium ${
                    isActive ? 'border-purple bg-purple-soft text-purple' : 'border-line bg-white text-muted'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <Outlet />
        </main>
      </div>

      <div className="pointer-events-none fixed right-5 bottom-5 z-50 flex w-[min(380px,calc(100%-2rem))] flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} id={t.id} message={t.message} onDone={() => dismissToast(t.id)} />
        ))}
      </div>
    </div>
  )
}

function ToastItem({ id, message, onDone }: { id: string; message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3800)
    return () => clearTimeout(t)
  }, [id, onDone])
  return (
    <button
      type="button"
      className="pointer-events-auto rounded-xl bg-ink px-4 py-3 text-left text-sm text-white shadow-[0_12px_32px_rgba(21,0,44,0.28)]"
      onClick={onDone}
    >
      {message}
    </button>
  )
}
