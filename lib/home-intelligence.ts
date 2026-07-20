export type IntelligenceHome = {
  street: string | null
  city: string | null
  state: string | null
  zip: string | null
  year_built: number | null
  sqft: number | null
  property_type: string | null
}

export type IntelligenceSystem = {
  manufacturer: string | null
  model: string | null
  installed_on: string | null
}

export type IntelligenceFile = {
  extraction_status: string
}

export type IntelligenceFact = {
  category: string | null
  predicate: string | null
  statement: string
  source_kind: string
}

export type IntelligenceCheck = {
  id: string
  label: string
  complete: boolean
  capability: string
}

export type IntelligenceNextStep = {
  title: string
  detail: string
  action: string
  href: string
}

export type HomeIntelligenceProfile = {
  verified: number
  total: number
  stage: 'Baseline' | 'Connected' | 'Documented' | 'Learning'
  stageDetail: string
  checks: IntelligenceCheck[]
  nextStep: IntelligenceNextStep | null
  newlyAvailable: string
}

type IntelligenceInput = {
  home: IntelligenceHome
  systems: IntelligenceSystem[]
  files: IntelligenceFile[]
  careEventCount: number
  facts: IntelligenceFact[]
}

const nextSteps: Record<string, IntelligenceNextStep> = {
  address: {
    title: 'Confirm your home address',
    detail: 'This connects local weather and seasonal timing to your home.',
    action: 'Review home details',
    href: '/settings',
  },
  year: {
    title: 'Confirm when the home was built',
    detail: 'Home age improves lifespan and maintenance guidance.',
    action: 'Add year built',
    href: '/settings',
  },
  size: {
    title: 'Add your square footage',
    detail: 'Home size makes cost and project ranges more relevant.',
    action: 'Add home size',
    href: '/settings',
  },
  type: {
    title: 'Confirm the type of home',
    detail: 'GatheredOS can tailor recurring care to the structure you own.',
    action: 'Add home type',
    href: '/settings',
  },
  first_system: {
    title: 'Scan one important home system',
    detail: 'Start with the HVAC or water heater. A label photo is enough.',
    action: 'Scan a system',
    href: '/library/upload?type=photo',
  },
  system_set: {
    title: 'Connect another home system',
    detail: 'A broader equipment record produces a more complete care plan.',
    action: 'Scan another system',
    href: '/library/upload?type=photo',
  },
  identity: {
    title: 'Identify a system model',
    detail: 'A model label enables equipment-specific maintenance and recall checks.',
    action: 'Photograph a model label',
    href: '/library/upload?type=photo',
  },
  age: {
    title: 'Add an installation date',
    detail: 'Equipment age unlocks replacement timing and budget planning.',
    action: 'Add installation evidence',
    href: '/library/upload?type=document',
  },
  first_file: {
    title: 'Drop in one home document',
    detail: 'An inspection, invoice, warranty, or receipt gives GatheredOS durable evidence.',
    action: 'Upload a document',
    href: '/library/upload?type=document',
  },
  understood_file: {
    title: 'Upload a document GatheredOS can read',
    detail: 'A completed extraction can link dates, warranties, costs, and equipment automatically.',
    action: 'Upload a document',
    href: '/library/upload?type=document',
  },
  history: {
    title: 'Record one completed repair or service',
    detail: 'Service history helps GatheredOS notice patterns instead of relying on averages.',
    action: 'Add maintenance history',
    href: '/care',
  },
  continuity: {
    title: 'Document one thing only you know',
    detail: 'Start with a shutoff location or an emergency procedure your household may need.',
    action: 'Add household knowledge',
    href: '/ask?prompt=Remember%20this%20about%20my%20home%3A%20',
  },
}

function hasContinuityFact(facts: IntelligenceFact[]): boolean {
  const pattern = /shutoff|reset|alarm|septic|pool|keypad|code|emergency|procedure|closing/i
  return facts.some((fact) =>
    pattern.test(`${fact.category ?? ''} ${fact.predicate ?? ''} ${fact.statement}`),
  )
}

/**
 * A defined, evidence-based coverage checklist. This is intentionally not an
 * opaque "AI intelligence percentage": every completed signal maps to a
 * concrete capability and every missing signal maps to one useful next step.
 */
export function buildHomeIntelligence(input: IntelligenceInput): HomeIntelligenceProfile {
  const { home, systems, files, careEventCount, facts } = input
  const addressKnown = Boolean(home.street && (home.zip || (home.city && home.state)))
  const identifiedSystems = systems.filter((system) => system.manufacturer || system.model)
  const datedSystems = systems.filter((system) => system.installed_on)
  const extractedFiles = files.filter((file) => file.extraction_status === 'done')

  const checks: IntelligenceCheck[] = [
    { id: 'address', label: 'Home location', complete: addressKnown, capability: 'Local weather and seasonal timing' },
    { id: 'year', label: 'Year built', complete: Boolean(home.year_built), capability: 'Age-based home guidance' },
    { id: 'size', label: 'Square footage', complete: Boolean(home.sqft), capability: 'More relevant cost ranges' },
    { id: 'type', label: 'Home type', complete: Boolean(home.property_type), capability: 'Structure-specific care' },
    { id: 'first_system', label: 'First system connected', complete: systems.length >= 1, capability: 'Equipment care planning' },
    { id: 'system_set', label: 'Core systems connected', complete: systems.length >= 3, capability: 'Broader maintenance coverage' },
    { id: 'identity', label: 'System identity', complete: identifiedSystems.length >= 1, capability: 'Model-specific guidance and recalls' },
    { id: 'age', label: 'System age', complete: datedSystems.length >= 1, capability: 'Replacement and budget timing' },
    { id: 'first_file', label: 'First document saved', complete: files.length >= 1, capability: 'A durable home record' },
    { id: 'understood_file', label: 'Document understood', complete: extractedFiles.length >= 1, capability: 'Linked warranties, dates, and costs' },
    { id: 'history', label: 'Service history', complete: careEventCount >= 1, capability: 'Patterns based on actual upkeep' },
    { id: 'continuity', label: 'Household continuity', complete: hasContinuityFact(facts), capability: 'Knowledge the whole household can use' },
  ]

  const verified = checks.filter((check) => check.complete).length
  const firstMissing = checks.find((check) => !check.complete)
  const stage = careEventCount > 0
    ? 'Learning'
    : extractedFiles.length > 0
      ? 'Documented'
      : systems.length > 0
        ? 'Connected'
        : 'Baseline'

  const hasPropertyBaseline = addressKnown || Boolean(home.year_built || home.sqft || home.property_type)
  const stageDetail: Record<HomeIntelligenceProfile['stage'], string> = {
    Baseline: hasPropertyBaseline
      ? 'GatheredOS is using the property facts you have confirmed to build a useful starting plan.'
      : 'Add a few basic property facts to start local, age-based, and seasonal guidance.',
    Connected: 'GatheredOS is connecting real equipment to maintenance and lifespan guidance.',
    Documented: 'GatheredOS can link facts from your files to the systems and projects they support.',
    Learning: 'GatheredOS is learning from the work, costs, and decisions recorded for your home.',
  }

  const completed = [...checks].reverse().find((check) => check.complete)

  return {
    verified,
    total: checks.length,
    stage,
    stageDetail: stageDetail[stage],
    checks,
    nextStep: firstMissing ? nextSteps[firstMissing.id] : null,
    newlyAvailable: completed?.capability ?? 'A useful home baseline',
  }
}
