'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logUsage } from '@/lib/usage'

export type HomePatch = {
  name?: string
  street?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  year_built?: number | null
  sqft?: number | null
  beds?: number | null
  baths?: number | null
  property_type?: string | null
}

/** Edit the home profile. RLS enforces that the caller is a member. */
export async function updateHome(homeId: string, patch: HomePatch) {
  const supabase = await createClient()
  const { error } = await supabase.from('homes').update(patch).eq('id', homeId)
  if (error) return { error: error.message }
  await logUsage('home_updated', { fields: Object.keys(patch) }, homeId)
  revalidatePath('/settings')
  revalidatePath('/', 'layout')
  return { success: true as const }
}

/** Owner-only: remove another member. RLS also enforces owner. */
export async function removeMember(homeId: string, userId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'You are not signed in.' }
  if (userId === user.id) return { error: 'You cannot remove yourself.' }

  const { data: isOwner } = await supabase.rpc('is_home_owner', { home: homeId })
  if (!isOwner) return { error: 'Only owners can remove members.' }

  const { error } = await supabase
    .from('home_members')
    .delete()
    .eq('home_id', homeId)
    .eq('user_id', userId)
  if (error) return { error: error.message }
  await logUsage('member_removed', { userId }, homeId)
  revalidatePath('/settings')
  return { success: true as const }
}

/** Update the current user's own display name (the only editable profile field). */
export async function updateProfileName(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return { error: 'Name cannot be empty.' }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'You are not signed in.' }
  const { error } = await supabase.from('profiles').update({ name: trimmed }).eq('id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true as const }
}
