import { exactMpnProduct, homeCategoryForCatalog, normalizeBarcode } from '../lib/catalog/resolver'
import { mapBarcodeLookupProduct } from '../lib/catalog/barcode-lookup'
import type { CatalogProduct } from '../lib/catalog/types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`catalog test failed: ${message}`)
  console.log(`ok: ${message}`)
}

const refrigerator = mapBarcodeLookupProduct({
  barcode_number: '084691848080',
  barcode_formats: 'UPC-A 084691848080',
  mpn: 'GNE27JYMFS',
  model: 'GNE27JYMFS',
  title: 'GE 27 cu. ft. French Door Refrigerator',
  category: 'Home & Garden > Household Appliances > Refrigerators',
  manufacturer: 'GE Appliances',
  brand: 'GE',
  images: ['https://example.com/refrigerator.jpg'],
  features: ['Fingerprint resistant stainless steel'],
})

assert(normalizeBarcode('0846 9184-8080') === '084691848080', 'normalizes a supported retail barcode')
assert(normalizeBarcode('https://example.com/item') === null, 'rejects a QR URL as a retail barcode')
assert(refrigerator?.title === 'GE 27 cu. ft. French Door Refrigerator', 'maps a provider product')
assert(refrigerator?.identifiers.some((id) => id.kind === 'gtin' && id.value === '084691848080'), 'keeps the GTIN identifier')
assert(refrigerator && homeCategoryForCatalog(refrigerator) === 'appliance', 'maps a refrigerator to the appliance taxonomy')

const products: CatalogProduct[] = [
  refrigerator!,
  {
    ...refrigerator!,
    providerProductId: 'other',
    manufacturer: 'Another Brand',
    brand: 'Another Brand',
  },
]
assert(
  exactMpnProduct(products, { manufacturer: 'GE Appliances', model: 'GNE27JYMFS' })?.providerProductId === '084691848080',
  'requires manufacturer corroboration for an exact MPN match',
)
assert(
  exactMpnProduct([refrigerator!, { ...refrigerator!, providerProductId: 'duplicate' }], { manufacturer: null, model: 'GNE27JYMFS' }) === null,
  'rejects an ambiguous model-only result',
)

console.log('catalog resolver tests passed')
