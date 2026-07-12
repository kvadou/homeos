import { createClient as createTokenClient } from '@supabase/supabase-js'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createClient as createCookieClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import type { HomeRow } from '@/lib/supabase/home'

export type ApiContext = {
  supabase: SupabaseClient<Database>
  user: User
  home: HomeRow
}

/**
 * Auth for API routes from either transport: the session cookie (web) or an
 * `Authorization: Bearer <jwt>` header (iOS). Returns null when the caller is
 * unauthenticated or has no home, so the route answers 401. RLS runs as the
 * resolved user for every query made with the returned client — the cookie
 * client via the SSR session, the bearer client via the token on each request.
 */
export async function getApiContext(req: Request): Promise<ApiContext | null> {
  const bearer = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]

  if (bearer) {
    // Stateless token-bound client: the JWT rides on every PostgREST/GoTrue
    // request as the Authorization header, so RLS sees this user. persistSession
    // false keeps supabase-js from swapping that header for a stored session.
    const supabase = createTokenClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${bearer}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    )
    // getUser(jwt) validates the token against GoTrue (signature + expiry).
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(bearer)
    if (error || !user) return null
    return resolveHome(supabase, user)
  }

  const supabase = await createCookieClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  return resolveHome(supabase, user)
}

/** First home by membership (created_at) — same rule as requireHome/getCurrentHome. */
async function resolveHome(
  supabase: SupabaseClient<Database>,
  user: User,
): Promise<ApiContext | null> {
  const { data: home } = await supabase
    .from('homes')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (!home) return null
  return { supabase, user, home }
}
