import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react'
import { createSnapshot, ESCALATE_REASONS, OVERRIDE_REASONS } from './data'
import type { DecisionAction, DemoSnapshot, ServiceCase, Toast } from './types'

let toastSeq = 1

type Action =
  | { type: 'reset' }
  | { type: 'search'; q: string }
  | { type: 'select-interaction'; id: string }
  | { type: 'select-case'; id: string }
  | { type: 'open-case'; id: string }
  | { type: 'select-option'; caseId: string; optionId: string }
  | { type: 'set-note'; caseId: string; note: string }
  | { type: 'set-escalate-reason'; caseId: string; reason: string }
  | { type: 'set-override-reason'; caseId: string; reason: string }
  | { type: 'decide'; caseId: string; decision: DecisionAction }
  | { type: 'verify-booking'; caseId: string }
  | { type: 'verify-message'; caseId: string }
  | { type: 'capture-learning'; caseId: string }
  | { type: 'update-ava'; caseId: string; letAva: boolean }
  | { type: 'refresh-inventory'; caseId: string }
  | { type: 'leave-with-ava'; caseId: string }
  | { type: 'ava-complete'; caseId: string }
  | { type: 'send-servicing'; caseId: string }
  | { type: 'toast'; message: string }
  | { type: 'dismiss-toast'; id: string }

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

function avaPlaybookImpact(c: ServiceCase, letAva: boolean) {
  if (c.gdsFacts?.length) {
    return letAva
      ? 'Issued ticket + waiver + supplier under 5 min → Ava reissues. Consultant does not open GDS.'
      : 'Keep a person on waiver reissues like this one.'
  }
  if (c.id === 'case-maya') {
    return letAva
      ? 'Let Ava ticket same-fare-family misconnects after a person attests the calendar constraint.'
      : 'A person still confirms the meeting time. Then Ava tickets.'
  }
  if (c.id === 'case-daniel') {
    return letAva
      ? 'Ava tickets after inventory is fresh. Hard-stop when seats are older than 5 minutes.'
      : 'A person must confirm seats are fresh. Then Ava can ticket.'
  }
  return letAva ? 'Let Ava handle the next trip like this.' : 'Keep a person on this.'
}

function avaBlockedReason(c: ServiceCase): string | null {
  if (c.workflow === 'specialist') return 'Ava cannot give immigration or document advice'
  if (c.workflow === 'triage' && !c.inventoryFresh) return 'Refresh inventory before Ava can ticket'
  return null
}

function avaCompletionCopy(c: ServiceCase) {
  const option = c.options.find((o) => o.recommended) ?? c.options.find((o) => o.id === c.selectedOptionId) ?? c.options[0]
  if (c.workflow === 'servicing') {
    return {
      label: `Ava sent VAT invoice from stored PNR ${c.pnr}`,
      detail: 'No booking change',
      outcome: `VAT invoice emailed · ${c.pnr}`,
      newPnr: null as string | null,
      optionId: c.selectedOptionId,
    }
  }
  if (c.gdsFacts?.length) {
    const gdsOption = c.options.find((o) => o.recommended) ?? c.options.find((o) => o.id === c.selectedOptionId) ?? c.options[0]
    return {
      label: `Ava reissued ${gdsOption?.flight ?? 'AA 177'} on issued ticket · PNR ${c.pnr}`,
      detail: `${gdsOption?.policyFit ?? 'Airline waiver'} · supplier 2 min`,
      outcome: `${gdsOption?.flight ?? 'AA 177'} · ${gdsOption?.travellerCost ?? '$0'} · waiver · ${c.pnr}`,
      newPnr: null,
      optionId: gdsOption?.id ?? c.selectedOptionId,
    }
  }
  if (c.workflow === 'ava_contained' && option == null) {
    return {
      label: c.intent.toLowerCase().includes('schedule')
        ? `Ava accepted schedule change · PNR ${c.pnr} unchanged`
        : `Ava finished ${c.intent.toLowerCase()} on PNR ${c.pnr}`,
      detail: c.avaPlan[0] ?? 'Contained without consultant',
      outcome: c.avaPlan[0] ?? 'Ava contained',
      newPnr: null,
      optionId: null as string | null,
    }
  }
  return {
    label: `Ava ticketed ${option?.flight ?? 'recommended option'} · PNR AVA84K2`,
    detail: option?.policyFit ?? 'In-policy auto-ticket',
    outcome: `${option?.flight ?? 'Reissue'} · ${option?.travellerCost ?? '€0'} · AVA84K2`,
    newPnr: 'AVA84K2',
    optionId: option?.id ?? c.selectedOptionId,
  }
}

