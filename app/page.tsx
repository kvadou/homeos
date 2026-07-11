import { requireHome } from '@/lib/supabase/home'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { CommandCenter, type CommandData } from '@/components/dashboard/command-center'
import { overallHealth, toSystem, mapHealth, relativeWhen } from '@/lib/care-data'
import { categoryMeta, fileTypeMeta } from '@/lib/library-data'

/* Icon name (for the client registry) for an item, by its DB category. */
function catIconName(category: string | undefined): string {
  return (category && categoryMeta[category]?.icon) || 'Wrench'
}

/* "3 days" / "Oct 18" / "Someday" — the calm due label the maintenance list uses. */
function dueLabel(due: string | null): string {
  if (!due) return 'Someday'
  const days = Math.ceil((new Date(`${due}T00:00:00`).getTime() - Date.now()) / 86_400_000)
  if (days <= 0) return 'Due now'
  if (days <= 7) return `${days} day${days === 1 ? '' : 's'}`
  return new Date(`${due}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function dueBucket(due: string | null): 'Week' | 'Month' | 'Season' {
  if (!due) return 'Season'
  const days = Math.ceil((new Date(`${due}T00:00:00`).getTime() - Date.now()) / 86_400_000)
  if (days <= 7) return 'Week'
  if (days <= 31) return 'Month'
  return 'Season'
}

const insightIconName: Record<string, string> = {
  hvac: 'Wind',
  warranty: 'ShieldCheck',
  maintenance: 'Wrench',
  cost: 'FileText',
}

const meta = (m: unknown): Record<string, unknown> =>
  m && typeof m === 'object' && !Array.isArray(m) ? (m as Record<string, unknown>) : {}
const metaStr = (v: unknown): string | undefined =>
  typeof v === 'string' && v.length > 0 ? v : undefined

export default async function Page() {
  // New users with no home land in onboarding.
  const home = await requireHome()
  const supabase = await createClient()
  const homeId = home.id

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [
    systemsRes,
    openRes,
    doneRes,
    eventsRes,
    itemsRes,
    filesRes,
    insightsRes,
    projectRes,
    profileRes,
  ] = await Promise.all([
    supabase.from('items').select('*').eq('home_id', homeId).eq('category', 'system').order('created_at', { ascending: true }),
    supabase.from('care_tasks').select('*').eq('home_id', homeId).eq('status', 'open').order('due_on', { ascending: true, nullsFirst: false }),
    supabase.from('care_tasks').select('*').eq('home_id', homeId).eq('status', 'done').order('completed_at', { ascending: false, nullsFirst: false }).limit(5),
    supabase.from('care_events').select('*').eq('home_id', homeId).order('occurred_on', { ascending: false }).limit(6),
    supabase.from('items').select('*').eq('home_id', homeId).order('created_at', { ascending: false }).limit(5),
    supabase.from('files').select('*').eq('home_id', homeId).order('created_at', { ascending: false }).limit(5),
    supabase.from('insights').select('*').eq('home_id', homeId).eq('status', 'active').order('created_at', { ascending: false }),
    supabase.from('projects').select('*, contractor:contractors(name)').eq('home_id', homeId).eq('kind', 'active').order('updated_at', { ascending: false }).limit(1),
    user ? supabase.from('profiles').select('name').eq('id', user.id).maybeSingle() : Promise.resolve({ data: null }),
  ])

  const systemRows = systemsRes.data ?? []
  const openTasks = openRes.data ?? []
  const doneTasks = doneRes.data ?? []
  const events = eventsRes.data ?? []
  const recentItems = itemsRes.data ?? []
  const recentFiles = filesRes.data ?? []
  const insightRows = insightsRes.data ?? []

  /* ----- Health ----- */
  const systems = systemRows.map((it) => toSystem(it))
  const healthScore = overallHealth(systems)
  const healthLabel =
    healthScore >= 90 ? 'Excellent' : healthScore >= 75 ? 'Good' : healthScore >= 60 ? 'Fair' : 'Needs care'
  const healthWeight: Record<string, number> = { excellent: 100, good: 100, watch: 60, plan: 30 }
  const systemsHealthy = systemRows.filter((it) => ['excellent', 'good'].includes(mapHealth(it.status))).length
  const systemsWatch = systemRows.length - systemsHealthy
  // Repurpose the five health bars as the (up to) five real systems, most-recent first.
  const healthAreas = systemRows
    .slice(0, 5)
    .map((it) => ({ label: it.name, value: healthWeight[mapHealth(it.status)] ?? 80 }))

  /* ----- To-dos + This Weekend ----- */
  const todosCount = openTasks.length
  const weekendTasks = openTasks.slice(0, 5).map((t) => ({
    id: t.id,
    title: t.title,
    highlight: t.priority === 'highest',
  }))

  /* ----- Upcoming maintenance (bucketed open tasks) ----- */
  // ponytail: icon by linked item's category; only items in the fetched sets are known, else Wrench.
  const catById = new Map<string, string>()
  for (const it of [...systemRows, ...recentItems]) catById.set(it.id, it.category)
  const maintenance = openTasks.slice(0, 12).map((t) => ({
    id: t.id,
    icon: catIconName(t.item_id ? catById.get(t.item_id) : undefined),
    title: t.title,
    due: dueLabel(t.due_on),
    group: dueBucket(t.due_on),
  }))

  /* ----- Since your last visit (real recent activity, not AI actions) ----- */
  const away = [
    ...events.map((e) => ({
      id: `ev-${e.id}`,
      icon: e.cost != null ? 'Wrench' : 'FileText',
      text: e.title,
      reason: e.note ?? `Logged ${relativeWhen(e.occurred_on)}`,
      href: '/care',
      at: e.occurred_on,
    })),
    ...recentItems.map((it) => ({
      id: `it-${it.id}`,
      icon: catIconName(it.category),
      text: `Added ${it.name}`,
      reason: it.summary?.trim() ? it.summary : 'Saved to your home library',
      href: `/library/item/${it.id}`,
      at: it.created_at,
    })),
    ...recentFiles.map((f) => ({
      id: `fl-${f.id}`,
      icon: 'Paperclip',
      text: `Filed ${f.name}`,
      reason: `${(fileTypeMeta[f.type] ?? fileTypeMeta.document).label} saved to your library`,
      href: '/library',
      at: f.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 3)
    .map(({ at: _at, ...rest }) => rest)

  /* ----- Recent activity ticker ----- */
  const activity = [
    ...events.map((e) => ({
      id: `ev-${e.id}`,
      icon: e.cost != null ? 'Wrench' : 'FileText',
      text: e.note ? `${e.title}. ${e.note}` : e.title,
      time: relativeWhen(e.occurred_on),
      at: e.occurred_on,
    })),
    ...doneTasks.map((t) => ({
      id: `tk-${t.id}`,
      icon: 'CheckCircle2',
      text: `${t.title} completed`,
      time: relativeWhen(t.completed_at ?? t.created_at),
      at: t.completed_at ?? t.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 4)
    .map(({ at: _at, ...rest }) => rest)

  /* ----- Insight spotlight + briefing slots ----- */
  const topInsight = insightRows[0]
  const insight = topInsight
    ? {
        headline: topInsight.headline,
        detail: topInsight.detail ?? '',
        basis: topInsight.basis ?? topInsight.source ?? '',
        stat: topInsight.stat,
        href: '/worth-knowing',
        label: topInsight.action ?? 'Learn more',
      }
    : null

  type Tone = 'sage' | 'wood' | 'navy'
  const briefingItems: { icon: string; text: string; hint: string; tone: Tone }[] = []
  const soonTask = openTasks.find((t) => t.due_on && dueBucket(t.due_on) !== 'Season')
  if (soonTask) {
    briefingItems.push({
      icon: 'CalendarClock',
      text: soonTask.title,
      hint: soonTask.detail?.trim() ? soonTask.detail : `Due ${dueLabel(soonTask.due_on)}`,
      tone: 'wood',
    })
  }
  if (topInsight) {
    briefingItems.push({
      icon: insightIconName[topInsight.category] ?? 'Sparkles',
      text: topInsight.headline,
      hint: topInsight.stat ?? topInsight.detail ?? 'Something worth knowing',
      tone: 'sage',
    })
  }

  /* ----- Active project spotlight ----- */
  const projectRow = projectRes.data?.[0]
  const project = projectRow
    ? {
        name: projectRow.name,
        progress: projectRow.progress ?? 0,
        next: metaStr(meta(projectRow.metadata).nextMilestone) ?? 'Next milestone to be set',
        nextWhen: metaStr(meta(projectRow.metadata).nextWhen) ?? '',
        icon: metaStr(meta(projectRow.metadata).icon) ?? 'Hammer',
      }
    : null

  const greetingName = (profileRes.data?.name ?? '').trim().split(/\s+/)[0] || 'there'

  const data: CommandData = {
    greetingName,
    healthScore,
    healthLabel,
    healthAreas,
    systemsHealthy,
    systemsWatch,
    todosCount,
    weekendTasks,
    away,
    briefingItems,
    maintenance,
    insight,
    project,
    activity,
  }

  return (
    <AppShell>
      <CommandCenter data={data} />
    </AppShell>
  )
}
