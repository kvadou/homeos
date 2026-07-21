import { requireHome } from '@/lib/supabase/home'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { CommandCenter, type AttentionItem, type CommandData } from '@/components/dashboard/command-center'
import { ReviewQueue } from '@/components/dashboard/review-queue'
import { overallHealth, toSystem, mapHealth, relativeWhen } from '@/lib/care-data'
import { categoryMeta, fileTypeMeta } from '@/lib/library-data'
import { buildHomeIntelligence } from '@/lib/home-intelligence'
import { getHomeWeather } from '@/lib/weather'

function catIconName(category: string | undefined): string {
  return (category && categoryMeta[category]?.icon) || 'Wrench'
}

function daysUntil(due: string | null): number | null {
  if (!due) return null
  return Math.ceil((new Date(`${due}T00:00:00`).getTime() - Date.now()) / 86_400_000)
}

function dueLabel(due: string | null): string {
  const days = daysUntil(due)
  if (days == null) return 'No date set'
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`
  if (days === 0) return 'Due today'
  if (days <= 7) return `Due in ${days} day${days === 1 ? '' : 's'}`
  return `Due ${new Date(`${due}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

const insightIconName: Record<string, string> = {
  hvac: 'Wind',
  warranty: 'ShieldCheck',
  maintenance: 'Wrench',
  seasonal: 'Leaf',
  cost: 'Wallet',
  spending: 'Wallet',
  energy: 'Sun',
  water: 'Droplets',
}

export default async function Page() {
  const home = await requireHome()
  const supabase = await createClient()
  const homeId = home.id

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [weather, [
    systemsRes,
    openRes,
    eventsRes,
    itemsRes,
    filesRes,
    insightsRes,
    profileRes,
    suggestionsRes,
    factsRes,
  ]] = await Promise.all([getHomeWeather(home), Promise.all([
    supabase.from('items').select('*').eq('home_id', homeId).eq('category', 'system').order('created_at', { ascending: true }),
    supabase.from('care_tasks').select('*').eq('home_id', homeId).eq('status', 'open').order('due_on', { ascending: true, nullsFirst: false }),
    supabase.from('care_events').select('*').eq('home_id', homeId).order('occurred_on', { ascending: false }).limit(8),
    supabase.from('items').select('*').eq('home_id', homeId).order('created_at', { ascending: false }).limit(5),
    supabase.from('files').select('*').eq('home_id', homeId).order('created_at', { ascending: false }).limit(24),
    supabase.from('insights').select('*').eq('home_id', homeId).eq('status', 'active').order('created_at', { ascending: false }),
    user ? supabase.from('profiles').select('name').eq('id', user.id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from('suggestions').select('id, summary, target, confidence, provenance').eq('home_id', homeId).eq('status', 'pending').order('created_at', { ascending: false }).limit(6),
    supabase.from('home_facts').select('category,predicate,statement,source_kind').eq('home_id', homeId).eq('is_current', true),
  ])])

  const systemRows = systemsRes.data ?? []
  const openTasks = openRes.data ?? []
  const events = eventsRes.data ?? []
  const recentItems = itemsRes.data ?? []
  const files = filesRes.data ?? []
  const insightRows = (insightsRes.data ?? []).filter((row) => !row.dedupe_slug?.startsWith('onboarding:'))
  const facts = factsRes.data ?? []

  const intelligence = buildHomeIntelligence({
    home,
    systems: systemRows,
    files,
    careEventCount: events.length,
    facts,
  })

  const systems = systemRows.map((item) => toSystem(item))
  const knownSystems = systemRows.filter((item) => mapHealth(item.status) !== 'unknown')
  const healthCoverage = systemRows.length ? knownSystems.length / systemRows.length : 0
  const healthEligible = knownSystems.length >= 2 && healthCoverage >= 0.75
  const calculatedHealth = overallHealth(systems)
  const healthScore = healthEligible ? calculatedHealth : null
  const systemsWatch = systemRows.filter((item) => ['watch', 'plan'].includes(mapHealth(item.status))).length
  const healthLabel = healthScore == null
    ? 'Confidence is building'
    : healthScore >= 90
      ? 'Your recorded systems look strong'
      : healthScore >= 75
        ? 'Your home looks steady'
        : 'A few systems need attention'

  const taskItems: AttentionItem[] = openTasks.slice(0, 4).map((task) => {
    const days = daysUntil(task.due_on)
    const urgent = task.priority === 'highest' || (days != null && days <= 7)
    return {
      id: `task-${task.id}`,
      kind: 'task',
      icon: 'CalendarClock',
      title: task.title,
      detail: task.detail?.trim() || 'This is part of your recorded maintenance plan.',
      basis: `Maintenance plan · ${dueLabel(task.due_on)}`,
      href: `/care/task/${task.id}`,
      action: 'Open guide',
      tone: urgent ? 'attention' : 'calm',
      taskId: task.id,
    }
  })

  const insightItems: AttentionItem[] = insightRows.slice(0, 4).map((insight) => ({
    id: `insight-${insight.id}`,
    kind: 'insight',
    icon: insightIconName[insight.category.toLowerCase()] ?? 'Lightbulb',
    title: insight.headline,
    detail: insight.detail?.trim() || 'GatheredOS connected this observation to records for your home.',
    basis: insight.basis?.trim() || insight.source,
    href: '/worth-knowing',
    action: insight.action || 'Review the evidence',
    tone: ['warranty', 'cost', 'spending'].includes(insight.category.toLowerCase()) ? 'watch' : 'calm',
  }))

  const weatherItems: AttentionItem[] = []
  if (weather && weather.precipitationChance >= 60) {
    weatherItems.push({
      id: 'weather-rain',
      kind: 'weather',
      icon: 'CloudRain',
      title: `Rain is likely in ${weather.location}`,
      detail: `${weather.precipitationChance}% chance today. Check drainage or exposed outdoor work if either needs attention.`,
      basis: `Local forecast · High ${weather.high}° · Wind ${weather.windMph} mph`,
      href: '/care',
      action: 'Review home care',
      tone: 'watch',
    })
  } else if (weather && (weather.high >= 90 || weather.low <= 32)) {
    const cold = weather.low <= 32
    weatherItems.push({
      id: cold ? 'weather-freeze' : 'weather-heat',
      kind: 'weather',
      icon: cold ? 'Snowflake' : 'Sun',
      title: cold ? `Freezing temperatures are possible in ${weather.location}` : `High heat is expected in ${weather.location}`,
      detail: cold ? `Today’s low is ${weather.low}°. Review exposed plumbing and outdoor water connections.` : `Today’s high is ${weather.high}°. Your cooling system may work harder than usual.`,
      basis: `Local forecast · ${weather.condition}`,
      href: '/care',
      action: 'Review seasonal care',
      tone: 'watch',
    })
  }

  const attentionItems = [...taskItems.filter((item) => item.tone === 'attention'), ...weatherItems, ...insightItems, ...taskItems.filter((item) => item.tone !== 'attention')].slice(0, 8)

  const recentChanges = [
    ...events.map((event) => ({
      id: `event-${event.id}`,
      icon: event.cost != null ? 'Wrench' : 'FileText',
      title: event.title,
      detail: event.note ?? `Recorded ${relativeWhen(event.occurred_on)}`,
      href: '/care',
      at: event.occurred_on,
    })),
    ...recentItems.map((item) => ({
      id: `item-${item.id}`,
      icon: catIconName(item.category),
      title: `Added ${item.name}`,
      detail: item.summary?.trim() || 'Saved to your home library',
      href: `/library/item/${item.id}`,
      at: item.created_at,
    })),
    ...files.slice(0, 5).map((file) => ({
      id: `file-${file.id}`,
      icon: 'Paperclip',
      title: `Filed ${file.name}`,
      detail: `${(fileTypeMeta[file.type] ?? fileTypeMeta.document).label} saved to your library`,
      href: '/library',
      at: file.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 4)
    .map(({ at: _at, ...change }) => change)

  const greetingName = (profileRes.data?.name ?? '').trim().split(/\s+/)[0] || 'there'

  const data: CommandData = {
    greetingName,
    attentionItems,
    intelligence,
    health: {
      score: healthScore,
      label: healthLabel,
      knownSystems: knownSystems.length,
      totalSystems: systemRows.length,
      watchCount: systemsWatch,
    },
    recentChanges,
    weather,
  }

  const suggestions = suggestionsRes.data ?? []

  return (
    <AppShell>
      {suggestions.length > 0 && (
        <div className="mb-8">
          <ReviewQueue suggestions={suggestions} />
        </div>
      )}
      <CommandCenter data={data} />
    </AppShell>
  )
}
