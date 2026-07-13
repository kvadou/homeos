'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireUser, requireHome } from '@/lib/supabase/home'
import { logUsage } from '@/lib/usage'
import { sendInviteEmail } from '@/lib/notifications'

export type InviteRole = 'family' | 'guest'

export type PendingInvite = {
  id: string
  email: string | null
  role: string
  created_at: string
  expires_at: string
}

type CreateInviteResult = { url: string } | { error: string }
type AcceptInviteResult = { homeName: string } | { error: string }

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gethomeos.vercel.app'

/** Owner mints an invite link for the current home. Returns the shareable URL. */
export async function createInvite(
  email?: string,
  role: InviteRole = 'family',
): Promise<CreateInviteResult> {
  const { supabase, user } = await requireUser()
  const home = await requireHome()

  const { data: membership } = await supabase
    .from('home_members')
    .select('role')
    .eq('home_id', home.id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (membership?.role !== 'owner') return { error: 'Only owners can invite family.' }

  const { data, error } = await supabase
    .from('home_invites')
    .insert({
      home_id: home.id,
      email: email?.trim() || null,
      role,
      invited_by: user.id,
    })
    .select('id, token')
    .single()
  if (error || !data) return { error: error?.message ?? 'Could not create the invite.' }

  await logUsage('invite_created', { role, hasEmail: Boolean(email?.trim()) }, home.id)
  if (email?.trim()) {
    const { data: profile } = await supabase.from('profiles').select('name,email').eq('id', user.id).maybeSingle()
    void sendInviteEmail({
      to: email.trim(),
      homeName: home.name,
      inviterName: profile?.name || profile?.email || 'A family member',
      url: `${SITE_URL}/invite/${data.token}`,
      inviteId: data.id,
    })
  }
  revalidatePath('/settings')
  return { url: `${SITE_URL}/invite/${data.token}` }
}

/** Owner revokes a pending invite. RLS also enforces owner scope. */
export async function revokeInvite(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('home_invites')
    .update({ status: 'revoked' })
    .eq('id', id)
    .eq('status', 'pending')
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true as const }
}

/** Pending invites for the current home (owner reads them via RLS). */
export async function listInvites(): Promise<PendingInvite[]> {
  const { supabase } = await requireUser()
  const home = await requireHome()
  const { data } = await supabase
    .from('home_invites')
    .select('id, email, role, created_at, expires_at')
    .eq('home_id', home.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  return data ?? []
}

/**
 * Accept an invite by token. Runs with the service-role client scoped strictly
 * to the token row (constitution §3.6) — the invitee never reads home_invites
 * through their own session, and owner-write RLS would block self-insert into
 * home_members. Idempotent: re-accepting when already a member just succeeds.
 */
export async function acceptInvite(token: string): Promise<AcceptInviteResult> {
  const { user } = await requireUser()
  const admin = createAdminClient()

  const { data: invite } = await admin
    .from('home_invites')
    .select('id, home_id, role, status, expires_at')
    .eq('token', token)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  if (!invite) return { error: 'This invite has expired or was already used.' }

  const { data: home } = await admin
    .from('homes')
    .select('name')
    .eq('id', invite.home_id)
    .maybeSingle()
  if (!home) return { error: 'This invite is no longer valid.' }

  const { data: existing } = await admin
    .from('home_members')
    .select('user_id')
    .eq('home_id', invite.home_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    const { error: insErr } = await admin
      .from('home_members')
      .insert({ home_id: invite.home_id, user_id: user.id, role: invite.role })
    if (insErr) return { error: 'Could not join this home. Please try again.' }
  }

  await admin
    .from('home_invites')
    .update({ status: 'accepted', accepted_by: user.id })
    .eq('id', invite.id)

  await logUsage('invite_accepted', { role: invite.role }, invite.home_id)
  revalidatePath('/', 'layout')
  return { homeName: home.name }
}
