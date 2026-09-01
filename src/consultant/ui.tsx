import type { ReactNode } from 'react'
import type { Channel, InteractionState, Priority } from './types'

export function ChannelLabel({ channel }: { channel: Channel }) {
  const map: Record<Channel, string> = {
    whatsapp: 'WhatsApp',
    phone: 'Phone',
    chat: 'Chat',
    email: 'Email',
  }
  return <>{map[channel]}</>
}

export function PriorityChip({ value }: { value: Priority }) {
  const map: Record<Priority, string> = {
    urgent: 'bg-critical-soft text-critical',
    high: 'bg-amber-soft text-amber',
    medium: 'bg-purple-soft text-purple',
    low: 'bg-slate-100 text-muted',
  }
  const label: Record<Priority, string> = {
    urgent: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  }
  return <span className={`chip ${map[value]}`}>{label[value]}</span>
}

export function StateChip({ value }: { value: InteractionState }) {
  const map: Record<InteractionState, string> = {
    ava_escalated: 'bg-amber-soft text-amber',
    waiting_triage: 'bg-purple-soft text-purple',
    ava_resolving: 'bg-teal-soft text-teal',
    queued: 'bg-slate-100 text-muted',
    specialist_review: 'bg-critical-soft text-critical',
    with_consultant: 'bg-purple-soft text-purple',
    resolved: 'bg-teal-soft text-teal',
  }
  const label: Record<InteractionState, string> = {
    ava_escalated: 'Ava escalated',
    waiting_triage: 'Waiting for triage',
    ava_resolving: 'Ava resolving',
    queued: 'Queued',
    specialist_review: 'Specialist review',
    with_consultant: 'With consultant',
    resolved: 'Resolved',
  }
  return <span className={`chip ${map[value]}`}>{label[value]}</span>
}

export function Confidence({ value }: { value: number }) {
  const tone = value >= 85 ? 'text-teal' : value >= 70 ? 'text-amber' : 'text-critical'
  return (
    <span className={`text-sm font-semibold tabular-nums ${tone}`} title="Confidence">
      {value}% confidence
    </span>
  )
}

export function SourceTag({
  system,
}: {
  system: string
  freshness?: string
}) {
  return (
    <span className="inline-flex items-center rounded-md bg-canvas px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted uppercase">
      {system}
    </span>
  )
}

export function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card px-4 py-3">
      <div className="text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-muted">{hint}</div> : null}
    </div>
  )
}

export function SectionTitle({
  title,
  action,
}: {
  title: string
  action?: ReactNode
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      {action}
    </div>
  )
}

