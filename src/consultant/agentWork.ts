import type { Channel, ServiceCase, SupervisorRoute } from './types'

export type HelperId = 'summariser' | 'calendar' | 'inventory' | 'rules' | 'policy' | 'gds' | 'draft' | 'quality'
export type HelperStatus = 'idle' | 'working' | 'done' | 'blocked' | 'skipped'

export interface HelperDef {
  id: HelperId
  name: string
  owner: 'Ava' | 'TravelXen' | 'Quality'
  job: string
  speeds: string
}

export interface AgentAssignment {
  helperId: HelperId
  doing: string
  result: string
  blocked?: boolean
  skip?: boolean
}

export interface FlowPhase {
  id: string
  actor: string
  title: string
  detail: string
  helperId?: HelperId
}

export const HELPERS: HelperDef[] = [
  {
    id: 'summariser',
    name: 'PNR summariser',
    owner: 'Ava',
    job: 'Turns a messy PNR, chat and disruption into a few sentences. Native language, no cryptic.',
    speeds: 'A new hire reads the miss-connect without opening a GDS mask.',
  },
  {
    id: 'calendar',
    name: 'Constraint watch',
    owner: 'TravelXen',
    job: 'Pins meeting times into the trip so routing is judged against a calendar, not a guess.',
    speeds: 'Consultant attests one field instead of rebuilding the itinerary from chat.',
  },
  {
    id: 'inventory',
    name: 'Inventory scout',
    owner: 'TravelXen',
    job: 'Keeps the fare snapshot under 5 minutes so nobody tickets stale availability.',
    speeds: 'Stops a promise on a seat that may already be gone.',
  },
  {
    id: 'rules',
    name: 'Fare-rule reader',
    owner: 'TravelXen',
    job: 'Reads fare family, residual, waiver and penalties so the consultant does not decode CAT rules.',
    speeds: 'Recommended flight is already tagged same-family / in-policy.',
  },
  {
    id: 'policy',
    name: 'Policy checker',
    owner: 'TravelXen',
    job: 'Confirms company policy and disruption cap against the proposed itinerary.',
    speeds: 'Stops a residual that would need a supervisor exception.',
  },
  {
    id: 'gds',
    name: 'GDS copilot',
    owner: 'Ava',
    job: 'Proposes availability, price and ticket commands. Executes only after attest or Ava containment.',
    speeds: 'Consultants who were never Sabre/Amadeus trained can still finish a reissue.',
  },
  {
    id: 'draft',
    name: 'Message drafter',
    owner: 'Ava',
    job: 'Writes the traveller update, then locks send until ticketing verifies.',
    speeds: 'Alex does not type a WhatsApp from scratch after every reissue.',
  },
  {
    id: 'quality',
    name: 'Quality loop',
    owner: 'Quality',
    job: 'Turns a verified handle into a playbook so Ava can take the next one.',
    speeds: 'Today’s attest becomes tomorrow’s containment.',
  },
]

const HELPER_MAP = Object.fromEntries(HELPERS.map((h) => [h.id, h])) as Record<HelperId, HelperDef>

export function helperDef(id: HelperId) {
  return HELPER_MAP[id]
}

