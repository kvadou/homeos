import { getApiContext } from '@/lib/supabase/api-auth'
import { ANALYTICS_EVENTS } from '@/lib/analytics-events'
import { PLUS_PRICE_HYPOTHESES } from '@/lib/monetization'

const RESPONSES = new Set(['not_now', 'maybe', 'likely', 'early_access'])
const PERIODS = new Set(['month', 'year'])

export async function POST(req: Request) {
  const ctx = await getApiContext(req)
  if (!ctx) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  let body: { response?: string; billingPeriod?: string }
  try { body = await req.json() } catch { return Response.json({ ok: false, error: 'Invalid request' }, { status: 400 }) }
  if (!body.response || !RESPONSES.has(body.response) || !body.billingPeriod || !PERIODS.has(body.billingPeriod)) {
    return Response.json({ ok: false, error: 'Invalid response' }, { status: 400 })
  }

  const [items, files, facts, careEvents, intelligence] = await Promise.all([
    ctx.supabase.from('items').select('id', { count: 'exact', head: true }).eq('home_id', ctx.home.id),
    ctx.supabase.from('files').select('id', { count: 'exact', head: true }).eq('home_id', ctx.home.id),
    ctx.supabase.from('home_facts').select('id', { count: 'exact', head: true }).eq('home_id', ctx.home.id),
    ctx.supabase.from('care_events').select('id', { count: 'exact', head: true }).eq('home_id', ctx.home.id),
    ctx.supabase.from('usage_events').select('id', { count: 'exact', head: true }).eq('user_id', ctx.user.id).in('event', [ANALYTICS_EVENTS.questionAsked, ANALYTICS_EVENTS.suggestionAccepted, ANALYTICS_EVENTS.taskCompleted]),
  ])
  const records = (items.count ?? 0) + (files.count ?? 0) + (facts.count ?? 0) + (careEvents.count ?? 0)
  const activated = records >= 3 && (intelligence.count ?? 0) > 0
  const period = body.billingPeriod as 'month' | 'year'
  const price = PLUS_PRICE_HYPOTHESES[period]
  const { error } = await ctx.supabase.from('monetization_research_responses' as never).insert({
    user_id: ctx.user.id, home_id: ctx.home.id, prompt_key: 'phase5_plus_v1', plan: 'plus',
    price_cents: price.cents, billing_period: period, response: body.response, activated, surface: 'ios',
  } as never)
  if (error) return Response.json({ ok: false, error: 'Your response could not be saved' }, { status: 500 })
  await ctx.supabase.from('usage_events').insert({
    user_id: ctx.user.id, home_id: ctx.home.id,
    event: body.response === 'early_access' ? ANALYTICS_EVENTS.upgradeIntentRecorded : ANALYTICS_EVENTS.monetizationResponseSubmitted,
    props: { plan: 'plus', billingPeriod: period, priceCents: price.cents, response: body.response, activated, surface: 'ios' } as never,
  })
  return Response.json({ ok: true })
}

