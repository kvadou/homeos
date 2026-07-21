import { exactMpnProduct, homeCategoryForCatalog, normalizeBarcode } from '../lib/catalog/resolver'
import { mapOpenProductsFactsProduct } from '../lib/catalog/open-products-facts'
import type { CatalogProduct } from '../lib/catalog/types'
import { mapUpcItemDbItem } from '../lib/catalog/upc-itemdb'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`catalog test failed: ${message}`)
  console.log(`ok: ${message}`)
}

const refrigerator = mapUpcItemDbItem({
  ean: '0084691848080',
  upc: '084691848080',
  model: 'GNE27JYMFS',
  title: 'GE 27 cu. ft. French Door Refrigerator',
  category: 'Home & Garden > Household Appliances > Refrigerators',
  brand: 'GE',
  images: ['https://example.com/refrigerator.jpg'],
}, '084691848080')

const paint = mapOpenProductsFactsProduct({
  code: '012345678905',
  product_name: 'Interior Eggshell Paint',
  brands: 'Example Paint Co.',
  categories: 'Home improvement, Paint',
  quantity: '1 gal',
}, '012345678905')

assert(normalizeBarcode('0846 9184-8080') === '084691848080', 'normalizes a supported retail barcode')
assert(normalizeBarcode('https://example.com/item') === null, 'rejects a QR URL as a retail barcode')
assert(refrigerator?.title === 'GE 27 cu. ft. French Door Refrigerator', 'maps a provider product')
assert(refrigerator?.identifiers.some((id) => id.kind === 'gtin' && id.value === '084691848080'), 'keeps the GTIN identifier')
assert(refrigerator && homeCategoryForCatalog(refrigerator) === 'appliance', 'maps a refrigerator to the appliance taxonomy')
assert(paint?.provider === 'open_products_facts', 'maps an Open Products Facts record')
assert(paint?.attributes.quantity === '1 gal', 'keeps useful open-catalog attributes')

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
  exactMpnProduct(products, { manufacturer: 'GE', model: 'GNE27JYMFS' })?.providerProductId === '0084691848080',
  'requires manufacturer corroboration for an exact MPN match',
)
assert(
  exactMpnProduct([refrigerator!, { ...refrigerator!, providerProductId: 'duplicate' }], { manufacturer: null, model: 'GNE27JYMFS' }) === null,
  'rejects an ambiguous model-only result',
)

console.log('catalog resolver tests passed')
