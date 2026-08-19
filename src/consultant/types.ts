export type Channel = 'whatsapp' | 'phone' | 'chat' | 'email'
export type Priority = 'urgent' | 'high' | 'medium' | 'low'
export type ViewId = 'intake' | 'workspace' | 'learning' | 'orchestration'

export type InteractionState =
  | 'ava_escalated'
  | 'waiting_triage'
  | 'ava_resolving'
  | 'queued'
  | 'specialist_review'
  | 'with_consultant'
  | 'resolved'

export type CaseStage =
  | 'intake'
  | 'brief_ready'
  | 'option_selected'
  | 'approved'
  | 'modified'
  | 'escalated'
  | 'verified'
  | 'learned'

export type DecisionAction = 'approve' | 'modify' | 'override' | 'escalate'
export type AgentWorkflow = 'rebook' | 'triage' | 'ava_contained' | 'servicing' | 'specialist'

export interface SourceLabel {
  system: string
  capturedAt: string
  freshness: string
  demo?: boolean
}

export interface TimelineItem {
  id: string
  time: string
  actor: string
  label: string
  detail: string
}

export interface EvidenceItem {
  id: string
  label: string
  value: string
  source: SourceLabel
}

export interface RebookOption {
  id: string
  recommended?: boolean
  airline: string
  flight: string
  route: string
  depart: string
  arrive: string
  duration: string
  cabin: string
  seats: number
  travellerCost: string
  policyFit: string
  confidence: number
  risks: string[]
  evidence: EvidenceItem[]
  notes: string
}

export interface NextBestAction {
  id: string
  label: string
  reason: string
  owner: 'consultant' | 'ava' | 'specialist'
}

export interface MessagePreview {
  channel: Channel
  to: string
  body: string
}

export interface FlightSegment {
  from: string
  fromCity: string
  to: string
  toCity: string
  flight: string
  airline: string
  depart: string
  arrive: string
  status: 'ok' | 'delayed' | 'missed' | 'proposed'
}

export interface ServiceCase {
  id: string
  interactionId: string
  caseNumber: string
  traveller: string
  company: string
  role: string
  phone: string
  email: string
  channel: Channel
  intent: string
  summary: string
  urgency: Priority
  confidence: number
  contextCompleteness: number
  workflow: AgentWorkflow
  inventoryFresh: boolean
  stage: CaseStage
  selectedOptionId: string | null
  decision: DecisionAction | null
  decisionNote: string
  escalateReason: string
  overrideReason: string
  verifiedBooking: boolean
  verifiedMessage: boolean
  pnr: string
  newPnr: string | null
  policy: string
  trip: string
  originBooking: string
  segments: FlightSegment[]
  disruption: string
  preferences: string[]
  loyalty: string
  locationNow: string
  meetingConstraint: string
  avaOutcome: string
  avaPlan: string[]
  resolvedByAva: boolean
  genesysQueue: string
  nextBestActions: NextBestAction[]
  timeline: TimelineItem[]
  transcript: { time: string; from: string; text: string }[]
  options: RebookOption[]
  messagePreview: MessagePreview
}

export type SupervisorRoute = 'ava' | 'human' | 'specialist'
export type Sentiment = 'calm' | 'neutral' | 'anxious' | 'stressed'

export interface SupervisorDecision {
  routeTo: SupervisorRoute
  sentiment: Sentiment
  vip: boolean
  language: string
  complexity: 'low' | 'medium' | 'high'
  reason: string
  confidence: number
}

export interface Interaction {
  id: string
  caseId: string
  channel: Channel
  time: string
  wait: string
  traveller: string
  company: string
  intent: string
  priority: Priority
  state: InteractionState
  genesysId: string
  ava: string
  routing: string
  supervisor: SupervisorDecision
}

export interface LearningSignal {
  id: string
  time: string
  caseNumber: string
  traveller: string
  intent: string
  outcome: string
  consultantAction: string
  whatWorked: string
  playbookImpact: string
  captured: boolean
}

export interface Toast {
  id: string
  message: string
}

export interface AvaRun {
  id: string
  time: string
  traveller: string
  caseNumber: string
  caseId?: string
  intent: string
  outcome: string
  status: 'running' | 'resolved'
}

export interface DemoSnapshot {
  interactions: Interaction[]
  cases: ServiceCase[]
  signals: LearningSignal[]
  avaRuns: AvaRun[]
  selectedInteractionId: string
  selectedCaseId: string | null
  search: string
  toasts: Toast[]
  openCases: number
  urgentDisruptions: number
  avaResolvedToday: number
  contextCompleteness: number
}
