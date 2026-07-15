import { getApiContext } from '@/lib/supabase/api-auth'
import { ANALYTICS_EVENTS } from '@/lib/analytics-events'

const RATINGS = new Set(['helpful', 'not_helpful'])

export async function POST(req: Request) {
  const ctx = await getApiContext(req)
  if (!ctx) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  let body: { rating?: string; context?: string; surface?: string }
  try { body = await req.json() } catch { return Response.json({ success: false, error: 'Invalid JSON' }, { status: 400 }) }
  const rating = body.rating?.trim()
  const context = body.context?.trim().slice(0, 64)
  const surface = body.surface === 'ios' ? 'ios' : 'web'
  if (!rating || !RATINGS.has(rating) || !context) return Response.json({ success: false, error: 'Invalid feedback' }, { status: 400 })
  const { error } = await ctx.supabase.from('usage_events').insert({
    user_id: ctx.user.id, home_id: ctx.home.id,
    event: ANALYTICS_EVENTS.betaFeedbackSubmitted,
    props: { rating, context, surface } as never,
  })
  if (error) return Response.json({ success: false, error: 'Feedback could not be saved' }, { status: 500 })
  return Response.json({ success: true })
}
