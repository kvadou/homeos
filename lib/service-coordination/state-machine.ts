export const SERVICE_CASE_STATUSES = [
  'draft',
  'safety_screened',
  'intake_ready',
  'sharing_approved',
  'sourcing',
  'awaiting_provider_responses',
  'options_ready',
  'selection_approved',
  'booking_pending',
  'confirmed',
  'service_underway',
  'completed',
  'recorded',
  'safety_stopped',
  'diy_resolved',
  'warranty_routed',
  'no_qualified_provider',
  'no_availability',
  'slot_expired',
  'cancelled',
  'booking_failed',
  'disputed',
] as const

export type ServiceCaseStatus = (typeof SERVICE_CASE_STATUSES)[number]

export const TERMINAL_SERVICE_CASE_STATUSES = new Set<ServiceCaseStatus>([
  'recorded',
  'safety_stopped',
  'diy_resolved',
  'warranty_routed',
  'no_qualified_provider',
  'no_availability',
  'cancelled',
  'disputed',
])

const TRANSITIONS: Record<ServiceCaseStatus, readonly ServiceCaseStatus[]> = {
  draft: ['safety_screened', 'safety_stopped', 'cancelled'],
  safety_screened: ['intake_ready', 'safety_stopped', 'cancelled'],
  intake_ready: ['sharing_approved', 'diy_resolved', 'warranty_routed', 'cancelled'],
  sharing_approved: ['sourcing', 'cancelled'],
  sourcing: ['awaiting_provider_responses', 'no_qualified_provider', 'cancelled'],
  awaiting_provider_responses: [
    'options_ready',
    'no_availability',
    'no_qualified_provider',
    'cancelled',
  ],
  options_ready: ['selection_approved', 'slot_expired', 'cancelled'],
  selection_approved: ['booking_pending', 'slot_expired', 'cancelled'],
  booking_pending: ['confirmed', 'booking_failed', 'slot_expired', 'cancelled'],
  confirmed: ['service_underway', 'completed', 'cancelled', 'disputed'],
  service_underway: ['completed', 'disputed'],
  completed: ['recorded', 'disputed'],
  booking_failed: ['sourcing', 'options_ready', 'cancelled'],
  slot_expired: ['sourcing', 'awaiting_provider_responses', 'cancelled'],
  recorded: [],
  safety_stopped: [],
  diy_resolved: [],
  warranty_routed: [],
  no_qualified_provider: [],
  no_availability: [],
  cancelled: [],
  disputed: [],
}

export class InvalidServiceCaseTransition extends Error {
  constructor(from: ServiceCaseStatus, to: ServiceCaseStatus) {
    super(`Invalid service case transition: ${from} -> ${to}`)
    this.name = 'InvalidServiceCaseTransition'
  }
}

export function canTransitionServiceCase(from: ServiceCaseStatus, to: ServiceCaseStatus) {
  return TRANSITIONS[from].includes(to)
}

export function assertServiceCaseTransition(
  from: ServiceCaseStatus,
  to: ServiceCaseStatus,
): void {
  if (!canTransitionServiceCase(from, to)) {
    throw new InvalidServiceCaseTransition(from, to)
  }
}

export function allowedServiceCaseTransitions(from: ServiceCaseStatus) {
  return TRANSITIONS[from]
}

