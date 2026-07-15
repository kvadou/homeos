'use server'

import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logUsage } from '@/lib/usage'
import { onboardingCascade } from '@/lib/ingest/reason'
import { majorSystems, homeShortName, type OnboardingData } from '@/lib/onboarding'
import { ANALYTICS_EVENTS } from '@/lib/analytics-events'

export async function logOnboardingStep(step: number) {
  if (!Number.isInteger(step) || step < 1 || step > 5) return
  await logUsage(step === 1 ? ANALYTICS_EVENTS.onboardingStarted : ANALYTICS_EVENTS.onboardingStepViewed, { step })
}

/* Onboarding stores everything as strings ("2,450", "1998"). Coerce to the
   numeric columns, treating blanks / unparseable input as null. */
function toInt(v: string): number | null {
  const digits = v.replace(/[^\d]/g, '')
  if (!digits) return null
  const n = parseInt(digits, 10)
  return Number.isFinite(n) ? n : null
}
function toNum(v: string): number | null {
  const cleaned = v.replace(/[^\d.]/g, '')
  if (!cleaned) return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

/**
 * Persist a finished onboarding draft: the home, its selected major systems as
 * items, plus features + goals. The DB trigger adds the creator as owner.
 * Returns { error } on failure so the client can stay on the completion screen.
 */
export async function completeOnboarding(data: OnboardingData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'You are not signed in.' }

  const { home } = data
  const short = homeShortName(home.street)
  const name = short === 'your home' ? 'My Home' : short

  const { data: created, error: homeErr } = await supabase
    .from('homes')
    .insert({
      created_by: user.id,
      name,
      street: home.street || null,
      city: home.city || null,
      state: home.state || null,
      zip: home.zip || null,
      year_built: toInt(home.yearBuilt),
      sqft: toInt(home.sqft),
      beds: toInt(home.beds),
      baths: toNum(home.baths),
      property_type: data.homeType || home.propertyType || null,
      features: data.features,
      goals: data.goals,
    })
    .select('id')
    .single()

  if (homeErr || !created) return { error: homeErr?.message ?? 'Could not create your home.' }
  const homeId = created.id

  // Each selected system becomes an item; carry install year + manufacturer.
  const labelFor = (key: string) => majorSystems.find((m) => m.key === key)?.label ?? key
  const items = data.systems.map((sys) => {
    const year = sys.year?.match(/\d{4}/)?.[0]
    return {
      home_id: homeId,
      name: labelFor(sys.key),
      category: 'system',
      manufacturer: sys.manufacturer || null,
      installed_on: year ? `${year}-01-01` : null,
    }
  })
  if (items.length > 0) {
    const { error: itemsErr } = await supabase.from('items').insert(items).select('id, name, category')
    if (itemsErr) return { error: itemsErr.message }
  }

  // ponytail: knowledge + uploads not persisted — document ingestion is Phase 2.
  // ponytail: member invites not persisted — family sharing ships with invites (needs existing accounts).

  // Depth-2 onboarding batch (§7.12), off the response path: seed care schedules,
  // the year-built timeline marker, and up to 3 starter insights.
  after(() => onboardingCascade(homeId))

  await logUsage('home_created', { systems: items.length, goals: data.goals.length }, homeId)

  return { success: true as const }
}
