import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { SettingsPanel } from '@/components/settings/settings-panel'
import { requireUser } from '@/lib/supabase/home'
import { listInvites } from '@/lib/actions/invites'
import { createAdminClient } from '@/lib/supabase/admin'
import { gmailConfigured } from '@/lib/gmail/oauth'

export const metadata: Metadata = {
  title: 'Settings · HomeOS',
  description:
    'Tune your Home Intelligence, manage your homes and family, and control connected sources.',
}

export default async function SettingsPage() {
  const { supabase, user } = await requireUser()

  const { data: home } = await supabase
    .from('homes')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (!home) redirect('/onboarding')

  const [{ data: memberRows }, { data: systems }] = await Promise.all([
    supabase
      .from('home_members')
      .select('user_id, role, created_at')
      .eq('home_id', home.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('items')
      .select('name, manufacturer, installed_on')
      .eq('home_id', home.id)
      .eq('category', 'system')
      .order('created_at', { ascending: true }),
  ])

  // Resolve member profiles in one query (RLS decides what's visible).
  const userIds = (memberRows ?? []).map((m) => m.user_id)
  const { data: profileRows } = userIds.length
    ? await supabase.from('profiles').select('id, name, email').in('id', userIds)
    : { data: [] }
  const profileById = new Map((profileRows ?? []).map((p) => [p.id, p]))

  const members = (memberRows ?? []).map((m) => {
    const p = profileById.get(m.user_id)
    return { userId: m.user_id, role: m.role, name: p?.name ?? null, email: p?.email ?? '' }
  })
  const isOwner = members.find((m) => m.userId === user.id)?.role === 'owner'
  const invites = isOwner ? await listInvites() : []
  const { data: gmailConnection } = await createAdminClient()
    .from('external_connections' as never)
    .select('account_email,status')
    .eq('user_id', user.id)
    .eq('provider', 'gmail')
    .maybeSingle() as { data: { account_email: string | null; status: string } | null }

  return (
    <AppShell showSearch={false}>
      <SettingsPanel
        home={home}
        members={members}
        systems={systems ?? []}
        currentUserId={user.id}
        isOwner={isOwner}
        invites={invites}
        gmail={{ configured: gmailConfigured(), connected: gmailConnection?.status === 'active', email: gmailConnection?.account_email ?? null }}
      />
    </AppShell>
  )
}
