export const PLUS_PRICE_HYPOTHESES = {
  year: { cents: 9900, label: '$99/year', equivalent: '$8.25/month' },
  month: { cents: 1200, label: '$12/month', equivalent: null },
} as const

export const PLUS_BENEFITS = [
  'Proactive Home Briefings and lifecycle intelligence',
  'Deeper cited answers and advanced home reports',
  'Household collaboration and handoff workflows',
  'Connected-source imports and future integrations',
  'Concierge provider coordination where available',
] as const

export const FREE_PROMISES = [
  'Your complete home record stays usable',
  'You can always view, edit, delete, and export your data',
  'Basic care, safety information, and grounded answers remain available',
] as const

export type MonetizationResponse = 'not_now' | 'maybe' | 'likely' | 'early_access'
export type BillingPeriod = keyof typeof PLUS_PRICE_HYPOTHESES

