export type CatalogIdentifierKind = 'gtin' | 'upc' | 'ean' | 'mpn' | 'model' | 'asin'

export type CatalogIdentifier = {
  kind: CatalogIdentifierKind
  value: string
}

export type CatalogProduct = {
  provider: string
  providerProductId: string
  title: string
  brand: string | null
  manufacturer: string | null
  model: string | null
  category: string | null
  description: string | null
  imageUrl: string | null
  sourceUrl: string | null
  identifiers: CatalogIdentifier[]
  attributes: Record<string, unknown>
}

export type CatalogMatch = {
  catalogProductId: string
  provider: string
  matchType: 'exact_barcode' | 'exact_mpn'
  confidence: number
  product: CatalogProduct
}

export interface CatalogProvider {
  readonly name: string
  lookupBarcode(barcode: string): Promise<CatalogProduct[]>
  lookupMpn(input: { manufacturer: string | null; model: string }): Promise<CatalogProduct[]>
}
