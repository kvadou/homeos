import { buildHomeIntelligence } from '../lib/home-intelligence'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`home intelligence test failed: ${message}`)
  console.log(`ok: ${message}`)
}

const empty = buildHomeIntelligence({
  home: { street: null, city: null, state: null, zip: null, year_built: null, sqft: null, property_type: null },
  systems: [],
  files: [],
  careEventCount: 0,
  facts: [],
})

assert(empty.verified === 0, 'does not invent coverage for an empty home')
assert(empty.total === 12, 'uses a defined twelve-signal checklist')
assert(empty.stage === 'Baseline', 'starts at the baseline stage')
assert(empty.nextStep?.href === '/settings', 'asks for the first useful baseline fact')

const connected = buildHomeIntelligence({
  home: { street: '123 Maple St', city: 'Minneapolis', state: 'MN', zip: '55401', year_built: 1998, sqft: 2150, property_type: 'single-family' },
  systems: [
    { manufacturer: 'Carrier', model: '59TP6', installed_on: '2019-05-01' },
    { manufacturer: null, model: null, installed_on: null },
    { manufacturer: null, model: null, installed_on: null },
  ],
  files: [],
  careEventCount: 0,
  facts: [],
})

assert(connected.stage === 'Connected', 'moves to connected after equipment is added')
assert(connected.verified === 8, 'counts only completed baseline and equipment signals')
assert(connected.nextStep?.href.includes('/library/upload'), 'asks for the next capability-building upload')

const learning = buildHomeIntelligence({
  home: { street: '123 Maple St', city: 'Minneapolis', state: 'MN', zip: '55401', year_built: 1998, sqft: 2150, property_type: 'single-family' },
  systems: [
    { manufacturer: 'Carrier', model: '59TP6', installed_on: '2019-05-01' },
    { manufacturer: 'Rheem', model: 'XE50', installed_on: '2020-03-01' },
    { manufacturer: 'GE', model: 'GNE27', installed_on: '2022-08-01' },
  ],
  files: [{ extraction_status: 'done' }],
  careEventCount: 3,
  facts: [{ category: 'emergency', predicate: 'water_shutoff', statement: 'Water shutoff is behind the basement shelf.', source_kind: 'user' }],
})

assert(learning.stage === 'Learning', 'uses recorded home activity as the learning stage')
assert(learning.verified === learning.total, 'recognizes a complete core record')
assert(learning.nextStep === null, 'does not manufacture another checklist item after completion')

console.log('home intelligence tests passed')
