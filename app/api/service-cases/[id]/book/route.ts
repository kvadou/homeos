import { getApiContext } from '@/lib/supabase/api-auth'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getApiContext(req)
  if (!ctx) return Response.json({ error: 'Sign in to request this appointment.' }, { status: 401 })
  const { id } = await params
  let offerId = ''
  try { offerId = String((await req.json()).offerId ?? '') } catch {}
  if (!offerId) return Response.json({ error: 'Choose a provider option.' }, { status: 400 })
  const { data, error } = await ctx.supabase.rpc('authorize_household_service_booking' as never,
    { p_case_id: id, p_offer_id: offerId } as never)
  if (error) {
    console.error('service booking failed', error)
    return Response.json({ error: error.code === '40001' ? 'This request changed. Refresh to see its current status.' : 'This provider option is no longer available.' }, { status: 409 })
  }
  return Response.json(data)
}
