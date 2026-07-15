import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { requireUser } from '@/lib/supabase/home'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/lib/supabase/database.types'

export const metadata: Metadata = {
  title: 'Admin · GatherRoot',
  description: 'Internal — GatherRoot operations.',
}

// Founder-only. Direct-URL access, not linked from the sidebar.
export const dynamic = 'force-dynamic'

const DAY = 86_400_000

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

// Pull the first 1-2 meaningful values out of a usage_events.props blob.
function propSummary(props: Json): string | null {
  if (!props || typeof props !== 'object' || Array.isArray(props)) return null
  const p = props as Record<string, unknown>
  const parts: string[] = []
  for (const k of ['category', 'type', 'kind', 'action', 'title', 'fields', 'systems', 'goals']) {
    const v = p[k]
    if (v == null || v === '') continue
    parts.push(`${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
    if (parts.length >= 2) break
  }
  return parts.length ? parts.join(' · ') : null
}

export default async function AdminPage() {
  // 1. Gate on the CALLER's own is_admin via the session client (RLS: own row).
  const { supabase, user } = await requireUser()
  const { data: me } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()
  if (!me?.is_admin) notFound()

  // 2. Only now reach for the service-role client (bypasses RLS).
  const admin = createAdminClient()

  // Last 14 days (local), oldest first.
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const since = new Date(start.getTime() - 13 * DAY)
  const dayBuckets: string[] = []
  for (let i = 13; i >= 0; i--) dayBuckets.push(dayKey(new Date(start.getTime() - i * DAY)))

  const [
    users,
    homes,
    items,
    openTasks,
    questions,
    files,
    recentProfiles,
    recentEvents,
    profiles,
    feed,
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('homes').select('*', { count: 'exact', head: true }),
    admin.from('items').select('*', { count: 'exact', head: true }),
    admin.from('care_tasks').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    admin.from('conversations').select('*', { count: 'exact', head: true }),
    admin.from('files').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('created_at').gte('created_at', since.toISOString()),
    admin.from('usage_events').select('created_at').gte('created_at', since.toISOString()),
    admin
      .from('profiles')
      .select('id, email, name, is_admin, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
    admin
      .from('usage_events')
      .select('id, event, props, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const stats = [
    { label: 'Users', value: users.count ?? 0 },
    { label: 'Homes', value: homes.count ?? 0 },
    { label: 'Items', value: items.count ?? 0 },
    { label: 'Open tasks', value: openTasks.count ?? 0 },
    { label: 'Questions', value: questions.count ?? 0 },
    { label: 'Files', value: files.count ?? 0 },
  ]

  // Per-day chart series.
  const signupByDay = new Map<string, number>()
  for (const r of recentProfiles.data ?? [])
    signupByDay.set(dayKey(new Date(r.created_at)), (signupByDay.get(dayKey(new Date(r.created_at))) ?? 0) + 1)
  const eventByDay = new Map<string, number>()
  for (const r of recentEvents.data ?? [])
    eventByDay.set(dayKey(new Date(r.created_at)), (eventByDay.get(dayKey(new Date(r.created_at))) ?? 0) + 1)
  const chart = dayBuckets.map((key) => ({
    key,
    signups: signupByDay.get(key) ?? 0,
    events: eventByDay.get(key) ?? 0,
  }))

  // Users table enrichment: homes per user + last activity.
  const ids = (profiles.data ?? []).map((p) => p.id)
  const [{ data: memberships }, { data: lastEvents }] = await Promise.all([
    ids.length
      ? admin.from('home_members').select('user_id').in('user_id', ids)
      : Promise.resolve({ data: [] as { user_id: string }[] }),
    ids.length
      ? admin
          .from('usage_events')
          .select('user_id, created_at')
          .in('user_id', ids)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as { user_id: string; created_at: string }[] }),
  ])
  const homesByUser = new Map<string, number>()
  for (const m of memberships ?? []) homesByUser.set(m.user_id, (homesByUser.get(m.user_id) ?? 0) + 1)
  const lastByUser = new Map<string, string>()
  for (const e of lastEvents ?? []) if (e.user_id && !lastByUser.has(e.user_id)) lastByUser.set(e.user_id, e.created_at)

  const userRows = (profiles.data ?? []).map((p) => ({
    id: p.id,
    email: p.email,
    name: p.name,
    isAdmin: p.is_admin,
    createdAt: p.created_at,
    homes: homesByUser.get(p.id) ?? 0,
    lastActivity: lastByUser.get(p.id) ?? null,
  }))

  // Feed: resolve emails for the 20 event authors.
  const feedRows = feed.data ?? []
  const feedUserIds = [...new Set(feedRows.map((f) => f.user_id).filter((v): v is string => !!v))]
  const { data: feedProfiles } = feedUserIds.length
    ? await admin.from('profiles').select('id, email').in('id', feedUserIds)
    : { data: [] as { id: string; email: string }[] }
  const emailById = new Map((feedProfiles ?? []).map((p) => [p.id, p.email]))
  const feedItems = feedRows.map((f) => ({
    id: f.id,
    event: f.event,
    email: f.user_id ? emailById.get(f.user_id) ?? null : null,
    createdAt: f.created_at,
    summary: propSummary(f.props),
  }))

  return (
    <AppShell showSearch={false}>
      <AdminDashboard stats={stats} chart={chart} users={userRows} feed={feedItems} />
    </AppShell>
  )
}
