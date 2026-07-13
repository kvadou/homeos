export type ManufacturerSupport = {
  manufacturer: string
  model: string | null
  label: string
  url: string
}

type SupportEntry = { names: string[]; label: string; url: string }

// Official US manufacturer-owned manual/support portals. Exact manuals remain
// model-specific and should be confirmed by the homeowner on the official site.
const portals: SupportEntry[] = [
  { names: ['whirlpool'], label: 'Whirlpool manuals', url: 'https://www.whirlpool.com/services/manuals.html' },
  { names: ['maytag'], label: 'Maytag manuals', url: 'https://www.maytag.com/services/manuals-and-literature.html' },
  { names: ['kitchenaid', 'kitchen aid'], label: 'KitchenAid manuals', url: 'https://www.kitchenaid.com/service-and-support/manuals.html' },
  { names: ['ge', 'ge appliances', 'general electric'], label: 'GE Appliances manuals', url: 'https://www.geappliances.com/ge/service-and-support/literature.htm' },
  { names: ['lg', 'lg electronics'], label: 'LG manuals and documents', url: 'https://www.lg.com/us/support' },
  { names: ['samsung'], label: 'Samsung manuals and software', url: 'https://www.samsung.com/us/support/downloads/' },
  { names: ['bosch'], label: 'Bosch owner manuals', url: 'https://www.bosch-home.com/us/owner-support/owner-manuals' },
  { names: ['frigidaire'], label: 'Frigidaire manuals', url: 'https://owner.frigidaire.com/support/manuals' },
]

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

export function manufacturerSupport(
  manufacturer: string | null | undefined,
  model: string | null | undefined,
): ManufacturerSupport | null {
  if (!manufacturer) return null
  const normalized = normalize(manufacturer)
  const portal = portals.find((entry) => entry.names.some((name) => normalize(name) === normalized))
  if (!portal) return null
  return { manufacturer, model: model || null, label: portal.label, url: portal.url }
}
