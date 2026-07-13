export type CpscRecall = {
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

export type RecallMatch = {
  id: string
  title: string
  date: string | null
  url: string | null
  hazard: string | null
  remedy: string | null
  confidence: 'model' | 'manufacturer'
}

function norm(value: string | null | undefined): string {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function matchCpscRecalls(
  rows: CpscRecall[],
  input: { manufacturer?: string | null; model?: string | null },
): RecallMatch[] {
  const maker = norm(input.manufacturer)
  const model = norm(input.model)
  const usableModel = model.length >= 4 ? model : ''

  return rows.map((row) => {
    const haystack = norm(JSON.stringify(row))
    const manufacturerMatch = Boolean(maker && haystack.includes(maker))
    const modelMatch = Boolean(usableModel && haystack.includes(usableModel))
    return { row, manufacturerMatch, modelMatch, score: (modelMatch ? 2 : 0) + (manufacturerMatch ? 1 : 0) }
  }).filter((match) => {
    if (usableModel && maker) return match.modelMatch && match.manufacturerMatch
    if (usableModel) return match.modelMatch
    return match.manufacturerMatch
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ row, modelMatch }) => ({
      id: String(row.RecallID ?? row.RecallNumber ?? ''),
      title: row.Title ?? 'CPSC recall',
      date: row.RecallDate ?? null,
      url: row.URL ?? null,
      hazard: row.Hazards?.map((hazard) => hazard.Name).filter(Boolean).join('; ') || row.Description || null,
      remedy: row.Remedies?.map((remedy) => remedy.Name).filter(Boolean).join('; ') || null,
      confidence: modelMatch ? 'model' : 'manufacturer',
    }))
}

/** Query the official CPSC recall feed, then apply conservative local matching. */
export async function checkCpscRecalls(input: {
  manufacturer?: string | null
  model?: string | null
}): Promise<RecallMatch[]> {
  if (!input.manufacturer && !input.model) return []

  const query = new URLSearchParams({ format: 'json' })
  // Manufacturer searches expose the product model fields for strict local matching.
  // ProductName is only a fallback because CPSC often stores models in Products[].Model.
  if (input.manufacturer) query.set('Manufacturer', input.manufacturer)
  else if (input.model) query.set('ProductName', input.model)

  const response = await fetch(`https://www.saferproducts.gov/RestWebServices/Recall?${query}`, {
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 86400 },
  })
  if (!response.ok) throw new Error(`CPSC recall service returned ${response.status}`)
  const rows = await response.json() as CpscRecall[]
  return matchCpscRecalls(Array.isArray(rows) ? rows : [], input)
}
