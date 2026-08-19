import type { ServiceCase } from './types'

export interface ProposedAction {
  command: string
  meaning: string
  locked?: boolean
}

export interface DeskBrief {
  headline: string
  summary: string
  language: string
  routing: string
  fareRules: string[]
  policy: string
  consultantMustKnow: string
  gdsRequired: boolean
  proposed: ProposedAction[]
}

export function deskBrief(c: ServiceCase): DeskBrief {
  if (c.workflow === 'rebook') {
    const rec = c.options.find((o) => o.recommended)
    return {
      headline: 'No GDS training required to protect this misconnect',
      summary: `${c.traveller} missed a connection. ${c.disruption}. Meeting: ${c.meetingConstraint}. Recommended ${rec?.flight ?? 'option'} arrives ${rec?.arrive ?? ''} at ${rec?.travellerCost ?? '€0'}.`,
      language: 'English · Ava can draft in the traveller’s language',
      routing: rec ? `${rec.route} · ${rec.depart}–${rec.arrive} · ${rec.cabin} · nonstop` : c.trip,
      fareRules: [
        'Same-day disruption waiver on Flex Business',
        'Reissue in the same fare family — no residual',
        'Do not involuntary overnight if a same-day J seat exists',
      ],
      policy: c.policy,
      consultantMustKnow: 'Attest the 19:30 ET meeting. Do not type cryptic GDS. Ava / TravelXen executes the reissue after you confirm.',
      gdsRequired: true,
      proposed: [
        { command: `*A ${rec?.flight ?? 'EI60'} DUBJFK 18AUG`, meaning: 'Availability on the recommended flight' },
        { command: 'WPA', meaning: 'Price in original fare family' },
        { command: 'TKP', meaning: 'Ticket / file-finish PNR into disruption queue', locked: !c.verifiedBooking && c.stage !== 'approved' && c.stage !== 'modified' && !c.resolvedByAva },
      ],
    }
  }
  if (c.workflow === 'triage') {
    const rec = c.options.find((o) => o.recommended)
    return {
      headline: 'Inventory scout must refresh before any GDS action',
      summary: `${c.traveller}: ${c.disruption}. Still in ${c.locationNow}. Board dinner ${c.meetingConstraint.replace('Board dinner ', '')}. Last Polaris on ${rec?.flight ?? 'UA 15'} is ${rec?.travellerCost ?? '$0'} if the snapshot is current.`,
      language: 'English',
      routing: rec ? `${rec.route} · ${rec.depart}–${rec.arrive} · ${rec.cabin}` : c.trip,
      fareRules: [
        'Same fare family · standard refundable',
        'Do not ticket on a snapshot older than 5 minutes',
        'Single Polaris seat — hold until freshness is current',
      ],
      policy: c.policy,
      consultantMustKnow: 'You do not need UA cryptic. Refresh inventory, then approve or hand back to Ava.',
      gdsRequired: true,
      proposed: [
        {
          command: 'INV/REF UA SFOEWR',
          meaning: 'Refresh availability (stale 11 min)',
          locked: c.inventoryFresh,
        },
        {
          command: `*A ${rec?.flight ?? 'UA15'} SFOEWR 18AUG`,
          meaning: 'Availability on last Polaris seat',
          locked: !c.inventoryFresh,
        },
        {
          command: 'TKP',
          meaning: 'Ticket only after freshness < 5 min',
          locked: !c.inventoryFresh,
        },
      ],
    }
  }
  if (c.workflow === 'ava_contained') {
    return {
      headline: 'No GDS desk work — Ava already has the plan',
      summary: c.summary,
      language: 'English',
      routing: c.originBooking,
      fareRules: c.avaPlan.length ? c.avaPlan : ['In-policy. No itinerary change unless stated.'],
      policy: c.policy,
      consultantMustKnow: 'A consultant who is not GDS-trained should not take this chat. Let Ava finish.',
      gdsRequired: false,
      proposed: [],
    }
  }
  if (c.workflow === 'servicing') {
    return {
      headline: 'No GDS — document from stored PNR',
      summary: c.summary,
      language: 'English',
      routing: c.originBooking,
      fareRules: ['No reissue. No fare construction.'],
      policy: c.policy,
      consultantMustKnow: 'Invoice generation does not need PSS commands. Ava can send it.',
      gdsRequired: false,
      proposed: [],
    }
  }
  return {
    headline: 'GDS is blocked — this is not a travel-ticketing problem',
    summary: c.summary,
    language: c.channel === 'phone' ? 'English (voice)' : 'English',
    routing: c.originBooking,
    fareRules: ['Do not interpret immigration or visa rules from the GDS.'],
    policy: c.policy,
    consultantMustKnow: 'A non-GDS agent is still not a documents specialist. Route out. Do not ticket.',
    gdsRequired: false,
    proposed: [],
  }
}
