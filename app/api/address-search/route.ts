import { getApiUser } from '@/lib/supabase/api-auth'

export const runtime = 'nodejs'

export type AddressSuggestion = {
  label: string
  street: string
  city: string
  state: string
  zip: string
}

// Photon (keyless OSM geocoder) feature shape — only the fields we read.
type PhotonProps = {
  countrycode?: string
  country?: string
  housenumber?: string
  street?: string
  city?: string
  town?: string
  village?: string
  state?: string
  postcode?: string
}

/**
 * Best-effort US address autocomplete used by onboarding. Auth is required (no
 * open proxy) but a home is NOT — this runs before the home row exists. Any
 * upstream failure/timeout falls back to an empty list; autocomplete augments
 * manual typing and must never surface an error or block the form.
 */
export async function GET(req: Request) {
  const auth = await getApiUser(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const q = new URL(req.url).searchParams.get('q')?.trim() ?? ''
  if (q.length < 3) return Response.json({ suggestions: [] })

  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en`,
      {
        signal: AbortSignal.timeout(4000),
        headers: { 'User-Agent': 'HomeOS/1.0 (gethomeos.vercel.app)' },
      },
    )
    if (!res.ok) return Response.json({ suggestions: [] })
    const data = (await res.json()) as { features?: { properties?: PhotonProps }[] }
    return Response.json({ suggestions: toSuggestions(data.features ?? []) })
  } catch {
    // Timeout, network error, or bad JSON — degrade silently to no suggestions.
    return Response.json({ suggestions: [] })
  }
}

function toSuggestions(features: { properties?: PhotonProps }[]): AddressSuggestion[] {
  const seen = new Set<string>()
  const out: AddressSuggestion[] = []
  for (const f of features) {
    const p = f.properties ?? {}
    if (p.countrycode !== 'US' && p.country !== 'United States') continue
    const street = [p.housenumber, p.street].filter(Boolean).join(' ')
    if (!street) continue
    const city = p.city ?? p.town ?? p.village ?? ''
    const state = p.state ?? ''
    const zip = p.postcode ?? ''
    // "street, city, state zip", skipping any missing part.
    const stateZip = [state, zip].filter(Boolean).join(' ')
    const label = [street, city, stateZip].filter(Boolean).join(', ')
    if (seen.has(label)) continue
    seen.add(label)
    out.push({ label, street, city, state, zip })
    if (out.length >= 5) break
  }
  return out
}
