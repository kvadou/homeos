/**
 * Canonical product analytics vocabulary shared by web, iOS API routes, and
 * the internal activation dashboard. Event names are stable data contracts:
 * rename labels in the UI, never historical event keys.
 */
export const ANALYTICS_EVENTS = {
  onboardingStarted: 'onboarding_started',
  onboardingStepViewed: 'onboarding_step_viewed',
  onboardingCompleted: 'onboarding_completed',
  homeCreated: 'home_created',
  itemCreated: 'item_created',
  fileUploaded: 'file_uploaded',
  fileIngestRequested: 'file_ingest_requested',
  extractionCompleted: 'extraction_completed',
  questionAsked: 'question_asked',
  suggestionAccepted: 'suggestion_accepted',
  scanFeedbackSubmitted: 'scan_feedback_submitted',
  betaFeedbackSubmitted: 'beta_feedback_submitted',
  taskCompleted: 'task_completed',
  projectCreated: 'project_created',
  inviteCreated: 'invite_created',
  inviteAccepted: 'invite_accepted',
  serviceHelpStarted: 'service_help_started',
  serviceSafetyScreenCompleted: 'service_safety_screen_completed',
  serviceSafetyStopped: 'service_safety_stopped',
  serviceIntakeCompleted: 'service_intake_completed',
  serviceSharingReviewed: 'service_sharing_reviewed',
  serviceSharingApproved: 'service_sharing_approved',
  serviceSharingRevoked: 'service_sharing_revoked',
  serviceOptionsViewed: 'service_options_viewed',
  serviceOptionSelected: 'service_option_selected',
  serviceBookingApproved: 'service_booking_approved',
  serviceBookingConfirmed: 'service_booking_confirmed',
  serviceBookingFailed: 'service_booking_failed',
  serviceCalendarAdded: 'service_calendar_added',
  serviceCompleted: 'service_completed',
  serviceOutcomeRecorded: 'service_outcome_recorded',
  serviceDisputed: 'service_disputed',
  providerRequestCreated: 'provider_request_created',
  providerRequestSent: 'provider_request_sent',
  providerRequestResponded: 'provider_request_responded',
  providerRequestDeclined: 'provider_request_declined',
  providerOfferCreated: 'provider_offer_created',
  providerSlotExpired: 'provider_slot_expired',
  providerAvailabilityConfirmed: 'provider_availability_confirmed',
  providerPilotSimulationRecorded: 'provider_pilot_simulation_recorded',
  operatorEscalationCreated: 'operator_escalation_created',
  appointmentProviderCancelled: 'appointment_provider_cancelled',
  appointmentHomeownerCancelled: 'appointment_homeowner_cancelled',
  appointmentNoShow: 'appointment_no_show',
  membershipViewed: 'membership_viewed',
  monetizationResponseSubmitted: 'monetization_response_submitted',
  upgradeIntentRecorded: 'upgrade_intent_recorded',
} as const

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]

export type ActivationStage = {
  key: string
  label: string
  description: string
  events: readonly string[]
}

/**
 * A household is activated when it has a home, three real records, and one
 * intelligence interaction. The admin funnel uses these stages in order; the
 * records stage is computed from current home data rather than event volume so
 * retries and deleted rows cannot inflate it.
 */
export const ACTIVATION_STAGES: readonly ActivationStage[] = [
  {
    key: 'signed_up',
    label: 'Signed up',
    description: 'Created an account in the selected period.',
    events: [],
  },
  {
    key: 'home_created',
    label: 'Created home',
    description: 'Created or joined a household home.',
    events: [ANALYTICS_EVENTS.homeCreated, ANALYTICS_EVENTS.inviteAccepted],
  },
  {
    key: 'three_records',
    label: 'Added 3 records',
    description: 'Has at least three real items, files, facts, or care records.',
    events: [],
  },
  {
    key: 'used_intelligence',
    label: 'Used intelligence',
    description: 'Asked a question, accepted a suggestion, or completed care.',
    events: [
      ANALYTICS_EVENTS.questionAsked,
      ANALYTICS_EVENTS.suggestionAccepted,
      ANALYTICS_EVENTS.taskCompleted,
    ],
  },
  {
    key: 'returned',
    label: 'Returned',
    description: 'Recorded meaningful activity on a later calendar day.',
    events: [],
  },
] as const
