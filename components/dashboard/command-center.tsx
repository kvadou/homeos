'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  CloudRain,
  Droplets,
  FileText,
  House,
  Leaf,
  Lightbulb,
  Loader2,
  Package,
  Paintbrush,
  Paperclip,
  Refrigerator,
  Ruler,
  ShieldCheck,
  Snowflake,
  Sun,
  Wallet,
  Wind,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { HomeIntelligenceProfile } from '@/lib/home-intelligence'
import type { HomeWeather } from '@/lib/weather'
import { completeTask } from '@/lib/actions/care'
import { cn } from '@/lib/utils'

export type AttentionItem = {
  id: string
  kind: 'task' | 'insight' | 'weather'
  icon: string
  title: string
  detail: string
  basis: string
  href: string
  action: string
  tone: 'attention' | 'watch' | 'calm'
  taskId?: string
}

export type CommandData = {
  greetingName: string
  attentionItems: AttentionItem[]
  intelligence: HomeIntelligenceProfile
  health: {
    score: number | null
    label: string
    knownSystems: number
    totalSystems: number
    watchCount: number
  }
  recentChanges: { id: string; icon: string; title: string; detail: string; href: string }[]
  weather: HomeWeather | null
}

const iconRegistry: Record<string, LucideIcon> = {
  CalendarClock,
  CloudRain,
  Droplets,
  FileText,
  House,
  Leaf,
  Lightbulb,
  Package,
  Paintbrush,
  Paperclip,
  Refrigerator,
  Ruler,
  ShieldCheck,
  Snowflake,
  Sun,
  Wallet,
  Wind,
  Wrench,
}

function iconFor(name: string): LucideIcon {
  return iconRegistry[name] ?? Lightbulb
}

const toneStyles: Record<AttentionItem['tone'], { icon: string; surface: string }> = {
  attention: {
    icon: 'bg-wood/25 text-wood-foreground',
    surface: 'bg-wood/[0.08]',
  },
  watch: {
    icon: 'bg-secondary text-secondary-foreground',
    surface: 'bg-secondary/35',
  },
  calm: {
    icon: 'bg-sage/15 text-sage-foreground',
    surface: 'bg-transparent',
  },
}

function IntelligenceProgress({ intelligence }: { intelligence: HomeIntelligenceProfile }) {
  const progress = Math.round((intelligence.verified / intelligence.total) * 100)

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">What GatheredOS understands</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {intelligence.stage} intelligence
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-sage-foreground">
          {intelligence.verified} of {intelligence.total}
        </span>
      </div>

      <div
        role="progressbar"
        aria-label="Verified home intelligence signals"
        aria-valuemin={0}
        aria-valuemax={intelligence.total}
        aria-valuenow={intelligence.verified}
        className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full rounded-full bg-sage" style={{ width: `${progress}%` }} />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-foreground">
        {intelligence.stageDetail}
      </p>
      <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sage-foreground" strokeWidth={2} />
        Available now: {intelligence.newlyAvailable}
      </p>

      {intelligence.nextStep ? (
        <div className="mt-5 border-t border-border/70 pt-5">
          <p className="text-sm font-semibold">The most useful thing to add next</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {intelligence.nextStep.title}. {intelligence.nextStep.detail}
          </p>
          <Link
            href={intelligence.nextStep.href}
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {intelligence.nextStep.action}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      ) : (
        <p className="mt-5 border-t border-border/70 pt-5 text-sm font-medium text-sage-foreground">
          Your core home record is well documented. GatheredOS will keep learning from normal activity.
        </p>
      )}
    </section>
  )
}

function HomeConfidence({ data }: { data: CommandData }) {
  const { health, weather } = data
  const knownLabel = health.totalSystems === 0
    ? 'No systems have a verified condition yet.'
    : `${health.knownSystems} of ${health.totalSystems} recorded systems have a known condition.`

  return (
    <section className="rounded-2xl border border-border/70 bg-secondary/30 p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sage/15 text-sage-foreground">
          <House className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-semibold">Home Confidence</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Based only on verified system records</p>
        </div>
      </div>

      {health.score == null ? (
        <div className="mt-5">
          <p className="font-serif text-2xl leading-tight tracking-tight">Confidence is building</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{knownLabel}</p>
        </div>
      ) : (
        <div className="mt-5">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums text-sage-foreground">{health.score}</span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
          <p className="mt-2 text-base font-medium">{health.label}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {health.watchCount === 0 ? 'No recorded systems currently need attention.' : `${health.watchCount} recorded system${health.watchCount === 1 ? '' : 's'} need attention.`}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{knownLabel}</p>
        </div>
      )}

      {weather && (
        <div className="mt-5 flex items-center gap-3 border-t border-border/70 pt-5">
          <CloudRain className="size-4 shrink-0 text-sage-foreground" aria-hidden />
          <p className="text-sm leading-relaxed">
            <span className="font-medium">{weather.temperature}° and {weather.condition.toLowerCase()}</span>
            <span className="text-muted-foreground"> in {weather.location}</span>
          </p>
        </div>
      )}

      <Link href="/care" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary">
        Review home health
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </section>
  )
}

