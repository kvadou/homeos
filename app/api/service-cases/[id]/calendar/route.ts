import { getApiContext } from '@/lib/supabase/api-auth'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getApiContext(req)
  if (!ctx) return Response.json({ error: 'Sign in to update this appointment.' }, { status: 401 })
  const { id } = await params
  let identifier = ''
  try { identifier = String((await req.json()).identifier ?? '').trim() } catch {}
  if (!identifier) return Response.json({ error: 'Calendar event identifier is required.' }, { status: 400 })
  const { error } = await ctx.supabase.rpc('record_household_calendar_event' as never,
    { p_case_id: id, p_identifier: identifier } as never)
  if (error) return Response.json({ error: 'Only confirmed appointments can be added to the calendar.' }, { status: 409 })
  return Response.json({ ok: true })
}