function applyAvaComplete(state: DemoSnapshot, caseId: string): DemoSnapshot {
  const c = state.cases.find((x) => x.id === caseId)
  if (!c) return state
  if (c.stage === 'verified' || c.stage === 'learned') return state
  const blocked = avaBlockedReason(c)
  if (blocked) return addToast(state, blocked)
  const copy = avaCompletionCopy(c)
  const run = {
    id: `ava-${c.id}-${nowTime()}`,
    time: `Today ${nowTime()}`,
    traveller: c.traveller,
    caseNumber: c.caseNumber,
    caseId: c.id,
    intent: c.intent,
    outcome: copy.outcome,
    status: 'resolved' as const,
  }
  const next = {
    ...patchCase(state, caseId, {
      selectedOptionId: copy.optionId,
      verifiedBooking: true,
      verifiedMessage: true,
      resolvedByAva: true,
      newPnr: copy.newPnr,
      stage: 'verified' as const,
      avaOutcome: 'Ava resolved — no consultant handle',
      timeline: [
        ...c.timeline,
        {
          id: `ava-done-${c.id}`,
          time: nowTime(),
          actor: 'Ava',
          label: copy.label,
          detail: copy.detail,
        },
      ],
    }),
    avaRuns: [run, ...state.avaRuns.filter((r) => r.caseId !== c.id && r.caseNumber !== c.caseNumber)],
    avaResolvedToday: Math.min(78, state.avaResolvedToday + 3),
    openCases: Math.max(0, state.openCases - 1),
    urgentDisruptions:
      c.urgency === 'urgent' ? Math.max(0, state.urgentDisruptions - 1) : state.urgentDisruptions,
    interactions: state.interactions.map((i) =>
      i.caseId === caseId ? { ...i, state: 'resolved' as const, ava: copy.outcome } : i,
    ),
  }
  return addToast(next, copy.label)
}

function addToast(state: DemoSnapshot, message: string): DemoSnapshot {
  return {
    ...state,
    toasts: [...state.toasts, { id: `t-${toastSeq++}`, message }],
  }
}

function selectPair(state: DemoSnapshot, interactionId?: string, caseId?: string): DemoSnapshot {
  const byInteraction = interactionId ? state.interactions.find((i) => i.id === interactionId) : undefined
  const resolvedCaseId = caseId ?? byInteraction?.caseId
  const byCase = resolvedCaseId ? state.interactions.find((i) => i.caseId === resolvedCaseId) : undefined
  return {
    ...state,
    selectedInteractionId: byInteraction?.id ?? byCase?.id ?? state.selectedInteractionId,
    selectedCaseId: resolvedCaseId ?? state.selectedCaseId,
  }
}

function patchCase(state: DemoSnapshot, id: string, patch: Partial<DemoSnapshot['cases'][number]>): DemoSnapshot {
  return {
    ...state,
    cases: state.cases.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  }
}

