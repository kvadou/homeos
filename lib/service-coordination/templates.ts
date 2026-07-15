type InitialRequestFacts = {
  zip: string
  manufacturer: string
  model: string
  itemType: string
  symptom: string
}

export const SERVICE_TEMPLATE_VERSIONS = { initialProviderRequest: 1 } as const

export const SERVICE_MESSAGE_TEMPLATES = {
  initialProviderRequest: { key: 'initial_provider_request', version: 1 },
  homeownerClarification: { key: 'homeowner_clarification', version: 1 },
  optionsReady: { key: 'options_ready', version: 1 },
  bookingRequest: { key: 'booking_request', version: 1 },
  appointmentConfirmation: { key: 'appointment_confirmation', version: 1 },
} as const

export function renderInitialProviderRequest(facts: InitialRequestFacts): string {
  return `GatherRoot is coordinating a non-emergency appliance service request for a homeowner in ${facts.zip || 'the service area'}. Appliance: ${facts.manufacturer || 'manufacturer unknown'} ${facts.model || 'model unknown'}, ${facts.itemType || 'appliance'}. Problem: ${facts.symptom}. Safety screen: no emergency indicators reported. Do you service this model, and can you provide your diagnostic fee, earliest proposed arrival windows, cancellation terms, and any information you need?`
}