export function assignmentsFor(c: ServiceCase): AgentAssignment[] {
  const rec = c.options.find((o) => o.recommended)
  const byCase: Partial<Record<string, AgentAssignment[]>> = {
    'case-maya': [
      { helperId: 'summariser', doing: 'Reading PNR M4YAPT and the WhatsApp thread', result: 'BA 832 late 94 min. Missed EI 154. Maya is airside DUB T2.' },
      { helperId: 'calendar', doing: 'Pinning the client workshop', result: 'Must land before 19:30 ET · One World Trade Center.' },
      { helperId: 'inventory', doing: 'Shopping same-day DUB–JFK in J', result: 'EI 60 16:15–18:55 · 2 seats · snapshot 4 min old.' },
      { helperId: 'rules', doing: 'Reading Flex Business waiver and fare family', result: 'Same-day reissue · €0 residual · do not overnight.' },
      { helperId: 'policy', doing: 'Checking Meridian disruption cap', result: 'In policy. No supervisor exception needed.' },
      { helperId: 'gds', doing: 'Proposing availability and ticket — not typing them', result: '*A EI60 DUBJFK · WPA · TKP locked until Alex attests.' },
      { helperId: 'draft', doing: 'Drafting the WhatsApp', result: 'Locked until the ticket verifies. No premature “you’re rebooked.”' },
      { helperId: 'quality', doing: 'Waiting to capture the attest as a playbook', result: 'If Alex hands EI 60 back, Ava contains the next miss-connect.' },
    ],
    'case-jordan': [
      { helperId: 'summariser', doing: 'Reading PNR JH117BA and BA 117 delay', result: 'BA 117 +2h 10m. AA 198 JFK–SFO will miss.' },
      { helperId: 'calendar', doing: 'Pinning tomorrow’s board in SFO', result: '09:00 PT South San Francisco still holds on a same-night arrival.' },
      { helperId: 'inventory', doing: 'Shopping JFK–SFO under the waiver', result: 'AA 177 19:25 · 3 J seats · supplier 2 min ago.' },
      { helperId: 'rules', doing: 'Confirming issued-ticket reissue rules', result: 'Rebooking eligibility confirmed.' },
      { helperId: 'policy', doing: 'Checking airline involuntary waiver', result: 'Waiver available · $0 · same fare family.' },
      { helperId: 'gds', doing: 'Ava executing *A AA177 / WPA / TKP', result: 'Consultant does not type. Ticket already issued.' },
      { helperId: 'draft', doing: 'Drafting WhatsApp', result: 'Locked until AA 177 tickets.' },
      { helperId: 'quality', doing: 'This handle becomes an Ava playbook', result: 'Issued ticket + waiver + fresh GDS → Ava.' },
    ],
    'case-daniel': [
      { helperId: 'summariser', doing: 'Reading cancelled UA 918 and lounge hold', result: 'Daniel is in the Club. Board dinner still tonight.' },
      { helperId: 'calendar', doing: 'Pinning board dinner', result: c.meetingConstraint },
      {
        helperId: 'inventory',
        doing: c.inventoryFresh ? 'Refreshing UA SFO–EWR Polaris' : 'Holding — snapshot is 11 minutes stale',
        result: c.inventoryFresh ? 'UA 15 last Polaris · $0 · 1 min old. Ticketing unlocked.' : 'Do not ticket. Scout must refresh first.',
      },
      { helperId: 'rules', doing: 'Reading refundable Polaris family', result: 'Same fare family if snapshot is current.' },
      { helperId: 'policy', doing: 'Checking disruption vs board dinner', result: 'In policy once inventory is fresh.' },
      {
        helperId: 'gds',
        doing: 'Commands proposed, execution locked on stale inventory',
        result: c.inventoryFresh ? 'INV/REF done. TKP ready after attest.' : 'INV/REF UA SFOEWR locked until refresh.',
        blocked: !c.inventoryFresh,
      },
      { helperId: 'draft', doing: 'Holding the lounge message', result: 'No seat promise until inventory is under 5 minutes.' },
      { helperId: 'quality', doing: 'Hard-stop playbook already live', result: 'Stale inventory → never autopilot.' },
    ],
    'case-olivia': [
      { helperId: 'summariser', doing: 'Reading seat-only request', result: 'No itinerary change. Paid seat inside policy.' },
      { helperId: 'calendar', doing: 'No meeting constraint on a seat request', result: 'Nothing to pin.', skip: true },
      { helperId: 'inventory', doing: 'Seat map already in Ava', result: 'No air shop required.', skip: true },
      { helperId: 'rules', doing: 'Confirming paid-seat eligibility', result: 'In fare family. No residual.' },
      { helperId: 'policy', doing: 'Company paid-seat policy', result: 'In policy. Supervisor keeps with Ava.' },
      { helperId: 'gds', doing: 'Ava will file the seat — consultant should not take this', result: 'No cryptic for Alex. Let Ava finish.' },
      { helperId: 'draft', doing: 'Ava drafting the seat confirmation', result: 'Sends when the seat files.' },
      { helperId: 'quality', doing: 'Playbook already live', result: 'Seat-only, in-policy → Ava.' },
    ],
    'case-arjun': [
      { helperId: 'summariser', doing: 'Reading VAT invoice request', result: 'Document only. PNR unchanged.' },
      { helperId: 'calendar', doing: 'No travel constraint', result: 'Not a disruption.', skip: true },
      { helperId: 'inventory', doing: 'No air shop', result: 'Servicing from stored PNR.', skip: true },
      { helperId: 'rules', doing: 'No reissue', result: 'Fare family untouched.', skip: true },
      { helperId: 'policy', doing: 'Billing document policy', result: 'Ava may generate and send.' },
      { helperId: 'gds', doing: 'No GDS desk work', result: 'Invoice from stored PNR — not a ticket.', skip: true },
      { helperId: 'draft', doing: 'Building the VAT invoice', result: c.verifiedMessage ? 'Sent.' : 'Ava can send from servicing.' },
      { helperId: 'quality', doing: 'Playbook already live', result: 'VAT invoice from stored PNR → Ava.' },
    ],
    'case-sofia': [
      { helperId: 'summariser', doing: 'Reading ESTA / document question on AZ 610', result: 'This is immigration, not a miss-connect.' },
      { helperId: 'calendar', doing: 'Trip timing is not the risk', result: 'Do not treat as IRROPS.', skip: true },
      { helperId: 'inventory', doing: 'Not an inventory problem', result: 'Keep AZ 610 on hold. Do not shop.', skip: true },
      { helperId: 'rules', doing: 'Fare rules are not visa rules', result: 'Do not decode ESTA from CAT text.', skip: true },
      { helperId: 'policy', doing: 'Travel policy cannot answer documents', result: 'Route out of travel.' },
      { helperId: 'gds', doing: 'GDS copilot is blocked', result: 'A non-GDS agent is still not a documents specialist.', blocked: true },
      { helperId: 'draft', doing: 'Holding message only after escalate', result: 'Do not confirm ESTA validity in chat.' },
      { helperId: 'quality', doing: 'Keep this out of Ava automation', result: 'Documents / visa never auto-contain.' },
    ],
    'case-luca': [
      { helperId: 'summariser', doing: 'Reading carrier schedule change', result: 'Same ticket. Meeting still holds.' },
      { helperId: 'calendar', doing: 'Checking the meeting still fits', result: c.meetingConstraint },
      { helperId: 'inventory', doing: 'No new shop — accept on original PNR', result: 'Carrier retimed the same flight.', skip: true },
      { helperId: 'rules', doing: 'Same-ticket change rules', result: 'No residual. Original fare family stands.' },
      { helperId: 'policy', doing: 'Involuntary sked-chg policy', result: 'Ava may accept. Consultant should not take this.' },
      { helperId: 'gds', doing: 'Ava files the accept', result: 'No cryptic for Alex.' },
      { helperId: 'draft', doing: 'Ava drafting the sked-chg note', result: 'Sends after the accept files.' },
      { helperId: 'quality', doing: 'Playbook already live', result: 'Same-ticket schedule change → Ava.' },
    ],
  }

  return (
    byCase[c.id] ?? [
      { helperId: 'summariser', doing: `Reading PNR ${c.pnr}`, result: c.summary },
      { helperId: 'calendar', doing: 'Reading constraints', result: c.meetingConstraint, skip: c.workflow === 'servicing' },
      { helperId: 'inventory', doing: 'Checking inventory freshness', result: c.inventoryFresh ? 'Fresh' : 'Stale', skip: c.options.length === 0 },
      { helperId: 'rules', doing: 'Reading fare rules', result: rec?.policyFit ?? c.policy, skip: c.options.length === 0 },
      { helperId: 'policy', doing: 'Checking policy', result: c.policy },
      { helperId: 'gds', doing: 'Proposing commands', result: rec ? `${rec.flight} held in portal` : 'No ticket action', blocked: c.workflow === 'specialist' },
      { helperId: 'draft', doing: 'Drafting traveller update', result: c.messagePreview.body },
      { helperId: 'quality', doing: 'Waiting for capture', result: 'Playbook updates after a verified handle.' },
    ]
  )
}

