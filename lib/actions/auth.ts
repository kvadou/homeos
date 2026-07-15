'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/email'

// Delegate parsing to URL so backslash/protocol-relative bypasses ('/\\x.com',
// '//x.com') can't smuggle a host — only same-origin paths survive.
function safeNext(next?: string): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/'
  try {
    const resolved = new URL(next, 'http://localhost')
    if (resolved.hostname !== 'localhost') return '/'
    return resolved.pathname + resolved.search + resolved.hash
  } catch {
    return '/'
  }
}

export async function signIn(email: string, password: string, next?: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect(safeNext(next))
}

export async function signUp(name: string, email: string, password: string, next?: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })

  if (error) return { error: error.message }

  // Fire-and-forget welcome email (no-op until Resend creds are set). Never
  // block or fail signup on email delivery.
  void sendWelcomeEmail(email, name)

  // No session means email confirmation is on — tell the UI to show that state.
  if (!data.session) return { checkEmail: true }

  revalidatePath('/', 'layout')
  redirect(safeNext(next))
}

export async function requestPasswordReset(email: string) {
  const supabase = await createClient()

  // Trusted origin only — never the request Host header, which is attacker
  // controllable and would poison the reset link.
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gatherroot.vercel.app'

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  // Always report the same outcome regardless of whether the email exists —
  // no account enumeration.
  return { ok: true }
}

export async function updatePassword(password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  redirect('/login')
}
