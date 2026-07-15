import { getApiContext } from '@/lib/supabase/api-auth'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getApiContext(req)
  if (!ctx) return Response.json({ error: 'Sign in to view repair help.' }, { status: 401 })
  const { id } = await params
  const { data, error } = await ctx.supabase.rpc('get_household_service_case' as never, { p_case_id: id } as never)
  if (error) return Response.json({ error: 'This repair request is not available.' }, { status: 404 })
  return Response.json(data)
}
