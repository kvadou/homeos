import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

// Server-only helper; must never be imported from a client component; not a
// server action. This lives OUTSIDE any 'use server' file on purpose: an
// exported deleteUserData in a 'use server' module would be a network-callable
// endpoint any client could hit with an arbitrary user id. Callers pass an id
// they have already authorized (deleteAccount passes the session user's own id).

type Admin = ReturnType<typeof createAdminClient>

/**
 * Erase everything the user solely owns, drop their shared memberships, then
 * delete the auth user. Pure admin-client logic — no session, no redirect — so
 * scripts/test-account.ts can call it directly.
 *
 * Order matters (storage → homes → shared-ref cleanup → auth user):
 *
 *  1. Sole-owner homes: remove storage objects FIRST, then the homes row.
 *     Storage objects are NOT FK-linked to the homes row, so deleting the row
 *     can never reach them — do it first or every file orphans in the bucket.
 *     The homes-row delete then cascades every home-scoped table (all carry
 *     home_id ... ON DELETE CASCADE): rooms, items, files, contractors,
 *     projects, care_tasks, care_events, insights, timeline_events,
 *     conversations→messages, home_members, extractions, field_provenance,
 *     warranties, home_facts, suggestions, home_invites. (usage_events.home_id
 *     is ON DELETE SET NULL — analytics rows survive, de-homed.)
 *
 *  2. Shared homes (another owner exists): drop only this user's membership,
 *     then clear the profile refs the SURVIVING home still holds on this user.
 *     homes.created_by and home_invites.invited_by are NOT NULL / ON DELETE
 *     NO ACTION, so they are repointed to a remaining owner; home_invites
 *     .accepted_by and care_tasks.completed_by are nullable, so they are nulled.
 *     Any of these left pointing at the user makes step 3 fail with a
 *     foreign_key_violation (profiles is referenced with NO ACTION here).
 *
 *  3. admin.auth.admin.deleteUser: profiles.id → auth.users(id) ON DELETE
 *     CASCADE removes the profile row with the auth user — only possible once
 *     step 2 has cleared the NO-ACTION refs above.
 */
export async function deleteUserData(userId: string) {
  const admin = createAdminClient()

  const { data: memberships } = await admin
    .from('home_members')
    .select('home_id')
    .eq('user_id', userId)
  const homeIds = [...new Set((memberships ?? []).map((m) => m.home_id))]

  const { data: ownerRows } = homeIds.length
    ? await admin
        .from('home_members')
        .select('home_id, user_id')
        .in('home_id', homeIds)
        .eq('role', 'owner')
    : { data: [] as { home_id: string; user_id: string }[] }

  const ownersByHome = new Map<string, string[]>()
  for (const o of ownerRows ?? []) {
    ownersByHome.set(o.home_id, [...(ownersByHome.get(o.home_id) ?? []), o.user_id])
  }

  for (const homeId of homeIds) {
    const owners = ownersByHome.get(homeId) ?? []
    const soleOwner = owners.length === 1 && owners[0] === userId

    if (soleOwner) {
      await removeHomeStorage(admin, homeId)
      const { error } = await admin.from('homes').delete().eq('id', homeId)
      if (error) throw new Error(`home delete failed for ${homeId}: ${error.message}`)
      continue
    }

    // Shared: leave the home intact, hand our NOT-NULL refs to a remaining owner.
    const heir = owners.find((u) => u !== userId) ?? null
    await admin.from('home_members').delete().eq('home_id', homeId).eq('user_id', userId)
    if (heir) {
      await admin.from('homes').update({ created_by: heir }).eq('id', homeId).eq('created_by', userId)
      await admin.from('home_invites').update({ invited_by: heir }).eq('home_id', homeId).eq('invited_by', userId)
    }
    await admin.from('home_invites').update({ accepted_by: null }).eq('home_id', homeId).eq('accepted_by', userId)
    await admin.from('care_tasks').update({ completed_by: null }).eq('home_id', homeId).eq('completed_by', userId)
  }

  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) throw new Error(`auth user delete failed: ${error.message}`)
}

/**
 * Delete every object under {homeId}/ in the home-files bucket. Paths NEST
 * (iOS uploads to {homeId}/receipts/<uuid>.jpg; web uploads flat) and Supabase
 * list() is one level at a time — folder entries come back with id null — so
 * walk the tree, collect real object paths, and remove in batches. Throws on
 * any list/remove error rather than silently orphaning files.
 */
async function removeHomeStorage(admin: Admin, homeId: string) {
  const bucket = admin.storage.from('home-files')
  const collect = async (prefix: string): Promise<string[]> => {
    const paths: string[] = []
    let offset = 0
    for (;;) {
      const { data, error } = await bucket.list(prefix, { limit: 100, offset })
      if (error) throw new Error(`storage list failed for ${prefix}: ${error.message}`)
      if (!data || data.length === 0) break
      for (const o of data) {
        // folders have id null; recurse into them
        if (o.id === null) paths.push(...(await collect(`${prefix}/${o.name}`)))
        else paths.push(`${prefix}/${o.name}`)
      }
      if (data.length < 100) break
      offset += data.length
    }
    return paths
  }
  const paths = await collect(homeId)
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await bucket.remove(paths.slice(i, i + 100))
    if (error) throw new Error(`storage remove failed for ${homeId}: ${error.message}`)
  }
}
