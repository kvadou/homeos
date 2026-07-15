'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin-auth'
import { ANALYTICS_EVENTS } from '@/lib/analytics-events'
import { transitionServiceCase } from '@/lib/service-coordination/commands'
import { renderInitialProviderRequest, SERVICE_TEMPLATE_VERSIONS } from '@/lib/service-coordination/templates'
import type { Json } from '@/lib/supabase/database.types'

function required(form: FormData, key: string): string {
  const value = String(form.get(key) ?? '').trim()
  if (!value) throw new Error(`${key} is required`)
  return value
}

function optional(form: FormData, key: string): string | null {
  return String(form.get(key) ?? '').trim() || null
}

function numberOrNull(form: FormData, key: string): number | null {
  const value = optional(form, key)
  if (!value) return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${key} must be a positive amount`)
  return parsed
}

async function caseAndAuthorization(caseId: string) {
  const { admin, user } = await requireAdmin()
  const { data: serviceCase } = await admin.from('service_cases').select('*').eq('id', caseId).single()
  if (!serviceCase) throw new Error('Service case not found')
  const { data: authorization } = await admin.from('service_authorizations')
    .select('*').eq('service_case_id', caseId).eq('kind', 'share_request').eq('status', 'active')
    .gt('expires_at', new Date().toISOString()).order('approved_at', { ascending: false }).limit(1).maybeSingle()
  return { admin, user, serviceCase, authorization }
}

export async function assignServiceOperator(form: FormData) {
  const caseId = required(form, 'caseId')
  const { admin, user, serviceCase } = await caseAndAuthorization(caseId)
  const operatorId = optional(form, 'operatorId') ?? user.id
  const { error } = await admin.from('service_cases').update({ assigned_operator_id: operatorId }).eq('id', caseId)
  if (error) throw new Error(error.message)
  await admin.from('service_case_events').insert({
    home_id: serviceCase.home_id, service_case_id: caseId, actor_type: 'operator', actor_id: user.id,
    prior_status: serviceCase.status, next_status: serviceCase.status, reason: 'Operator assigned',
    metadata: { operatorId } as Json,
  })
  revalidatePath(`/admin/service-cases/${caseId}`)
  revalidatePath('/admin/service-cases')
}

export async function createProviderBusiness(form: FormData) {
  const { admin } = await requireAdmin()
  const displayName = required(form, 'displayName')
  const phone = required(form, 'phone')
  const zipCodes = required(form, 'zipCodes').split(',').map((v) => v.trim()).filter(Boolean)
  const { error } = await admin.from('provider_businesses').insert({
    legal_name: optional(form, 'legalName') ?? displayName, display_name: displayName,
    phone, email: optional(form, 'email'), website: optional(form, 'website'), status: 'active',
    services: ['appliance_repair'], brands: String(form.get('brands') ?? '').split(',').map((v) => v.trim()).filter(Boolean),
    service_area: { zipCodes }, booking_modes: [required(form, 'channel')],
    diagnostic_policy: { notes: optional(form, 'diagnosticPolicy') },
    cancellation_policy: optional(form, 'cancellationPolicy'),
    parts_labor_warranty: optional(form, 'partsLaborWarranty'),
  })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/providers')
  revalidatePath('/admin/service-cases')
}

export async function verifyProviderContact(form: FormData) {
  const { admin, user } = await requireAdmin()
  const providerId = required(form, 'providerId')
  const { error } = await admin.from('provider_verifications').upsert({
    provider_id: providerId, kind: 'contact', status: 'verified', value: required(form, 'value'),
    source: 'direct_confirmation', verified_at: new Date().toISOString(), verified_by: user.id,
  }, { onConflict: 'provider_id,kind,value' })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/providers')
  revalidatePath('/admin/service-cases')
}

export async function createProviderRequest(form: FormData) {
  const caseId = required(form, 'caseId')
  const providerId = required(form, 'providerId')
  const channel = required(form, 'channel') as 'phone' | 'sms' | 'email' | 'booking_link'
  const { admin, user, serviceCase, authorization } = await caseAndAuthorization(caseId)
  if (!authorization) throw new Error('Active homeowner sharing approval is required')
  if (!['sharing_approved', 'sourcing', 'awaiting_provider_responses'].includes(serviceCase.status)) {
    throw new Error(`Provider outreach is blocked while case is ${serviceCase.status}`)
  }
  const { data: provider } = await admin.from('provider_businesses').select('id,status').eq('id', providerId).single()
  if (provider?.status !== 'active') throw new Error('Provider must be active')
  const { data: verification } = await admin.from('provider_verifications').select('id')
    .eq('provider_id', providerId).eq('kind', 'contact').eq('status', 'verified').limit(1).maybeSingle()
  if (!verification) throw new Error('Provider contact must be verified before outreach')

  const { error } = await admin.from('provider_requests').insert({
    home_id: serviceCase.home_id, service_case_id: caseId, provider_id: providerId,
    status: 'approved_to_send', channel, request_payload: { authorizationId: authorization.id } as Json,
  })
  if (error) throw new Error(error.message)
  if (serviceCase.status === 'sharing_approved') {
    await transitionServiceCase(admin, { caseId, expectedStatus: 'sharing_approved', nextStatus: 'sourcing',
      actorType: 'operator', actorId: user.id, reason: 'Qualified provider selected for outreach',
      idempotencyKey: `provider-request-created:${providerId}` })
  }
  await admin.from('usage_events').insert({ user_id: user.id, home_id: serviceCase.home_id,
    event: ANALYTICS_EVENTS.providerRequestCreated, props: { caseId, providerId, channel } as Json })
  revalidatePath(`/admin/service-cases/${caseId}`)
  revalidatePath('/admin/service-cases')
}

export async function sendProviderRequest(form: FormData) {
  const requestId = required(form, 'requestId')
  const { admin, user } = await requireAdmin()
  const { data: request } = await admin.from('provider_requests').select('*, service_cases(*)').eq('id', requestId).single()
  if (!request || request.status !== 'approved_to_send') throw new Error('Request is not approved to send')
  const serviceCase = request.service_cases
  if (!serviceCase) throw new Error('Service case not found')
  const { data: authorization } = await admin.from('service_authorizations').select('id').eq('service_case_id', serviceCase.id)
    .eq('kind', 'share_request').eq('status', 'active').gt('expires_at', new Date().toISOString()).limit(1).maybeSingle()
  if (!authorization) throw new Error('Sharing approval expired; do not contact provider')
  const item = serviceCase.item_snapshot as Record<string, unknown>
  const address = serviceCase.service_address_snapshot as Record<string, unknown>
  const body = renderInitialProviderRequest({ zip: String(address.zip ?? ''), manufacturer: String(item.manufacturer ?? ''),
    model: String(item.model ?? ''), itemType: String(item.category ?? 'appliance'), symptom: serviceCase.symptom_summary ?? 'Details available on request' })
  const { data: message, error: messageError } = await admin.from('service_messages').insert({
    home_id: serviceCase.home_id, service_case_id: serviceCase.id, provider_request_id: requestId,
    channel: request.channel!, direction: 'outbound', actor_type: 'operator', actor_id: user.id,
    recipients: [request.provider_id], body, redacted_body: body, template_key: 'initial_provider_request',
    template_version: SERVICE_TEMPLATE_VERSIONS.initialProviderRequest, delivery_status: 'sent',
  }).select('id').single()
  if (messageError) throw new Error(messageError.message)
  const { error } = await admin.from('provider_requests').update({ status: 'sent', sent_by: user.id,
    sent_at: new Date().toISOString(), source_message_id: message.id }).eq('id', requestId)
  if (error) throw new Error(error.message)
  if (serviceCase.status === 'sourcing') {
    await transitionServiceCase(admin, { caseId: serviceCase.id, expectedStatus: 'sourcing', nextStatus: 'awaiting_provider_responses',
      actorType: 'operator', actorId: user.id, reason: 'First provider request sent', idempotencyKey: `provider-request-sent:${requestId}` })
  }
  await admin.from('usage_events').insert({ user_id: user.id, home_id: serviceCase.home_id,
    event: ANALYTICS_EVENTS.providerRequestSent, props: { caseId: serviceCase.id, providerId: request.provider_id, channel: request.channel } as Json })
  revalidatePath(`/admin/service-cases/${serviceCase.id}`)
  revalidatePath('/admin/service-cases')
}

export async function recordProviderOffer(form: FormData) {
  const requestId = required(form, 'requestId')
  const { admin, user } = await requireAdmin()
  const { data: request } = await admin.from('provider_requests').select('*, service_cases(*)').eq('id', requestId).single()
  if (!request || !request.service_cases) throw new Error('Provider request not found')
  if (!['sent', 'viewed', 'responded'].includes(request.status)) throw new Error('Send the request before recording a response')
  const start = optional(form, 'windowStart')
  const end = optional(form, 'windowEnd')
  if ((start && !end) || (!start && end)) throw new Error('Both window start and end are required')
  if (start && end && new Date(end) <= new Date(start)) throw new Error('Window end must be after start')
  const responseText = required(form, 'responseText')
  const confirmed = form.get('confirmed') === 'on'
  const now = new Date().toISOString()
  await admin.from('service_messages').insert({
    home_id: request.home_id, service_case_id: request.service_case_id, provider_request_id: requestId,
    channel: request.channel ?? 'phone', direction: 'inbound', actor_type: 'provider', actor_id: request.provider_id,
    recipients: [user.id], body: responseText, redacted_body: responseText, delivery_status: 'received',
    extracted_facts: { normalizedBy: user.id } as Json,
  })
  const { error: offerError } = await admin.from('service_offers').upsert({
    home_id: request.home_id, service_case_id: request.service_case_id, provider_request_id: requestId,
    status: 'proposed', service_fit: { providerConfirmedTradeFit: form.get('tradeFit') === 'on' } as Json,
    visit_type: required(form, 'visitType') as 'diagnostic' | 'estimate' | 'repair_attempt',
    diagnostic_fee: numberOrNull(form, 'diagnosticFee'), travel_fee: numberOrNull(form, 'travelFee'),
    deposit: numberOrNull(form, 'deposit'), price_notes: optional(form, 'priceNotes'),
    window_start: start ? new Date(start).toISOString() : null, window_end: end ? new Date(end).toISOString() : null,
    availability_source: required(form, 'availabilitySource') as 'provider_statement' | 'booking_link' | 'operator_call' | 'provider_portal' | 'api',
    confirmed_at: confirmed ? now : null, expires_at: confirmed && optional(form, 'expiresAt') ? new Date(required(form, 'expiresAt')).toISOString() : null,
    cancellation_terms: optional(form, 'cancellationTerms'), parts_labor_warranty: optional(form, 'partsLaborWarranty'),
    provider_question: optional(form, 'providerQuestion'),
  }, { onConflict: 'provider_request_id' })
  if (offerError) throw new Error(offerError.message)
  await admin.from('provider_requests').update({ status: 'responded', response_summary: { normalizedAt: now } as Json }).eq('id', requestId)
  await admin.from('usage_events').insert([
    { user_id: user.id, home_id: request.home_id, event: ANALYTICS_EVENTS.providerRequestResponded, props: { caseId: request.service_case_id, providerId: request.provider_id } as Json },
    { user_id: user.id, home_id: request.home_id, event: ANALYTICS_EVENTS.providerOfferCreated, props: { caseId: request.service_case_id, providerId: request.provider_id, confirmed } as Json },
  ])
  revalidatePath(`/admin/service-cases/${request.service_case_id}`)
  revalidatePath('/admin/service-cases')
}

export async function recordProviderDecline(form: FormData) {
  const requestId = required(form, 'requestId')
  const { admin, user } = await requireAdmin()
  const { data: request } = await admin.from('provider_requests').select('*').eq('id', requestId).single()
  if (!request || !['sent', 'viewed'].includes(request.status)) throw new Error('Only a sent request can be declined')
  const reason = required(form, 'declineReason')
  await admin.from('service_messages').insert({
    home_id: request.home_id, service_case_id: request.service_case_id, provider_request_id: request.id,
    channel: request.channel ?? 'phone', direction: 'inbound', actor_type: 'provider', actor_id: request.provider_id,
    recipients: [user.id], body: reason, redacted_body: reason, delivery_status: 'received',
    extracted_facts: { outcome: 'declined' } as Json,
  })
  const { error } = await admin.from('provider_requests').update({ status: 'declined', decline_reason: reason }).eq('id', requestId)
  if (error) throw new Error(error.message)
  await admin.from('usage_events').insert({ user_id: user.id, home_id: request.home_id,
    event: ANALYTICS_EVENTS.providerRequestDeclined, props: { caseId: request.service_case_id, providerId: request.provider_id } as Json })
  revalidatePath(`/admin/service-cases/${request.service_case_id}`)
  revalidatePath('/admin/service-cases')
}

export async function reviewAndPublishOptions(form: FormData) {
  const caseId = required(form, 'caseId')
  const decision = required(form, 'decision') as 'approved' | 'changes_required'
  const { admin, user, serviceCase } = await caseAndAuthorization(caseId)
  const checks = { verifiedProviders: form.get('verifiedProviders') === 'on', comparableTerms: form.get('comparableTerms') === 'on', honestAvailability: form.get('honestAvailability') === 'on', sensitiveDataChecked: form.get('sensitiveDataChecked') === 'on' }
  if (decision === 'approved' && Object.values(checks).some((value) => !value)) throw new Error('Complete every quality check before publishing')
  const { error } = await admin.from('service_quality_reviews').insert({ home_id: serviceCase.home_id,
    service_case_id: caseId, reviewer_id: user.id, decision, checks, notes: optional(form, 'notes') })
  if (error) throw new Error(error.message)
  if (decision === 'approved') {
    const { data: caseOffers } = await admin.from('service_offers').select('provider_request_id').eq('service_case_id', caseId).eq('status', 'proposed')
    if (!caseOffers?.length) throw new Error('At least one provider offer is required')
    const { data: offerRequests } = await admin.from('provider_requests').select('provider_id').in('id', caseOffers.map((offer) => offer.provider_request_id))
    const providerIds = [...new Set((offerRequests ?? []).map((request) => request.provider_id))]
    const { data: verifiedContacts } = await admin.from('provider_verifications').select('provider_id')
      .in('provider_id', providerIds).eq('kind', 'contact').eq('status', 'verified')
    const verifiedIds = new Set((verifiedContacts ?? []).map((row) => row.provider_id))
    if (providerIds.some((providerId) => !verifiedIds.has(providerId))) throw new Error('Every published provider must have a current verified contact')
    await transitionServiceCase(admin, { caseId, expectedStatus: 'awaiting_provider_responses', nextStatus: 'options_ready',
      actorType: 'operator', actorId: user.id, reason: 'Options passed quality review', idempotencyKey: `options-published:${caseId}` })
  }
  revalidatePath(`/admin/service-cases/${caseId}`)
  revalidatePath('/admin/service-cases')
}

export async function confirmServiceAppointment(form: FormData) {
  const caseId = required(form, 'caseId')
  const externalReference = required(form, 'externalReference')
  const { admin, user, serviceCase } = await caseAndAuthorization(caseId)
  if (serviceCase.status !== 'booking_pending') throw new Error('This case is not awaiting confirmation')
  const { data: appointment } = await admin.from('service_appointments').select('*')
    .eq('service_case_id', caseId).eq('status', 'pending').maybeSingle()
  if (!appointment) throw new Error('Pending appointment not found')
  const now = new Date().toISOString()
  const { error } = await admin.from('service_appointments').update({
    status: 'confirmed', external_reference: externalReference, confirmed_at: now, confirmed_by: user.id,
  }).eq('id', appointment.id).eq('status', 'pending')
  if (error) throw new Error(error.message)
  await transitionServiceCase(admin, { caseId, expectedStatus: 'booking_pending', nextStatus: 'confirmed',
    actorType: 'operator', actorId: user.id, reason: 'Provider confirmed the exact appointment',
    metadata: { appointmentId: appointment.id, externalReference },
    idempotencyKey: `appointment-confirmed:${appointment.id}` })
  await admin.from('service_messages').insert({
    home_id: serviceCase.home_id, service_case_id: caseId, channel: 'in_app', direction: 'internal',
    actor_type: 'operator', actor_id: user.id, recipients: [serviceCase.opened_by],
    body: `Provider confirmation recorded. Reference: ${externalReference}`,
    redacted_body: `Provider confirmation recorded. Reference: ${externalReference}`,
    delivery_status: 'received', extracted_facts: { appointmentId: appointment.id, externalReference } as Json,
  })
  revalidatePath(`/admin/service-cases/${caseId}`)
  revalidatePath('/admin/service-cases')
}

export async function archiveCompletedServiceCase(form: FormData) {
  const caseId = required(form, 'caseId')
  const { admin, user, serviceCase } = await caseAndAuthorization(caseId)
  if (serviceCase.status !== 'completed') throw new Error('Only a completed case can be archived')
  const { data: outcome } = await admin.from('service_outcomes').select('id,care_event_id').eq('service_case_id', caseId).maybeSingle()
  if (!outcome?.care_event_id) throw new Error('A homeowner-confirmed care record is required')
  await transitionServiceCase(admin, { caseId, expectedStatus: 'completed', nextStatus: 'recorded',
    actorType: 'operator', actorId: user.id, reason: 'Completion follow-up reviewed and archived',
    metadata: { outcomeId: outcome.id, careEventId: outcome.care_event_id },
    idempotencyKey: `service-recorded:${outcome.id}` })
  revalidatePath(`/admin/service-cases/${caseId}`)
  revalidatePath('/admin/service-cases')
}

export async function createServiceEscalation(form: FormData) {
  const caseId = required(form, 'caseId')
  const { admin, user, serviceCase } = await caseAndAuthorization(caseId)
  const { error } = await admin.from('service_escalations').insert({
    home_id: serviceCase.home_id, service_case_id: caseId,
    kind: required(form, 'kind') as 'safety_review' | 'provider_question' | 'response_overdue' | 'quality_review' | 'booking_overdue' | 'other',
    priority: required(form, 'priority') as 'normal' | 'urgent' | 'immediate', summary: required(form, 'summary'),
    assigned_to: serviceCase.assigned_operator_id ?? user.id, created_by: user.id,
  })
  if (error) throw new Error(error.message)
  await admin.from('usage_events').insert({ user_id: user.id, home_id: serviceCase.home_id,
    event: ANALYTICS_EVENTS.operatorEscalationCreated, props: { caseId, kind: required(form, 'kind'), priority: required(form, 'priority') } as Json })
  revalidatePath(`/admin/service-cases/${caseId}`)
  revalidatePath('/admin/service-cases')
}

export async function resolveServiceEscalation(form: FormData) {
  const escalationId = required(form, 'escalationId')
  const { admin, user } = await requireAdmin()
  const { data: escalation } = await admin.from('service_escalations').select('service_case_id').eq('id', escalationId).single()
  if (!escalation) throw new Error('Escalation not found')
  const { error } = await admin.from('service_escalations').update({ status: 'resolved', resolved_by: user.id,
    resolved_at: new Date().toISOString() }).eq('id', escalationId).eq('status', 'open')
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/service-cases/${escalation.service_case_id}`)
  revalidatePath('/admin/service-cases')
}
