/**
 * Canonical product analytics vocabulary shared by web, iOS API routes, and
 * the internal activation dashboard. Event names are stable data contracts:
 * rename labels in the UI, never historical event keys.
 */
export const ANALYTICS_EVENTS = {
  onboardingStarted: 'onboarding_started',
  homeCreated: 'home_created',
  itemCreated: 'item_created',
  fileUploaded: 'file_uploaded',
  fileIngestRequested: 'file_ingest_requested',
  extractionCompleted: 'extraction_completed',
  questionAsked: 'question_asked',
  suggestionAccepted: 'suggestion_accepted',
  taskCompleted: 'task_completed',
  projectCreated: 'project_created',
  inviteCreated: 'invite_created',
  inviteAccepted: 'invite_accepted',
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
