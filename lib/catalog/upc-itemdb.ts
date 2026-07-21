import type { CatalogIdentifier, CatalogProduct, CatalogProvider } from '@/lib/catalog/types'

type UpcItemDbItem = {
  ean?: string | number
  upc?: string | number
  gtin?: string | number
  asin?: string
  title?: string
  description?: string
  brand?: string
  model?: string
  dimension?: string
  weight?: string
  category?: string
  currency?: string
  lowest_recorded_price?: number
  highest_recorded_price?: number
  images?: string[]
}

type UpcItemDbResponse = {
  code?: string
  items?: UpcItemDbItem[]
}

const BASE_URL = 'https://api.upcitemdb.com/prod/trial'

function text(value: unknown, maxLength = 4_000): string | null {
  if (value == null) return null
  const candidate = String(value).trim()
  return candidate ? candidate.slice(0, maxLength) : null
}

function httpUrl(value: unknown): string | null {
  const candidate = text(value, 2_000)
  if (!candidate) return null
  try {
    const url = new URL(candidate)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

function identifiers(values: Array<CatalogIdentifier | null>): CatalogIdentifier[] {
  const seen = new Set<string>()
  return values.filter((value): value is CatalogIdentifier => {
    if (!value?.value) return false
    const key = `${value.kind}:${value.value}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function mapUpcItemDbItem(raw: UpcItemDbItem, requestedBarcode?: string): CatalogProduct | null {
  const title = text(raw.title, 500)
  if (!title) return null

  const ean = text(raw.ean, 32)
  const upc = text(raw.upc, 32)
  const gtin = text(raw.gtin, 32)
  const asin = text(raw.asin, 32)
  const model = text(raw.model, 120)
  const providerProductId = ean ?? upc ?? gtin ?? asin ?? [raw.brand, model, title].filter(Boolean).join(':')
  if (!providerProductId) return null

  const productIdentifiers = identifiers([
    requestedBarcode ? { kind: 'gtin', value: requestedBarcode } : null,
    gtin ? { kind: 'gtin', value: gtin } : null,
    upc ? { kind: 'upc', value: upc } : null,
    ean ? { kind: 'ean', value: ean } : null,
    model ? { kind: 'model', value: model } : null,
    asin ? { kind: 'asin', value: asin } : null,
  ])

  return {
    provider: 'upc_itemdb',
    providerProductId,
    title,
    brand: text(raw.brand, 200),
    manufacturer: text(raw.brand, 200),
    model,
    category: text(raw.category, 500),
    description: text(raw.description),
    imageUrl: Array.isArray(raw.images) ? raw.images.map(httpUrl).find(Boolean) ?? null : null,
    sourceUrl: `https://www.upcitemdb.com/upc/${encodeURIComponent(ean ?? upc ?? gtin ?? requestedBarcode ?? providerProductId)}`,
    identifiers: productIdentifiers,
    attributes: Object.fromEntries(Object.entries({
      dimension: text(raw.dimension, 200),
      weight: text(raw.weight, 120),
      currency: text(raw.currency, 12),
      lowest_recorded_price: typeof raw.lowest_recorded_price === 'number' ? raw.lowest_recorded_price : null,
      highest_recorded_price: typeof raw.highest_recorded_price === 'number' ? raw.highest_recorded_price : null,
    }).filter(([, value]) => value != null)),
  }
}

export class UpcItemDbProvider implements CatalogProvider {
  readonly name = 'upc_itemdb'

  lookupBarcode(barcode: string): Promise<CatalogProduct[]> {
    return this.request('lookup', { upc: barcode }, barcode)
  }

  lookupMpn(input: { manufacturer: string | null; model: string }): Promise<CatalogProduct[]> {
    const model = input.model.trim()
    if (model.length < 3) return Promise.resolve([])
    return this.request('search', {
      s: model,
      ...(input.manufacturer ? { brand: input.manufacturer.trim() } : {}),
    })
  }

  private async request(
    operation: 'lookup' | 'search',
    params: Record<string, string>,
    requestedBarcode?: string,
  ): Promise<CatalogProduct[]> {
    const url = new URL(`${BASE_URL}/${operation}`)
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'GatheredOS/1.0 (https://gatheredos.com)',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(4_500),
    })
    if (response.status === 404) return []
    if (!response.ok) throw new Error(`UPCitemdb returned ${response.status}`)

    const body = await response.json() as UpcItemDbResponse
    if (body.code !== 'OK') return []
    return (body.items ?? [])
      .map((item) => mapUpcItemDbItem(item, requestedBarcode))
      .filter((product): product is CatalogProduct => Boolean(product))
      .slice(0, 10)
  }
}
