import { requireHome } from '@/lib/supabase/home'
import { createClient } from '@/lib/supabase/server'
import { checkCpscRecalls } from '@/lib/recalls'

export const runtime = 'nodejs'

/** Search the official CPSC feed and return conservative candidates for review. */
export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const home = await requireHome()
  const { id } = await context.params
  const supabase = await createClient()
  const { data: item } = await supabase.from('items')
    .select('id,name,manufacturer,model,serial')
    .eq('id', id).eq('home_id', home.id).maybeSingle()
  if (!item) return Response.json({ error: 'Item not found.' }, { status: 404 })
  if (!item.manufacturer && !item.model) {
    return Response.json({ error: 'Add a manufacturer or model before checking recalls.' }, { status: 400 })
  }

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
