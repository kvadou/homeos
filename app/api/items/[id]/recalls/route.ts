import { requireHome } from '@/lib/supabase/home'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

type CpscRecall = {
  RecallID?: number
  RecallNumber?: string
  RecallDate?: string
  Title?: string
  URL?: string
  Description?: string
  Products?: Array<{ Name?: string; Model?: string; Description?: string }>
  Hazards?: Array<{ Name?: string }>
  Remedies?: Array<{ Name?: string }>
  Manufacturers?: Array<{ Name?: string }>
}

function norm(value: string | null | undefined): string {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

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

  const query = new URLSearchParams({ format: 'json' })
  if (item.manufacturer) query.set('Manufacturer', item.manufacturer)
  if (item.model) query.set('ProductName', item.model)
  const res = await fetch(`https://www.saferproducts.gov/RestWebServices/Recall?${query}`, {
    signal: AbortSignal.timeout(8000), next: { revalidate: 86400 },
  })
  if (!res.ok) return Response.json({ error: 'The CPSC recall service is unavailable.' }, { status: 502 })
  const rows = await res.json() as CpscRecall[]
  const maker = norm(item.manufacturer)
  const model = norm(item.model)
  const matches = (Array.isArray(rows) ? rows : []).map((row) => {
    const haystack = norm(JSON.stringify(row))
    const manufacturerMatch = Boolean(maker && haystack.includes(maker))
    const modelMatch = Boolean(model && haystack.includes(model))
    return { row, manufacturerMatch, modelMatch, score: (modelMatch ? 2 : 0) + (manufacturerMatch ? 1 : 0) }
  }).filter((x) => x.score >= (model ? 2 : 1)).sort((a, b) => b.score - a.score).slice(0, 5)

  return Response.json({
    checked: { manufacturer: item.manufacturer, model: item.model },
    matches: matches.map(({ row, modelMatch }) => ({
      id: String(row.RecallID ?? row.RecallNumber ?? ''),
      title: row.Title ?? 'CPSC recall',
      date: row.RecallDate ?? null,
      url: row.URL ?? null,
      hazard: row.Hazards?.map((h) => h.Name).filter(Boolean).join('; ') || row.Description || null,
      remedy: row.Remedies?.map((r) => r.Name).filter(Boolean).join('; ') || null,
      confidence: modelMatch ? 'model' : 'manufacturer',
    })),
  })
}