export function CommandCenter({ data }: { data: CommandData }) {
  const [now, setNow] = useState<Date | null>(null)
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())
  const [busyTask, setBusyTask] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<'sending' | 'sent' | null>(null)

  useEffect(() => setNow(new Date()), [])

  const dateLabel = now
    ? now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : 'Today'
  const hour = now?.getHours() ?? 9
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const visibleItems = data.attentionItems.filter((item) => !item.taskId || !completedTasks.has(item.taskId))

  async function markComplete(taskId: string) {
    setBusyTask(taskId)
    setCompletedTasks((current) => new Set(current).add(taskId))
    const result = await completeTask(taskId)
    if ('error' in result && result.error) {
      setCompletedTasks((current) => {
        const next = new Set(current)
        next.delete(taskId)
        return next
      })
    }
    setBusyTask(null)
  }

  async function rateBriefing(rating: 'helpful' | 'not_helpful') {
    setFeedback('sending')
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, context: 'home_briefing', surface: 'web' }),
    })
    setFeedback(response.ok ? 'sent' : null)
  }

  const attentionLabel = visibleItems.length === 0
    ? 'Nothing needs your attention today.'
    : `${visibleItems.length} thing${visibleItems.length === 1 ? '' : 's'} worth your attention.`

  return (
    <div className="space-y-8 sm:space-y-10 xl:space-y-12">
      <header className="max-w-3xl">
        <p className="text-sm font-medium text-sage-foreground">{dateLabel}</p>
        <h1 className="mt-2 text-balance font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
          {greeting}, {data.greetingName}.
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{attentionLabel}</p>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <section className="overflow-hidden rounded-2xl border border-border/70 bg-card">
          <div className="flex flex-col gap-2 border-b border-border/70 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
            <div>
              <h2 className="text-xl font-semibold">What your home needs now</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Ordered by timing and supported by records for your home.
              </p>
            </div>
            <Link href="/worth-knowing" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary">
              View all intelligence
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          {visibleItems.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <CheckCircle2 className="mx-auto size-8 text-sage-foreground" strokeWidth={1.75} aria-hidden />
              <h3 className="mt-4 font-serif text-2xl tracking-tight">Your recorded home looks settled today.</h3>
              <p className="mx-auto mt-2 max-w-xl text-base leading-relaxed text-muted-foreground">
                GatheredOS will surface something here when weather, maintenance, documents, or home history create a useful next step.
              </p>
            </div>
          ) : (
            <ol className="divide-y divide-border/70">
              {visibleItems.map((item, index) => {
                const Icon = iconFor(item.icon)
                const styles = toneStyles[item.tone]
                const isLead = index === 0
                return (
                  <li key={item.id} className={cn('flex gap-4 px-5 py-5 sm:px-6', isLead && styles.surface)}>
                    <span className={cn('mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl', styles.icon)}>
                      <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 max-w-2xl">
                          <p className="text-base font-semibold leading-snug">{item.title}</p>
                          <p className="mt-1.5 text-base leading-relaxed text-foreground/90">{item.detail}</p>
                          <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-sage-foreground" strokeWidth={2} aria-hidden />
                            {item.basis}
                          </p>
                        </div>
                        {item.taskId ? (
                          <button
                            type="button"
                            disabled={busyTask === item.taskId}
                            onClick={() => void markComplete(item.taskId!)}
                            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60"
                          >
                            {busyTask === item.taskId ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Check className="size-4" aria-hidden />}
                            Mark complete
                          </button>
                        ) : (
                          <Link
                            href={item.href}
                            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                          >
                            {item.action}
                            <ArrowRight className="size-4" aria-hidden />
                          </Link>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}

          <div className="flex min-h-12 flex-wrap items-center justify-end gap-2 border-t border-border/70 bg-secondary/20 px-5 py-3 text-sm text-muted-foreground sm:px-6">
            {feedback === 'sent' ? (
              <span>Thanks. Your feedback helps GatheredOS prioritize better.</span>
            ) : (
              <>
                <span className="mr-1">Was this brief useful?</span>
                <button type="button" disabled={feedback === 'sending'} onClick={() => void rateBriefing('helpful')} className="min-h-11 rounded-xl px-3 font-medium text-foreground hover:bg-accent disabled:opacity-60">Helpful</button>
                <button type="button" disabled={feedback === 'sending'} onClick={() => void rateBriefing('not_helpful')} className="min-h-11 rounded-xl px-3 font-medium text-foreground hover:bg-accent disabled:opacity-60">Needs work</button>
              </>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <IntelligenceProgress intelligence={data.intelligence} />
          <HomeConfidence data={data} />
        </aside>
      </div>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">What changed</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">New records and activity from your home.</p>
          </div>
          <Link href="/library" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary">
            Open home history
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        {data.recentChanges.length === 0 ? (
          <p className="mt-5 border-t border-border/70 py-6 text-base text-muted-foreground">
            Nothing new has been recorded yet. Normal home activity will appear here over time.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-border/70 border-y border-border/70">
            {data.recentChanges.map((change) => {
              const Icon = iconFor(change.icon)
              return (
                <li key={change.id}>
                  <Link href={change.href} className="flex min-h-16 items-center gap-4 py-4 transition-colors hover:text-primary">
                    <Icon className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-medium">{change.title}</span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">{change.detail}</span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
