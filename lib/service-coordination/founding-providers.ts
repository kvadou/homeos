export type FoundingProviderSeed = {
  legalName: string
  displayName: string
  website?: string
  phone: string
  email?: string
  pilotMarket: 'twin_cities'
  services: readonly string[]
  brands: readonly string[]
  zipCodes: readonly string[]
  bookingModes: readonly ('phone' | 'sms' | 'email' | 'booking_link')[]
  bookingUrl?: string
  diagnosticPolicy?: Record<string, unknown>
  cancellationPolicy?: string
  partsLaborWarranty?: string
}

export function validateFoundingProviderSeed(seed: FoundingProviderSeed): string[] {
  const errors: string[] = []
  if (!seed.legalName.trim()) errors.push('legalName is required')
  if (!seed.displayName.trim()) errors.push('displayName is required')
  if (!seed.phone.trim()) errors.push('phone is required')
  if (!seed.services.includes('appliance_repair')) {
    errors.push('services must include appliance_repair')
  }
  if (seed.zipCodes.length === 0) errors.push('at least one service ZIP code is required')
  if (seed.bookingModes.length === 0) errors.push('at least one booking mode is required')
  return errors
}

// Intentionally empty: Milestone A must not fabricate provider businesses or
// qualifications. Add a provider only after direct outreach and verification.
export const FOUNDING_PROVIDER_SEEDS: readonly FoundingProviderSeed[] = []

