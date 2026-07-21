import type { CatalogIdentifier, CatalogProduct, CatalogProvider } from '@/lib/catalog/types'

type OpenProductsFactsProduct = {
  code?: string | number
  product_name?: string
  product_name_en?: string
  generic_name?: string
  brands?: string
  categories?: string
  image_front_url?: string
  image_url?: string
  quantity?: string
  model?: string
  mpn?: string
  countries?: string
  labels?: string
}

type OpenProductsFactsResponse = {
  status?: number
  product?: OpenProductsFactsProduct
}

const BASE_URL = 'https://world.openproductsfacts.org/api/v2/product'
const PRODUCT_FIELDS = [
  'code',
  'product_name',
  'product_name_en',
  'generic_name',
  'brands',
  'categories',
  'image_front_url',
  'image_url',
  'quantity',
  'model',
  'mpn',
  'countries',
  'labels',
].join(',')

function text(value: unknown, maxLength = 4_000): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, maxLength) : null
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

export function mapOpenProductsFactsProduct(
  raw: OpenProductsFactsProduct,
  requestedBarcode: string,
): CatalogProduct | null {
  const code = text(raw.code == null ? null : String(raw.code), 32) ?? requestedBarcode
  const title = text(raw.product_name, 500) ?? text(raw.product_name_en, 500) ?? text(raw.generic_name, 500)
  if (!title) return null

  const brand = text(raw.brands, 200)?.split(',')[0]?.trim() || null
  const model = text(raw.model, 120) ?? text(raw.mpn, 120)
  const mpn = text(raw.mpn, 120)
  const productIdentifiers = identifiers([
    { kind: 'gtin', value: requestedBarcode },
    code === requestedBarcode ? null : { kind: 'gtin', value: code },
    model ? { kind: 'model', value: model } : null,
    mpn ? { kind: 'mpn', value: mpn } : null,
  ])

  return {
    provider: 'open_products_facts',
    providerProductId: code,
    title,
    brand,
    manufacturer: brand,
    model,
    category: text(raw.categories, 500),
    description: text(raw.generic_name),
    imageUrl: httpUrl(raw.image_front_url) ?? httpUrl(raw.image_url),
    sourceUrl: `https://world.openproductsfacts.org/product/${encodeURIComponent(code)}`,
    identifiers: productIdentifiers,
    attributes: Object.fromEntries(Object.entries({
      quantity: text(raw.quantity, 120),
      countries: text(raw.countries, 500),
      labels: text(raw.labels, 500),
    }).filter(([, value]) => value != null)),
  }
}

export class OpenProductsFactsProvider implements CatalogProvider {
  readonly name = 'open_products_facts'

  async lookupBarcode(barcode: string): Promise<CatalogProduct[]> {
    const url = new URL(`${BASE_URL}/${encodeURIComponent(barcode)}.json`)
    url.searchParams.set('fields', PRODUCT_FIELDS)

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'GatheredOS/1.0 (https://gatheredos.com)',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(3_500),
    })
    if (response.status === 404) return []
    if (!response.ok) throw new Error(`Open Products Facts returned ${response.status}`)

    const body = await response.json() as OpenProductsFactsResponse
    if (body.status !== 1 || !body.product) return []
    const product = mapOpenProductsFactsProduct(body.product, barcode)
    return product ? [product] : []
  }

  lookupMpn(): Promise<CatalogProduct[]> {
    return Promise.resolve([])
  }
}
