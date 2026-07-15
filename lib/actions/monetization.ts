'use server'

import { revalidatePath } from 'next/cache'
import { requireUser, requireHome } from '@/lib/supabase/home'
import { ANALYTICS_EVENTS } from '@/lib/analytics-events'
import { PLUS_PRICE_HYPOTHESES, type BillingPeriod, type MonetizationResponse } from '@/lib/monetization'

const RESPONSES = new Set<MonetizationResponse>(['not_now', 'maybe', 'likely', 'early_access'])
const PERIODS = new Set<BillingPeriod>(['month', 'year'])

export async function submitMonetizationResponse(form: FormData) {
  const response = String(form.get('response') ?? '') as MonetizationResponse
  const billingPeriod = String(form.get('billingPeriod') ?? '') as BillingPeriod
  if (!RESPONSES.has(response) || !PERIODS.has(billingPeriod)) {
    return { error: 'That response could not be saved. Please try again.' }
  }

  const [{ supabase, user }, home] = await Promise.all([requireUser(), requireHome()])
  const [items, files, facts, careEvents, intelligence] = await Promise.all([
    supabase.from('items').select('id', { count: 'exact', head: true }).eq('home_id', home.id),
    supabase.from('files').select('id', { count: 'exact', head: true }).eq('home_id', home.id),
    supabase.from('home_facts').select('id', { count: 'exact', head: true }).eq('home_id', home.id),
    supabase.from('care_events').select('id', { count: 'exact', head: true }).eq('home_id', home.id),
    supabase.from('usage_events').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).in('event', [
        ANALYTICS_EVENTS.questionAsked,
        ANALYTICS_EVENTS.suggestionAccepted,
        ANALYTICS_EVENTS.taskCompleted,
      ]),
  ])
  const records = (items.count ?? 0) + (files.count ?? 0) + (facts.count ?? 0) + (careEvents.count ?? 0)
  const activated = records >= 3 && (intelligence.count ?? 0) > 0
  const price = PLUS_PRICE_HYPOTHESES[billingPeriod]

  const { error } = await supabase.from('monetization_research_responses' as never).insert({
    user_id: user.id,
    home_id: home.id,
    prompt_key: 'phase5_plus_v1',
    plan: 'plus',
    price_cents: price.cents,
    billing_period: billingPeriod,
    response,
    activated,
    surface: 'web',
  } as never)
  if (error) return { error: 'Your response could not be saved. Please try again.' }

  await supabase.from('usage_events').insert({
    user_id: user.id,
    home_id: home.id,
    event: response === 'early_access'
      ? ANALYTICS_EVENTS.upgradeIntentRecorded
      : ANALYTICS_EVENTS.monetizationResponseSubmitted,
    props: { plan: 'plus', billingPeriod, priceCents: price.cents, response, activated, surface: 'web' },
  })
  revalidatePath('/membership')
  return { success: true }
}

