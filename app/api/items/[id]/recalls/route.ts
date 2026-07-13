import { requireUser, requireHome } from '@/lib/supabase/home'
import { checkCpscRecalls } from '@/lib/recalls'
import { logUsage } from '@/lib/usage'
import { rateLimited } from '@/lib/rate-limit'

export const runtime = 'nodejs'

/** Search the official CPSC feed and return conservative candidates for review. */
export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireUser()
  const home = await requireHome()
  const { id } = await context.params
  const { data: item } = await supabase.from('items')
    .select('id,name,manufacturer,model,serial')
    .eq('id', id).eq('home_id', home.id).maybeSingle()
  if (!item) return Response.json({ error: 'Item not found.' }, { status: 404 })
  if (!item.manufacturer && !item.model) {
    return Response.json({ error: 'Add a manufacturer or model before checking recalls.' }, { status: 400 })
  }

  if (await rateLimited({ event: 'recall_check', userId: user.id, homeId: home.id, limit: 30, windowMinutes: 60 })) {
    return Response.json(
      { success: false, error: 'Rate limit reached. Try again soon.' },
      { status: 429, headers: { 'Retry-After': '3600' } },
    )
  }
  // Log AFTER passing the limit check so a blocked request doesn't extend the window.
  void logUsage('recall_check', {}, home.id)

  let matches
  try {
    matches = await checkCpscRecalls(item)
  } catch {
    return Response.json({ error: 'The CPSC recall service is unavailable.' }, { status: 502 })
  }

  return Response.json({
    checked: { manufacturer: item.manufacturer, model: item.model },
    matches,
  })
}
