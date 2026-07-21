import type { Database } from '@/lib/supabase/database.types'
import type { createAdminClient } from '@/lib/supabase/admin'
import { OpenProductsFactsProvider } from '@/lib/catalog/open-products-facts'
import type { CatalogIdentifierKind, CatalogMatch, CatalogProduct, CatalogProvider } from '@/lib/catalog/types'
import { UpcItemDbProvider } from '@/lib/catalog/upc-itemdb'

type Admin = ReturnType<typeof createAdminClient>
type CatalogRow = Database['public']['Tables']['catalog_products']['Row']

const BARCODE_LENGTHS = new Set([7, 8, 10, 11, 12, 13, 14])

export function normalizeBarcode(value: string | null | undefined): string | null {
  const candidate = value?.trim() ?? ''
  if (!candidate || !/^[\d\s-]+$/.test(candidate)) return null
  const digits = candidate.replace(/\D/g, '')
  return BARCODE_LENGTHS.has(digits.length) ? digits : null
}

function normalizedIdentity(value: string | null | undefined): string {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function normalizedIdentifier(kind: CatalogIdentifierKind, value: string): string {
  if (kind === 'gtin' || kind === 'upc' || kind === 'ean') return normalizeBarcode(value) ?? value.trim()
  return value.trim().toUpperCase()
}

function providers(): CatalogProvider[] {
  return [new OpenProductsFactsProvider(), new UpcItemDbProvider()]
}

function productFromRow(row: CatalogRow, identifiers: CatalogProduct['identifiers']): CatalogProduct {
  const attributes = row.attributes && typeof row.attributes === 'object' && !Array.isArray(row.attributes)
    ? row.attributes as Record<string, unknown>
    : {}
  return {
    provider: row.provider,
    providerProductId: row.provider_product_id,
    title: row.title,
    brand: row.brand,
    manufacturer: row.manufacturer,
    model: row.model,
    category: row.category,
    description: row.description,
    imageUrl: row.image_url,
    sourceUrl: row.source_url,
    identifiers,
    attributes,
  }
}

async function cachedMatch(
  db: Admin,
  kind: CatalogIdentifierKind,
  value: string,
  matchType: CatalogMatch['matchType'],
  confidence: number,
): Promise<CatalogMatch | null> {
  const { data: identifierRow } = await db
    .from('catalog_identifiers')
    .select('catalog_product_id,provider')
    .eq('kind', kind)
    .eq('value', normalizedIdentifier(kind, value))
    .limit(1)
    .maybeSingle()
  if (!identifierRow) return null

  const [{ data: row }, { data: identifierRows }] = await Promise.all([
    db.from('catalog_products').select('*').eq('id', identifierRow.catalog_product_id).maybeSingle(),
    db.from('catalog_identifiers').select('kind,value').eq('catalog_product_id', identifierRow.catalog_product_id),
  ])
  if (!row) return null
  return {
    catalogProductId: row.id,
    provider: row.provider,
    matchType,
    confidence,
    product: productFromRow(row, (identifierRows ?? []) as CatalogProduct['identifiers']),
  }
}

async function persistProduct(db: Admin, product: CatalogProduct): Promise<string | null> {
  const { data: row, error } = await db.from('catalog_products').upsert({
    provider: product.provider,
    provider_product_id: product.providerProductId,
    title: product.title,
    brand: product.brand,
    manufacturer: product.manufacturer,
    model: product.model,
    category: product.category,
    description: product.description,
    image_url: product.imageUrl,
    source_url: product.sourceUrl,
    attributes: product.attributes as never,
    fetched_at: new Date().toISOString(),
  }, { onConflict: 'provider,provider_product_id' }).select('id').single()
  if (error || !row) {
    console.error('[catalog] product cache write failed:', error)
    return null
  }

  for (const identifier of product.identifiers) {
    await db.from('catalog_identifiers').upsert({
      catalog_product_id: row.id,
      provider: product.provider,
      kind: identifier.kind,
      value: normalizedIdentifier(identifier.kind, identifier.value),
    }, { onConflict: 'provider,kind,value' })
  }
  return row.id
}

function exactBarcodeProduct(products: CatalogProduct[], barcode: string): CatalogProduct | null {
  return products.find((product) => product.identifiers.some((id) => id.kind === 'gtin' && normalizeBarcode(id.value) === barcode)) ?? null
}

export function exactMpnProduct(
  products: CatalogProduct[],
  input: { manufacturer: string | null; model: string },
): CatalogProduct | null {
  const wantedModel = normalizedIdentity(input.model)
  const wantedMaker = normalizedIdentity(input.manufacturer)
  if (!wantedModel) return null

  const exact = products.filter((product) => {
    const candidateModels = [product.model, ...product.identifiers.filter((id) => id.kind === 'mpn' || id.kind === 'model').map((id) => id.value)]
    if (!candidateModels.some((value) => normalizedIdentity(value) === wantedModel)) return false
    if (!wantedMaker) return true
    const candidateMaker = normalizedIdentity(product.manufacturer ?? product.brand)
    return Boolean(candidateMaker && (candidateMaker.includes(wantedMaker) || wantedMaker.includes(candidateMaker)))
  })
  return exact.length === 1 ? exact[0] : null
}

export async function resolveCatalogProduct(
  db: Admin,
  input: { barcode?: string | null; manufacturer?: string | null; model?: string | null },
): Promise<CatalogMatch | null> {
  const barcode = normalizeBarcode(input.barcode)
  if (barcode) {
    const cached = await cachedMatch(db, 'gtin', barcode, 'exact_barcode', 0.99)
    if (cached) return cached
    for (const provider of providers()) {
      try {
        const product = exactBarcodeProduct(await provider.lookupBarcode(barcode), barcode)
        if (!product) continue
        const catalogProductId = await persistProduct(db, product)
        if (catalogProductId) return { catalogProductId, provider: provider.name, matchType: 'exact_barcode', confidence: 0.99, product }
      } catch (error) {
        console.error(`[catalog] ${provider.name} barcode lookup failed:`, error)
      }
    }
  }

  const model = input.model?.trim()
  if (!model) return null
  const cached = await cachedMatch(db, 'mpn', model, 'exact_mpn', input.manufacturer ? 0.97 : 0.86)
    ?? await cachedMatch(db, 'model', model, 'exact_mpn', input.manufacturer ? 0.97 : 0.86)
  if (cached) {
    if (!input.manufacturer) return cached
    const wanted = normalizedIdentity(input.manufacturer)
    const maker = normalizedIdentity(cached.product.manufacturer ?? cached.product.brand)
    if (maker && (maker.includes(wanted) || wanted.includes(maker))) return cached
  }

  for (const provider of providers()) {
    try {
      const product = exactMpnProduct(await provider.lookupMpn({ manufacturer: input.manufacturer ?? null, model }), {
        manufacturer: input.manufacturer ?? null,
        model,
      })
      if (!product) continue
      const catalogProductId = await persistProduct(db, product)
      if (catalogProductId) {
        return {
          catalogProductId,
          provider: provider.name,
          matchType: 'exact_mpn',
          confidence: input.manufacturer ? 0.97 : 0.86,
          product,
        }
      }
    } catch (error) {
      console.error(`[catalog] ${provider.name} MPN lookup failed:`, error)
    }
  }
  return null
}

export function homeCategoryForCatalog(product: CatalogProduct): 'appliance' | 'system' | 'fixture' | 'equipment' | 'safety' | null {
  const text = `${product.category ?? ''} ${product.title}`.toLowerCase()
  if (/smoke|carbon monoxide|security|alarm|fire extinguisher/.test(text)) return 'safety'
  if (/refrigerator|dishwasher|washer|dryer|microwave|freezer|oven|range|stove|appliance/.test(text)) return 'appliance'
  if (/faucet|toilet|sink|lighting|light fixture|ceiling fan/.test(text)) return 'fixture'
  if (/furnace|heat pump|air conditioner|water heater|boiler|electrical panel|hvac/.test(text)) return 'system'
  if (/tool|lawn|garden|mower|generator|equipment/.test(text)) return 'equipment'
  return null
}