export function liveStatus(a: AgentAssignment, c: ServiceCase): HelperStatus {
  if (a.skip) return 'skipped'
  if (a.blocked) return 'blocked'
  if (a.helperId === 'inventory' && !c.inventoryFresh && c.workflow === 'triage') return 'working'
  if (a.helperId === 'gds') {
    if (c.workflow === 'specialist') return 'blocked'
    if (c.resolvedByAva || c.verifiedBooking) return 'done'
    if (c.workflow === 'ava_contained' || c.workflow === 'servicing') return 'working'
    return 'idle'
  }
  if (a.helperId === 'draft') {
    if (c.verifiedMessage) return 'done'
    if (c.verifiedBooking || c.resolvedByAva) return 'working'
    return 'idle'
  }
  if (a.helperId === 'quality') {
    if (c.stage === 'learned') return 'done'
    return 'idle'
  }
  return 'done'
}

export function statusAtPhase(a: AgentAssignment, phaseIndex: number, currentStep: number, playing: boolean, c: ServiceCase): HelperStatus {
  if (a.skip) return 'skipped'
  if (a.blocked && currentStep >= phaseIndex) return 'blocked'
  if (playing) {
    if (currentStep < phaseIndex) return 'idle'
    if (currentStep === phaseIndex) return a.blocked ? 'blocked' : 'working'
    if (a.helperId === 'inventory' && !c.inventoryFresh && c.workflow === 'triage') return 'working'
    if (a.blocked) return 'blocked'
    return 'done'
  }
  return liveStatus(a, c)
}

