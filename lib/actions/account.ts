'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { deleteUserData } from '@/lib/account-admin'
import { logUsage } from '@/lib/usage'

/**
 * Delete the current user's account. Confirmation must be the literal string
 * "DELETE" (the UI gates the button on it too). Erases via deleteUserData with
 * the CALLER's own id — never a caller-supplied id — then clears this session
 * and sends them to /signup. logUsage runs first, while the session is still
 * valid, so the analytics row lands before the profile it references is
 * cascade-nulled.
 *
 * This is the ONLY export here: every exported fn in a 'use server' file is a
 * network-callable server action, so the admin-only deleteUserData(userId) lives
 * in lib/account-admin.ts, out of reach of the client.
 */
export async function deleteAccount(confirmation: string) {
  if (confirmation !== 'DELETE') return { error: 'Type DELETE to confirm.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'You are not signed in.' }

  await logUsage('account_deleted')
  await deleteUserData(user.id)

  // The auth user is already gone; local scope just clears this session's cookie
  // (a global revoke would 403 against the deleted user).
  await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
  redirect('/signup')
}
