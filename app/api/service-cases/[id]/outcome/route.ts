import { ANALYTICS_EVENTS } from '@/lib/analytics-events'
import { getApiContext } from '@/lib/supabase/api-auth'
import type { Json } from '@/lib/supabase/database.types'

type OutcomeBody = {
  resolution?: string; workPerformed?: string; finalCost?: number | null
  partsSummary?: string; laborWarranty?: string; invoiceFileId?: string
  providerTimeliness?: number; providerCommunication?: number; privateFeedback?: string
  occurredOn?: string
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getApiContext(req)
  if (!ctx) return Response.json({ error: 'Sign in to confirm this service visit.' }, { status: 401 })
  const { id } = await params
  let body: OutcomeBody
  try { body = await req.json() } catch { return Response.json({ error: 'The service record could not be read.' }, { status: 400 }) }
  if (!['resolved','partially_resolved','not_resolved'].includes(body.resolution ?? '') || (body.workPerformed?.trim().length ?? 0) < 3) {
    return Response.json({ error: 'Choose an outcome and describe the work performed.' }, { status: 400 })
  }
  const { data, error } = await ctx.supabase.rpc('record_household_service_outcome' as never, {
    p_case_id: id, p_resolution: body.resolution, p_work_performed: body.workPerformed?.trim(),
    p_final_cost: body.finalCost ?? null, p_parts_summary: body.partsSummary?.trim() || null,
    p_labor_warranty: body.laborWarranty?.trim() || null, p_invoice_file_id: body.invoiceFileId || null,
    p_provider_timeliness: body.providerTimeliness ?? null, p_provider_communication: body.providerCommunication ?? null,
    p_private_feedback: body.privateFeedback?.trim() || null, p_occurred_on: body.occurredOn ?? new Date().toISOString().slice(0,10),
  } as never)
  if (error) {
    console.error('service outcome failed', error)
    return Response.json({ error: 'We could not save the confirmed service record.' }, { status: 409 })
  }
  await ctx.supabase.from('usage_events').insert([
    { user_id: ctx.user.id, home_id: ctx.home.id, event: ANALYTICS_EVENTS.serviceCompleted, props: { caseId: id, resolution: body.resolution } as Json },
    { user_id: ctx.user.id, home_id: ctx.home.id, event: ANALYTICS_EVENTS.serviceOutcomeRecorded, props: { caseId: id, hasCost: body.finalCost != null, hasInvoice: Boolean(body.invoiceFileId) } as Json },
  ])
  return Response.json(data)
}
