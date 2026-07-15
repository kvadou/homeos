import { ANALYTICS_EVENTS } from '@/lib/analytics-events'
import { getApiContext } from '@/lib/supabase/api-auth'
import type { Json } from '@/lib/supabase/database.types'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getApiContext(req)
  if (!ctx) return Response.json({ error: 'Sign in to report this problem.' }, { status: 401 })
  const { id } = await params
  let body: { kind?: string; note?: string }
  try { body = await req.json() } catch { return Response.json({ error: 'The report could not be read.' }, { status: 400 }) }
  if (!['provider_cancelled','no_show','dispute'].includes(body.kind ?? '') || (body.note?.trim().length ?? 0) < 3) {
    return Response.json({ error: 'Choose what happened and add a short explanation.' }, { status: 400 })
  }
  const { error } = await ctx.supabase.rpc('report_household_service_exception' as never,
    { p_case_id: id, p_kind: body.kind, p_note: body.note?.trim() } as never)
  if (error) return Response.json({ error: 'This appointment can no longer be changed from here.' }, { status: 409 })
  const event = body.kind === 'dispute' ? ANALYTICS_EVENTS.serviceDisputed
    : body.kind === 'no_show' ? ANALYTICS_EVENTS.appointmentNoShow : ANALYTICS_EVENTS.appointmentProviderCancelled
  await ctx.supabase.from('usage_events').insert({ user_id: ctx.user.id, home_id: ctx.home.id, event,
    props: { caseId: id, surface: 'ios' } as Json })
  return Response.json({ ok: true })
}
