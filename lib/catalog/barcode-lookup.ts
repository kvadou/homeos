import type { CatalogIdentifier, CatalogProduct, CatalogProvider } from '@/lib/catalog/types'

type BarcodeLookupProduct = {
  barcode_number?: string | number
  barcode_formats?: string
  mpn?: string
  model?: string
  asin?: string
  title?: string
  category?: string
  manufacturer?: string
  brand?: string
  description?: string
  features?: string[]
  images?: string[]
  energy_efficiency_class?: string
  color?: string
  material?: string
  size?: string
  length?: string
  width?: string
  height?: string
  weight?: string
  release_date?: string
}

type BarcodeLookupResponse = { products?: BarcodeLookupProduct[] }

const BASE_URL = 'https://api.barcodelookup.com/v3/products'

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function identifier(kind: CatalogIdentifier['kind'], value: unknown): CatalogIdentifier | null {
  const normalized = text(value == null ? null : String(value))
  return normalized ? { kind, value: normalized } : null
}

export function mapBarcodeLookupProduct(raw: BarcodeLookupProduct): CatalogProduct | null {
  const barcode = text(raw.barcode_number == null ? null : String(raw.barcode_number))
  const mpn = text(raw.mpn)
  const model = text(raw.model) ?? mpn
  const asin = text(raw.asin)
  const title = text(raw.title)
  if (!title) return null

  const identifiers = [
    identifier('gtin', barcode),
    identifier('mpn', mpn),
    identifier('model', model),
    identifier('asin', asin),
  ].filter((value): value is CatalogIdentifier => Boolean(value))

  const providerProductId = barcode ?? asin ?? mpn ?? [raw.manufacturer, model, title].filter(Boolean).join(':')
  if (!providerProductId) return null

  const attributes = Object.fromEntries(Object.entries({
    barcode_formats: text(raw.barcode_formats),
    features: Array.isArray(raw.features) ? raw.features.filter((feature) => typeof feature === 'string').slice(0, 20) : null,
    energy_efficiency_class: text(raw.energy_efficiency_class),
    color: text(raw.color),
    material: text(raw.material),
    size: text(raw.size),
    length: text(raw.length),
    width: text(raw.width),
    height: text(raw.height),
    weight: text(raw.weight),
    release_date: text(raw.release_date),
  }).filter(([, value]) => value != null))

  return {
    provider: 'barcode_lookup',
    providerProductId,
    title,
    brand: text(raw.brand),
    manufacturer: text(raw.manufacturer),
    model,
    category: text(raw.category),
    description: text(raw.description),
    imageUrl: Array.isArray(raw.images) ? text(raw.images[0]) : null,
    sourceUrl: null,
    identifiers,
    attributes,
  }
}

export class BarcodeLookupProvider implements CatalogProvider {
  readonly name = 'barcode_lookup'

  constructor(private readonly apiKey: string) {}

  lookupBarcode(barcode: string): Promise<CatalogProduct[]> {
    return this.request({ barcode })
  }

  lookupMpn(input: { manufacturer: string | null; model: string }): Promise<CatalogProduct[]> {
    return this.request({
      mpn: input.model,
      ...(input.manufacturer ? { manufacturer: `"${input.manufacturer}"` } : {}),
    })
  }

  private async request(params: Record<string, string>): Promise<CatalogProduct[]> {
    const url = new URL(BASE_URL)
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
    url.searchParams.set('key', this.apiKey)

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(4500),
    })
    if (response.status === 404) return []
    if (!response.ok) throw new Error(`Barcode Lookup returned ${response.status}`)

    const body = await response.json() as BarcodeLookupResponse
    return (body.products ?? [])
      .map(mapBarcodeLookupProduct)
      .filter((product): product is CatalogProduct => Boolean(product))
      .slice(0, 10)
  }
}