export function flowPhases(c: ServiceCase, route: SupervisorRoute, channel: Channel, genesysId: string, routing: string, reason: string): FlowPhase[] {
  const work = assignmentsFor(c)
  const before: HelperId[] = ['summariser', 'calendar', 'inventory', 'rules', 'policy', 'gds']
  const after: HelperId[] = ['draft', 'quality']
  const toPhase = (a: AgentAssignment): FlowPhase => ({
    id: a.helperId,
    actor: helperDef(a.helperId).name,
    title: a.doing,
    detail: a.result,
    helperId: a.helperId,
  })

  const owner: FlowPhase =
    route === 'ava'
      ? {
          id: 'owner',
          actor: 'Ava',
          title: 'Keeps the chat — consultant should not take this',
          detail: c.avaPlan[0] ?? c.avaOutcome,
        }
      : route === 'specialist'
        ? {
            id: 'owner',
            actor: 'Documents specialist',
            title: 'Travel consultant is skipped',
            detail: 'Ava must not give immigration advice. Booking stays on hold.',
          }
        : {
            id: 'owner',
            actor: 'Consultant · Alex',
            title: 'Attest judgment only — do not type GDS',
            detail: c.resolvedByAva ? 'Handed back. Ava finished ticketing.' : 'Alex attests meeting / freshness / specialist risk. Helpers already did the cryptic.',
          }

  const pick = (ids: HelperId[]) =>
    ids
      .map((id) => work.find((w) => w.helperId === id))
      .filter((w): w is AgentAssignment => Boolean(w) && !w.skip)
      .map(toPhase)

  return [
    {
      id: 'genesys',
      actor: 'Genesys',
      title: `${channelLabel(channel)} captured`,
      detail: `${genesysId} · ${routing}`,
    },
    {
      id: 'score',
      actor: 'AI Supervisor',
      title: 'Scoring intent, sentiment, complexity',
      detail: `${c.intent} · context ${c.contextCompleteness}%`,
    },
    {
      id: 'route',
      actor: 'AI Supervisor',
      title: route === 'ava' ? 'Keep with Ava' : route === 'specialist' ? 'Route to specialist' : 'Route to consultant',
      detail: reason,
    },
    ...pick(before),
    owner,
    ...pick(after),
  ]
}

export function phaseIndexForHelper(phases: FlowPhase[], helperId: HelperId) {
  return phases.findIndex((p) => p.helperId === helperId)
}

export function statusLabel(status: HelperStatus) {
  if (status === 'working') return 'Working'
  if (status === 'done') return 'Done'
  if (status === 'blocked') return 'Blocked'
  if (status === 'skipped') return 'Not this contact'
  return 'Waiting'
}

function channelLabel(channel: Channel) {
  return { whatsapp: 'WhatsApp', phone: 'Phone', chat: 'Chat', email: 'Email' }[channel]
}