function reducer(state: DemoSnapshot, action: Action): DemoSnapshot {
  switch (action.type) {
    case 'reset':
      toastSeq = 1
      return createSnapshot()
    case 'search':
      return { ...state, search: action.q }
    case 'select-interaction':
      return selectPair(state, action.id, undefined)
    case 'select-case':
      return selectPair(state, undefined, action.id)
    case 'open-case': {
      const interaction = state.interactions.find((i) => i.caseId === action.id)
      return addToast(
        {
          ...state,
          selectedCaseId: action.id,
          selectedInteractionId: interaction?.id ?? state.selectedInteractionId,
          interactions: state.interactions.map((i) =>
            i.caseId === action.id && i.state === 'ava_escalated' ? { ...i, state: 'with_consultant' } : i,
          ),
          cases: state.cases.map((c) =>
            c.id === action.id && c.stage === 'intake' ? { ...c, stage: 'brief_ready' } : c,
          ),
        },
        'Case opened in TravelXen with full handoff context',
      )
    }
    case 'select-option': {
      const current = state.cases.find((c) => c.id === action.caseId)
      if (!current || current.stage === 'verified' || current.stage === 'learned' || current.stage === 'escalated') {
        return state
      }
      if (current.workflow === 'triage' && !current.inventoryFresh) {
        return addToast(state, 'Refresh inventory before selecting a flight')
      }
      return patchCase(state, action.caseId, {
        selectedOptionId: action.optionId,
        stage: 'option_selected',
      })
    }
    case 'set-note':
      return patchCase(state, action.caseId, { decisionNote: action.note })
    case 'set-escalate-reason':
      return patchCase(state, action.caseId, { escalateReason: action.reason })
    case 'set-override-reason':
      return patchCase(state, action.caseId, { overrideReason: action.reason })
    case 'decide': {
      const c = state.cases.find((x) => x.id === action.caseId)
      if (!c) return state
      if (action.decision !== 'escalate' && !c.selectedOptionId) {
        return addToast(state, 'Select a rebooking option before approving or overriding')
      }
      if (action.decision !== 'escalate' && c.workflow === 'triage' && !c.inventoryFresh) {
        return addToast(state, 'Inventory is stale — refresh before ticketing')
      }
      if (action.decision === 'escalate' && !c.escalateReason) {
        return addToast(state, 'Choose an escalation reason')
      }
      if (action.decision === 'override' && !c.overrideReason) {
        return addToast(state, 'Choose why you are overriding Ava')
      }
      const option = c.options.find((o) => o.id === c.selectedOptionId)
      if (action.decision === 'override' && option?.recommended) {
        return addToast(state, 'Pick a different flight than Ava’s recommendation to override')
      }
      const label =
        action.decision === 'approve'
          ? `Approved ${option?.flight ?? 'option'} — awaiting verification`
          : action.decision === 'modify'
            ? `Modified recommendation — ${option?.flight ?? 'option'} selected`
            : action.decision === 'override'
              ? `Overrode Ava — ${option?.flight ?? 'option'} · ${c.overrideReason}`
              : `Escalated: ${c.escalateReason}`
      let next = patchCase(state, action.caseId, {
        decision: action.decision,
        stage: action.decision === 'escalate' ? 'escalated' : action.decision === 'approve' ? 'approved' : 'modified',
        timeline: [
          ...c.timeline,
          {
            id: `dec-${action.caseId}`,
            time: nowTime(),
            actor: 'Alex Morgan',
            label: label,
            detail: c.decisionNote || c.overrideReason || 'Consultant decision recorded',
          },
        ],
      })
      if (action.decision === 'escalate') {
        next = {
          ...next,
          interactions: next.interactions.map((i) =>
            i.caseId === action.caseId ? { ...i, state: 'specialist_review' } : i,
          ),
        }
      }
      return addToast(next, label)
    }
    case 'verify-booking': {
      const c = state.cases.find((x) => x.id === action.caseId)
      if (!c || (c.stage !== 'approved' && c.stage !== 'modified')) return state
      const option = c.options.find((o) => o.id === c.selectedOptionId)
      return addToast(
        patchCase(state, action.caseId, {
          verifiedBooking: true,
          newPnr: 'TXN84K2',
          timeline: [
            ...c.timeline,
            {
              id: 'v-book',
              time: nowTime(),
              actor: 'TravelXen',
              label: `Ticketing verified · ${option?.flight ?? 'reissue'} · PNR TXN84K2`,
              detail: 'No live GDS/NDC call',
            },
          ],
        }),
        'Booking outcome verified · PNR TXN84K2',
      )
    }
    case 'verify-message': {
      const c = state.cases.find((x) => x.id === action.caseId)
      if (!c) return state
      const canSend =
        c.verifiedBooking || c.workflow === 'servicing' || (c.workflow === 'specialist' && c.stage === 'escalated')
      if (!canSend) {
        return addToast(state, 'Verify the booking before sending the traveller update')
      }
      return addToast(
        patchCase(state, action.caseId, {
          verifiedMessage: true,
          stage: 'verified',
          timeline: [
            ...c.timeline,
            {
              id: 'v-msg',
              time: nowTime(),
              actor: 'Alex Morgan',
              label: 'WhatsApp update sent after verification',
              detail: 'Message released only after ticketing confirmed',
            },
          ],
        }),
        'Traveller update sent — case verified',
      )
    }
    case 'capture-learning': {
      const c = state.cases.find((x) => x.id === action.caseId)
      if (!c || (c.stage !== 'verified' && c.stage !== 'escalated')) return state
      const option = c.options.find((o) => o.id === c.selectedOptionId)
      const already = state.signals.some((s) => s.caseNumber === c.caseNumber)
      if (already) return state
      const stillOpen = state.interactions.find((i) => i.caseId === c.id)?.state !== 'resolved'
      const byWorkflow = {
        rebook: {
          outcome: option ? `${option.flight} · ${option.arrive}` : 'Rebooked',
          consultantAction: c.resolvedByAva
            ? 'Attested meeting fit, handed EI 60 back to Ava'
            : c.decision === 'override'
              ? `Overrode Ava · ${c.overrideReason}`
              : c.decision === 'modify'
                ? 'Modified recommendation'
                : 'Approved recommended option',
          whatWorked: c.resolvedByAva
            ? 'In-policy €0 same-day option was safe to automate after a one-click attest.'
            : 'Meeting constraint + fare-family protection produced a same-day ticket without overnight.',
          playbookImpact: c.resolvedByAva
            ? 'Let Ava ticket same-fare-family misconnects after consultant attests the calendar constraint.'
            : 'Promote “arrive before meeting” as a first-class Case Brief field for misconnects.',
        },
        triage: {
          outcome: option ? `${option.flight} after inventory refresh` : 'Held until inventory fresh',
          consultantAction: c.resolvedByAva ? 'Refreshed inventory, then Ava ticketed' : 'Refreshed stale inventory, then ticketed',
          whatWorked: 'Agent refused to ticket on an 11-minute-stale snapshot.',
          playbookImpact: 'Hard-stop Ava autopilot when inventory freshness > 5 min, then hand back.',
        },
        ava_contained: {
          outcome: c.gdsFacts?.length
            ? `${c.options.find((o) => o.recommended)?.flight ?? 'AA 177'} reissued on issued ticket · ${c.pnr}`
            : (c.avaPlan[0] ?? 'Ava contained'),
          consultantAction: c.gdsFacts?.length
            ? 'Did not type GDS — Ava reissued under the airline waiver'
            : c.resolvedByAva
              ? 'Left with Ava'
              : 'Observed Ava containment',
          whatWorked: c.gdsFacts?.length
            ? 'Issued ticket, confirmed eligibility, airline waiver available, supplier snapshot 2 min old. Ava ticketed without a consultant handle.'
            : c.resolvedByAva
              ? 'In-policy request finished without a consultant handle.'
              : 'Agent did not take a low-complexity chat.',
          playbookImpact: c.gdsFacts?.length
            ? 'Issued ticket + waiver + supplier under 5 min → Ava reissues. Consultant does not open GDS.'
            : 'Expand Ava containment for seat, schedule-change, and invoice intents.',
        },
        servicing: {
          outcome: 'VAT invoice sent',
          consultantAction: c.resolvedByAva ? 'Handed invoice to Ava' : 'Sent document from stored PNR',
          whatWorked: 'No booking change required.',
          playbookImpact: 'Route invoice intents to Ava servicing, not disruption.',
        },
        specialist: {
          outcome: 'Documents specialist',
          consultantAction: 'Escalated — no immigration advice',
          whatWorked: 'Agent did not answer an ESTA question.',
          playbookImpact: 'Document intents skip consultant judgment.',
        },
      }[c.workflow]
      const signal = {
        id: `sig-${c.id}`,
        time: `Today ${nowTime()}`,
        caseNumber: c.caseNumber,
        traveller: c.traveller,
        intent: c.intent,
        ...byWorkflow,
        captured: true,
      }
      return addToast(
        {
          ...patchCase(state, action.caseId, {
            stage: 'learned',
            timeline: [
              ...c.timeline,
              {
                id: 'learn',
                time: nowTime(),
                actor: 'Quality',
                label: 'Resolution captured as a learning signal',
                detail: 'Playbook candidate queued',
              },
            ],
          }),
          signals: [signal, ...state.signals],
          openCases: stillOpen ? Math.max(0, state.openCases - 1) : state.openCases,
          urgentDisruptions:
            stillOpen && c.urgency === 'urgent' ? Math.max(0, state.urgentDisruptions - 1) : state.urgentDisruptions,
          interactions: state.interactions.map((i) => (i.caseId === action.caseId ? { ...i, state: 'resolved' } : i)),
        },
        'Learning signal captured — open in Resolution hub',
      )
    }
    case 'update-ava': {
      const c = state.cases.find((x) => x.id === action.caseId)
      if (!c) return state
      const playbookImpact = avaPlaybookImpact(c, action.letAva)
      const signals = state.signals.map((s) =>
        s.caseNumber === c.caseNumber || s.id === `sig-${c.id}` ? { ...s, playbookImpact } : s,
      )
      return addToast(
        { ...state, signals },
        action.letAva ? 'Ava will handle this next time' : 'A person stays on this',
      )
    }
    case 'refresh-inventory': {
      const c = state.cases.find((x) => x.id === action.caseId)
      if (!c || c.inventoryFresh) return state
      return addToast(
        patchCase(state, action.caseId, {
          inventoryFresh: true,
          confidence: 89,
          contextCompleteness: 86,
          timeline: [
            ...c.timeline,
            {
              id: 'inv-refresh',
              time: nowTime(),
              actor: 'TravelXen',
              label: 'Inventory snapshot refreshed',
              detail: 'UA 15 Polaris still 1 seat · freshness 1 min',
            },
          ],
        }),
        'Inventory fresh — hand UA 15 back to Ava, or ticket it yourself',
      )
    }
    case 'leave-with-ava':
    case 'ava-complete':
      return applyAvaComplete(state, action.caseId)
    case 'send-servicing': {
      const c = state.cases.find((x) => x.id === action.caseId)
      if (!c) return state
      return addToast(
        patchCase(state, action.caseId, {
          verifiedBooking: true,
          verifiedMessage: true,
          stage: 'verified',
          timeline: [
            ...c.timeline,
            {
              id: 'invoice',
              time: nowTime(),
              actor: 'Alex Morgan',
              label: 'VAT invoice sent from stored PNR',
              detail: 'No booking change',
            },
          ],
        }),
        'Invoice sent — servicing complete',
      )
    }
    case 'toast':
      return addToast(state, action.message)
    case 'dismiss-toast':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }
    default:
      return state
  }
}

interface StoreApi extends DemoSnapshot {
  selectedInteraction: DemoSnapshot['interactions'][number] | undefined
  selectedCase: DemoSnapshot['cases'][number] | undefined
  dispatch: (action: Action) => void
  reset: () => void
  toast: (message: string) => void
  dismissToast: (id: string) => void
}

const Ctx = createContext<StoreApi | null>(null)

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createSnapshot)
  const api = useMemo<StoreApi>(() => {
    const selectedInteraction = state.interactions.find((i) => i.id === state.selectedInteractionId)
    const selectedCase =
      state.cases.find((c) => c.id === state.selectedCaseId) ??
      state.cases.find((c) => c.interactionId === state.selectedInteractionId)
    return {
      ...state,
      selectedInteraction,
      selectedCase,
      dispatch,
      reset: () => dispatch({ type: 'reset' }),
      toast: (message: string) => dispatch({ type: 'toast', message }),
      dismissToast: (id: string) => dispatch({ type: 'dismiss-toast', id }),
    }
  }, [state])
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useDemo() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useDemo must be used inside DemoProvider')
  return v
}

export { ESCALATE_REASONS, OVERRIDE_REASONS, avaBlockedReason }

export type { Toast }
