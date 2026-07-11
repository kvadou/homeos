'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signIn(email: string, password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signUp(name: string, email: string, password: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })

  if (error) return { error: error.message }

  // No session means email confirmation is on — tell the UI to show that state.
  if (!data.session) return { checkEmail: true }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function requestPasswordReset(email: string) {
  const supabase = await createClient()

  // Prefer the configured site URL; fall back to the request origin so this is
  // correct on both localhost and the deployed host.
  let origin = process.env.NEXT_PUBLIC_SITE_URL
  if (!origin) {
    const h = await headers()
    const host = h.get('x-forwarded-host') ?? h.get('host')!
    const proto = h.get('x-forwarded-proto') ?? 'http'
    origin = `${proto}://${host}`
  }

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
