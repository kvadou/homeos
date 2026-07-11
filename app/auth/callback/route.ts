import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Handles the email-confirmation / OAuth redirect: trade the code for a session.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Only same-origin relative paths — blocks //evil.com and user@host forms.
  const rawNext = searchParams.get('next') ?? '/'
  const next = /^\/(?!\/)[^@]*$/.test(rawNext) ? rawNext : '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not sign you in`)
}
