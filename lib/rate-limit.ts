import { createAdminClient } from '@/lib/supabase/admin'

type RateLimitOpts = {
  event: string
  /** The route's authenticated user — the counter's identity. */
  userId: string
  /** Narrow the count to one home when the route has resolved one; omit pre-home (onboarding). */
  homeId?: string
  limit: number
  windowMinutes: number
}

/**
 * Abuse cap. Returns true when this user has already logged `limit`+ rows of
 * `event` in the trailing `windowMinutes` — the route should answer 429 and skip
 * the model/upstream call. Counts the usage_events the route's own logUsage calls
 * already write, so there is no separate counter store.
 *
 * usage_events is insert-only under RLS (no select policy), so the count runs on
 * the service-role client. Scoping is therefore explicit, not RLS-derived:
 * always .eq('user_id', userId) — the id the route's own auth handed us, never
 * anything from the request body (constitution §3.6, same as lib/ingest/pipeline).
 * Fails open: a count error leaves count null → not limited, so a transient DB
 * hiccup never blocks a legitimate request.
 *
 * ponytail: count-query limiter — one SELECT count per request. Fine at current
 *   volume; if usage_events turns hot, move to a token bucket / Upstash Redis
 *   keyed by user+event and drop this read.
 * ponytail: logUsage is fire-and-forget, so this count trails the true request
 *   rate by up to one in-flight write. Fine for abuse capping, NOT for billing.
 */
export async function rateLimited({
  event,
  userId,
  homeId,
  limit,
  windowMinutes,
}: RateLimitOpts): Promise<boolean> {
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString()
  let q = createAdminClient()
    .from('usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('event', event)
    .eq('user_id', userId)
    .gte('created_at', since)
  if (homeId) q = q.eq('home_id', homeId)
  const { count } = await q
  return (count ?? 0) >= limit
}
