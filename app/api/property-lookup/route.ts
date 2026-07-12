import { getApiUser } from '@/lib/supabase/api-auth'

export const runtime = 'nodejs'

export type PropertyPrefill = {
  yearBuilt: number | null
  sqft: number | null
  beds: number | null
  baths: number | null
}

// RentCast /v1/properties record — only the fields we map (each nullable).
type RentCastProperty = {
  yearBuilt?: number | null
  squareFootage?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
}

/**
 * Public-records property prefill for onboarding. Auth is required (no open
 * proxy) but a home is NOT — this runs before the home row exists. Dark until
 * RENTCAST_API_KEY is set, and every failure path degrades to {property: null}:
 * prefill augments manual entry and must never surface an error or a 5xx.
 */
export async function GET(req: Request) {
  const auth = await getApiUser(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const key = process.env.RENTCAST_API_KEY
  if (!key) return Response.json({ property: null })

  const params = new URL(req.url).searchParams
  // "street, city, state zip", skipping any missing part.
  const address = [
    params.get('street')?.trim(),
    params.get('city')?.trim(),
    [params.get('state')?.trim(), params.get('zip')?.trim()].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ')
  if (!address) return Response.json({ property: null })

  try {
    const res = await fetch(
      `https://api.rentcast.io/v1/properties?address=${encodeURIComponent(address)}`,
      { signal: AbortSignal.timeout(5000), headers: { 'X-Api-Key': key } },
    )
    if (!res.ok) return Response.json({ property: null })
    const data = (await res.json()) as RentCastProperty[]
    const p = Array.isArray(data) ? data[0] : undefined
    if (!p) return Response.json({ property: null })
    return Response.json({
      property: {
        yearBuilt: num(p.yearBuilt),
        sqft: num(p.squareFootage),
        beds: num(p.bedrooms),
        baths: num(p.bathrooms),
      } satisfies PropertyPrefill,
    })
  } catch {
    // Timeout, network error, or bad JSON — degrade silently to no prefill.
    return Response.json({ property: null })
  }
}

// Keep only finite numbers; RentCast omits or nulls fields it doesn't have.
function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}
