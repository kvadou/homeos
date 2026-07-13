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

/** Lowercase, strip every non-alphanumeric char — for exact + substring compares. */
function norm(value: string | null | undefined): string {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** Whole-word alphanumeric tokens (split on any run of other chars), lowercased. */
function tokens(value: string | null | undefined): string[] {
  return (value ?? '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
}

/**
 * A concrete model number: long enough and mixing letters with digits, so it
 * can't collide with a bare word or a short generic code like "A100". Gate for
 * a model-only match when the item has no manufacturer to corroborate it.
 */
function isDistinctiveModel(model: string): boolean {
  return model.length >= 6 && /[a-z]/.test(model) && /[0-9]/.test(model)
}

/**
 * True when `wantModel` (already normalized) names this product's model as a
 * whole word — an exact token, or the full model field, never a bare substring.
 * "xe50t10" matches Model "XE50T10" or "XE50T10, XE40M06" but NOT "XE50T1045U1".
 */
function modelHit(wantModel: string, productModel: string | null | undefined): boolean {
  if (!wantModel) return false
  if (norm(productModel) === wantModel) return true
  return tokens(productModel).includes(wantModel)
}

/**
 * Conservative structured matcher, shared by the on-demand route and the daily
 * cron. A candidate ALWAYS requires a whole-word model-number hit against CPSC's
 * Products[].Model. On top of that: when the item has a manufacturer, the
 * recall's manufacturer or product name must contain it; when it has none, the
 * model alone must be distinctive enough to stand on its own. This kills the old
 * substring noise — "A100" inside "A1000", or a model merely mentioned in free
 * text — and never fires on a bare model-only match for a generic code. A hit is
 * a lead to verify against the official notice, never a guarantee.
 */
export function matchCpscRecalls(
  rows: CpscRecall[],
  input: { manufacturer?: string | null; model?: string | null },
): RecallMatch[] {
  const wantMaker = norm(input.manufacturer)
  const wantModel = norm(input.model)
  if (!wantModel) return []
  if (!wantMaker && !isDistinctiveModel(wantModel)) return []

  return rows
    .filter((row) => {
      const products = row.Products ?? []
      if (!products.some((product) => modelHit(wantModel, product.Model))) return false
      if (!wantMaker) return true // distinctive model, no manufacturer to corroborate
      const names = [
        ...(row.Manufacturers ?? []).map((maker) => maker.Name),
        ...products.map((product) => product.Name),
      ]
      return names.some((name) => norm(name).includes(wantMaker))
    })
    .slice(0, 5)
    .map((row) => ({
      id: String(row.RecallID ?? row.RecallNumber ?? ''),
      title: row.Title ?? 'CPSC recall',
      date: row.RecallDate ?? null,
      url: row.URL ?? null,
      hazard: row.Hazards?.map((hazard) => hazard.Name).filter(Boolean).join('; ') || row.Description || null,
      remedy: row.Remedies?.map((remedy) => remedy.Name).filter(Boolean).join('; ') || null,
      confidence: 'model' as const,
    }))
}

/** Query the official CPSC recall feed, then apply conservative local matching. */
export async function checkCpscRecalls(input: {
  manufacturer?: string | null
  model?: string | null
}): Promise<RecallMatch[]> {
  // Every match now requires a model-number hit, so a lookup with no model can
  // only return noise — skip the upstream call entirely.
  if (!input.model) return []

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
