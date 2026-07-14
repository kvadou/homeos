'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  House,
  ArrowUpRight,
  ArrowRight,
  Check,
  Star,
  Sparkles,
  CloudRain,
  Wind,
  Snowflake,
  Fan,
  Trees,
  Droplets,
  ChevronRight,
  CheckCircle2,
  FileText,
  Bell,
  Hammer,
  Circle,
  CalendarDays,
  Sun,
  Leaf,
  Info,
  CalendarClock,
  Paperclip,
  Wrench,
  Refrigerator,
  Palette,
  Home,
  Ruler,
  Package,
  ShieldCheck,
  Layers,
  PartyPopper,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AiBadge } from '@/components/ai-badge'
import type { HomeWeather } from '@/lib/weather'
import { completeTask } from '@/lib/actions/care'

/* ------------------------------- Data shape ------------------------------- */

type Tone = 'sage' | 'wood' | 'navy'

export type CommandData = {
  greetingName: string
  healthScore: number | null
  healthLabel: string
  healthAreas: { label: string; value: number }[]
  systemsHealthy: number
  systemsWatch: number
  systemsUnknown: number
  todosCount: number
  weekendTasks: { id: string; title: string; highlight: boolean }[]
  away: { id: string; icon: string; text: string; reason: string; href: string }[]
  briefingItems: { icon: string; text: string; hint: string; tone: Tone }[]
  maintenance: { id: string; icon: string; title: string; due: string; group: Group }[]
  insight: { headline: string; detail: string; basis: string; stat: string | null; href: string; label: string } | null
  project: { name: string; progress: number; next: string; nextWhen: string; icon: string } | null
  activity: { id: string; icon: string; text: string; time: string }[]
  weather: HomeWeather | null
}

/* Icon components can't cross the server→client boundary. Data arrives with an
   icon NAME; resolve it here (a direct import, not a serialized function). */
const iconRegistry: Record<string, LucideIcon> = {
  FileText, Wrench, Paperclip, Wind, Refrigerator, Palette, Home, Trees, Ruler,
  Package, CheckCircle2, CalendarClock, ShieldCheck, Sparkles, Snowflake,
  Droplets, Sun, Leaf, Hammer, Layers, Bell, Fan,
}
const iconFor = (name: string): LucideIcon => iconRegistry[name] ?? Sparkles

/* ------------------------------- Static shell ------------------------------- */

type Group = 'Week' | 'Month' | 'Season'
const groups: Group[] = ['Week', 'Month', 'Season']

/* Day-aware briefing fallbacks — used only to pad the row when there isn't
   enough real due/insight data to fill three slots. */
type Brief = { icon: LucideIcon; text: string; hint: string; tone: Tone }

const briefingByDay: Record<number, Brief[]> = {
  0: [
    { icon: Sun, text: 'Clear and mild', hint: 'A good day to inspect the deck', tone: 'sage' },
    { icon: Hammer, text: 'A calm weekend', hint: 'Nothing urgent on the calendar', tone: 'navy' },
  ],
  1: [
    { icon: CalendarDays, text: 'Fresh week ahead', hint: 'Your home is in good shape', tone: 'sage' },
    { icon: Leaf, text: 'Seasonal upkeep', hint: 'A few small things to stay ahead of', tone: 'wood' },
  ],
  2: [
    { icon: Leaf, text: 'Midweek check-in', hint: 'Everything looks steady', tone: 'sage' },
    { icon: CheckCircle2, text: 'On track', hint: 'No pressing tasks right now', tone: 'navy' },
  ],
  3: [
    { icon: Sun, text: 'Calm, clear skies', hint: 'No weather concerns today', tone: 'sage' },
    { icon: FileText, text: 'Records up to date', hint: 'Your library is in order', tone: 'navy' },
  ],
  4: [
    { icon: CalendarDays, text: 'Weekend prep', hint: 'A good time to plan ahead', tone: 'wood' },
    { icon: Hammer, text: 'Steady progress', hint: 'Your projects are moving along', tone: 'sage' },
  ],
  5: [
    { icon: CalendarDays, text: 'Weekend ahead', hint: 'A little home care to look forward to', tone: 'wood' },
    { icon: Sun, text: 'Looking good', hint: 'Your home is well cared for', tone: 'sage' },
  ],
  6: [
    { icon: Leaf, text: 'A restful weekend', hint: 'Nothing that can’t wait', tone: 'sage' },
    { icon: CheckCircle2, text: 'All settled', hint: 'You’re ahead of the small stuff', tone: 'navy' },
  ],
}

const briefingBySeason: Record<'winter' | 'spring' | 'summer' | 'fall', Brief> = {
  winter: { icon: Snowflake, text: 'Winter is here', hint: 'Keep an eye on freezing and moisture', tone: 'navy' },
  spring: { icon: Droplets, text: 'Spring is waking up', hint: 'Time to check irrigation and drainage', tone: 'sage' },
  summer: { icon: Sun, text: 'Peak cooling season', hint: 'A fresh AC filter keeps bills down', tone: 'sage' },
  fall: { icon: Leaf, text: 'Fall is settling in', hint: 'Clear the gutters before the first freeze', tone: 'wood' },
}

function seasonFor(month: number): keyof typeof briefingBySeason {
  if (month <= 1 || month === 11) return 'winter'
  if (month <= 4) return 'spring'
  if (month <= 7) return 'summer'
  return 'fall'
}

const briefToneStyles: Record<Tone, string> = {
  sage: 'bg-sage/15 text-sage-foreground',
  wood: 'bg-wood/25 text-wood-foreground',
  navy: 'bg-secondary text-secondary-foreground',
}

/* --------------------------- Tile primitive --------------------------- */

function Tile({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section
      className={cn(
        'flex flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-sm',
        className,
      )}
    >
      {children}
    </section>
  )
}

function TileHead({ title, href, action }: { title: string; href?: string; action?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="-m-3 flex items-center gap-0.5 p-3 text-xs font-medium text-primary transition-opacity hover:opacity-80"
        >
          {action ?? 'View'}
          <ChevronRight className="size-3.5" strokeWidth={2} />
        </Link>
      )}
    </div>
  )
}

/* ------------------------------ Cockpit ------------------------------ */

export function CommandCenter({ data }: { data: CommandData }) {
  const [tasks, setTasks] = useState(() => data.weekendTasks.map((t) => ({ ...t, done: false })))
  const [group, setGroup] = useState<Group>('Week')
  const completed = tasks.filter((t) => t.done).length
  const remaining = tasks.length - completed
  const toggle = (id: string) => {
    const task = tasks.find((item) => item.id === id)
    if (!task || task.done) return
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: true } : t)))
    void completeTask(id).then((result) => {
      if ('error' in result && result.error) setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: false } : t)))
    })
  }
  const filteredMaint = data.maintenance.filter((m) => m.group === group)

  /* Resolve the real weekday after mount so the header is live but the first
     client render matches the server (defaults to Saturday). */
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => setNow(new Date()), [])
  const day = now ? now.getDay() : 6
  const weekday = now ? now.toLocaleDateString('en-US', { weekday: 'long' }) : 'Saturday'
  const dateLabel = now
    ? now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : 'Saturday, July 11'
  const hour = now ? now.getHours() : 9
  const partOfDay = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const month = now ? now.getMonth() : 6
  const season = seasonFor(month)

  /* Briefing: a season-aware headline always leads, then the real due/insight
     slots, padded with calm day fallbacks so the row is always full. */
  const briefing: Brief[] = [
    ...(data.weather ? [{ icon: CloudRain, text: `${data.weather.temperature}° · ${data.weather.condition}`, hint: `${data.weather.location} · High ${data.weather.high}°`, tone: 'navy' as const }] : []),
    ...data.briefingItems.map((b) => ({ ...b, icon: iconFor(b.icon) })),
  ].slice(0, 3)

  const seasonalHeadline: Record<ReturnType<typeof seasonFor>, string> = {
    winter: 'Your winter home overview.',
    spring: 'Your spring home overview.',
    summer: 'Your summer home overview.',
    fall: 'Your fall home overview.',
  }

  const healthKnown = data.healthScore != null
  const allHealthy = healthKnown && data.systemsWatch === 0
  const statusText = !healthKnown ? 'Add system details to calculate home health' : allHealthy
    ? 'All systems normal'
    : `${data.systemsHealthy} system${data.systemsHealthy === 1 ? '' : 's'} healthy · ${data.systemsWatch} to keep an eye on${data.systemsUnknown ? ` · ${data.systemsUnknown} unknown` : ''}`

  return (
    <div className="space-y-4">
      {/* ---------------------- Command bar ---------------------- */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p
            className={cn(
              'flex items-center gap-2 text-sm font-medium',
              allHealthy ? 'text-sage-foreground' : 'text-wood-foreground',
            )}
          >
            <span className="relative flex size-2">
              {allHealthy && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-sage opacity-60" />
              )}
              <span
                className={cn(
                  'relative inline-flex size-2 rounded-full',
                  allHealthy ? 'bg-sage' : 'bg-wood-foreground',
                )}
              />
            </span>
            {statusText}
          </p>
          <h1 className="mt-1.5 text-balance font-serif text-2xl leading-tight tracking-tight">
            {seasonalHeadline[season]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {dateLabel} · {partOfDay}, {data.greetingName}
          </p>
        </div>

        {/* Live status pills */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-secondary/40 px-3.5 py-2.5">
            <House className="size-4 text-sage-foreground" strokeWidth={2} />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Health</p>
              <p className="font-serif text-base leading-none tabular-nums">{data.healthScore ?? '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-secondary/40 px-3.5 py-2.5">
            <CloudRain className="size-4 text-sage-foreground" strokeWidth={2} />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {weekday.slice(0, 3)}
              </p>
              <p className="text-base font-semibold leading-none tabular-nums">{data.weather ? `${data.weather.temperature}°` : '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-wood/30 bg-wood/[0.1] px-3.5 py-2.5">
            <Star className="size-4 fill-current text-wood-foreground" strokeWidth={2} />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">To-dos</p>
              <p className="text-base font-semibold leading-none tabular-nums text-wood-foreground">
                {data.todosCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------- Since your last visit ------------------- */}
      <div className="rounded-2xl border border-sage/25 bg-sage/[0.06] p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-sage/20 text-sage-foreground">
            <Sparkles className="size-4" strokeWidth={2} />
          </span>
          <h2 className="text-sm font-semibold">Here&apos;s what&apos;s new since your last visit</h2>
        </div>
        {data.away.length === 0 ? (
          <p className="mt-4 rounded-xl border border-border/60 bg-card p-4 text-sm text-muted-foreground">
            No new activity has been recorded since your last visit.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2.5">
            {data.away.map(({ id, icon, text, reason, href }) => {
              const Icon = iconFor(icon)
              return (
                <li
                  key={id}
                  className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-3.5 sm:flex-row sm:items-center"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sage/12 text-sage-foreground">
                    <Icon className="size-4.5" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug">{text}</p>
                    <p className="mt-0.5 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
                      <Info className="mt-0.5 size-3 shrink-0" strokeWidth={2} />
                      {reason}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 pl-12 sm:pl-0">
                    <Link
                      href={href}
                      className="-mx-2 -my-3 inline-flex items-center gap-1 whitespace-nowrap px-2 py-3 text-xs font-medium text-primary transition-opacity hover:opacity-80"
                    >
                      View
                      <ArrowRight className="size-3.5" strokeWidth={2.25} />
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* ---------------------- Today's briefing ---------------------- */}
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <div className="flex items-baseline justify-between">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <CalendarDays className="size-4" strokeWidth={2} />
            {weekday}&apos;s briefing
          </h2>
          <span className="text-xs text-muted-foreground">What needs your attention</span>
        </div>
        {briefing.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No weather, tasks, or verified insights are available yet.</p> : <div className="mt-3.5 grid gap-3 sm:grid-cols-3">
          {briefing.map(({ icon: Icon, text, hint, tone }) => (
            <div
              key={text}
              className="flex items-start gap-3 rounded-xl border border-border/60 bg-secondary/30 px-3.5 py-3"
            >
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-lg',
                  briefToneStyles[tone],
                )}
              >
                <Icon className="size-4.5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">{text}</p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{hint}</p>
              </div>
            </div>
          ))}
        </div>}
      </div>

      {/* ------------------------ Bento grid ------------------------ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
        {/* Home Health — feature tile */}
        <Tile className="lg:col-span-2 lg:row-span-2">
          <TileHead title="Home Health" href="/care" action="Report" />
          <div className="mt-4 flex flex-col items-center text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-sage/15 text-sage-foreground">
              <House className="size-6" strokeWidth={1.75} />
            </span>
            <h3 className="mt-3 font-serif text-4xl leading-none tracking-tight">{data.healthLabel}</h3>
            <span className="mt-2 font-serif text-3xl leading-none tracking-tight tabular-nums">
              {data.healthScore}
            </span>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-sage/15 px-2.5 py-1 text-xs font-medium text-sage-foreground">
              {allHealthy && <ArrowUpRight className="size-3.5" strokeWidth={2.5} />}
              {allHealthy ? 'All systems healthy' : `${data.systemsWatch} to keep an eye on`}
            </span>
          </div>
          <div className="mt-5 flex flex-1 flex-col justify-end gap-2.5">
            {data.healthAreas.map((a) => (
              <div key={a.label} className="flex items-center gap-3">
                <span className="w-16 shrink-0 truncate text-xs text-muted-foreground">{a.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-sage" style={{ width: `${a.value}%` }} />
                </div>
                <span className="w-6 shrink-0 text-right text-xs font-medium tabular-nums">
                  {a.value}
                </span>
              </div>
            ))}
          </div>
        </Tile>

        {/* This Weekend — interactive checklist */}
        <Tile className="lg:col-span-2 lg:row-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              This Weekend
            </h2>
            <span className="text-xs font-medium text-muted-foreground tabular-nums">
              {completed}/{tasks.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">A short, well-prioritized list</p>
          {tasks.length === 0 ? (
            <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 p-6 text-center">
              <CheckCircle2 className="size-6 text-sage-foreground" strokeWidth={1.75} />
              <p className="text-sm font-medium">You&apos;re all caught up</p>
              <p className="text-xs text-muted-foreground">No open tasks right now.</p>
            </div>
          ) : (
            <ul className="mt-4 flex flex-1 flex-col gap-2">
              {tasks.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => toggle(task.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors',
                      task.done
                        ? 'border-transparent bg-muted/60'
                        : 'border-border/70 hover:border-sage/40 hover:bg-accent/40',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                        task.done ? 'border-sage bg-sage text-primary-foreground' : 'border-border',
                      )}
                    >
                      {task.done && <Check className="size-3.5" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            'truncate text-sm font-medium',
                            task.done && 'text-muted-foreground line-through',
                          )}
                        >
                          {task.title}
                        </span>
                        {task.highlight && !task.done && (
                          <Star
                            className="size-3.5 shrink-0 fill-current text-wood-foreground"
                            strokeWidth={2}
                          />
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {/* A small, earned celebration — appears only once everything's done */}
          {tasks.length > 0 && remaining === 0 && (
            <div className="mt-3 flex items-start gap-3 rounded-xl border border-sage/30 bg-sage/[0.1] p-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sage/20 text-sage-foreground">
                <PartyPopper className="size-4.5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-sage-foreground">
                  That&apos;s the whole list — nicely done.
                </p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                  Every task checked off is a little less to worry about.
                </p>
              </div>
            </div>
          )}
        </Tile>

        {/* HomeOS Insight — spotlight */}
        <Tile className="border-sage/25 bg-sage/[0.06] lg:col-span-2 lg:row-span-2">
          <AiBadge verb="noticed" className="self-start" />
          {data.insight ? (
            <>
              <p className="mt-4 text-pretty font-serif text-xl leading-snug">{data.insight.headline}</p>
              {data.insight.detail && (
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {data.insight.detail}
                </p>
              )}
              {data.insight.basis && (
                <p className="mt-3 flex items-center gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  <Info className="size-3.5 shrink-0" strokeWidth={2} />
                  {data.insight.basis}
                </p>
              )}
              {data.insight.stat && (
                <div className="mt-4 rounded-xl border border-sage/25 bg-sage/10 p-3">
                  <p className="font-serif text-2xl tracking-tight tabular-nums text-sage-foreground">
                    {data.insight.stat}
                  </p>
                </div>
              )}
              <Link
                href={data.insight.href}
                className="mt-auto inline-flex w-fit items-center gap-1.5 pt-4 text-sm font-medium text-primary transition-opacity hover:opacity-80"
              >
                {data.insight.label}
                <ArrowRight className="size-4" strokeWidth={2.25} />
              </Link>
            </>
          ) : (
            <>
              <p className="mt-4 text-pretty font-serif text-xl leading-snug">
                HomeOS is still getting to know your home.
              </p>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                As you add systems, files, and history, patterns worth knowing will start to surface here.
              </p>
              <Link
                href="/ask"
                className="mt-auto inline-flex w-fit items-center gap-1.5 pt-4 text-sm font-medium text-primary transition-opacity hover:opacity-80"
              >
                Ask HomeOS anything
                <ArrowRight className="size-4" strokeWidth={2.25} />
              </Link>
            </>
          )}
        </Tile>

        {/* Weather */}
        <Tile className="bg-accent/40 lg:col-span-3">
          <TileHead title="Weather Watch" />
          {data.weather ? <><div className="mt-3 flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-sage-foreground shadow-sm">
              <CloudRain className="size-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm font-medium">{data.weather.temperature}° and {data.weather.condition.toLowerCase()}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                {data.weather.location} · High {data.weather.high}° · Low {data.weather.low}°
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-2 border-t border-border/60 pt-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-2.5 rounded-xl bg-card/70 px-3 py-2"><Droplets className="size-4"/><div><p className="text-xs font-medium">Precipitation</p><p className="text-[11px] text-muted-foreground">{data.weather.precipitationChance}% chance today</p></div></div>
            <div className="flex flex-1 items-center gap-2.5 rounded-xl bg-card/70 px-3 py-2"><Wind className="size-4"/><div><p className="text-xs font-medium">Wind</p><p className="text-[11px] text-muted-foreground">{data.weather.windMph} mph now</p></div></div>
          </div>
          </> : <p className="mt-4 text-sm text-muted-foreground">Add a city or ZIP code in Settings to connect local weather.</p>}
        </Tile>

        {/* Upcoming maintenance */}
        <Tile className="lg:col-span-3">
          <TileHead title="Upcoming Maintenance" href="/care" action="All" />
          <div className="mt-3 flex gap-1 rounded-xl bg-muted/70 p-1">
            {groups.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroup(g)}
                className={cn(
                  'flex-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors pointer-coarse:min-h-10',
                  group === g
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {g}
              </button>
            ))}
          </div>
          {filteredMaint.length === 0 ? (
            <p className="mt-4 flex flex-1 items-center justify-center py-6 text-center text-sm text-muted-foreground">
              Nothing due this {group.toLowerCase()}.
            </p>
          ) : (
            <ul className="mt-1 flex flex-1 flex-col divide-y divide-border/70">
              {filteredMaint.map(({ id, icon, title, due }) => {
                const Icon = iconFor(icon)
                return (
                  <li key={id} className="flex items-center gap-3 py-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                      <Icon className="size-4" strokeWidth={2} />
                    </span>
                    <p className="flex-1 text-sm font-medium">{title}</p>
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground tabular-nums">
                      {due}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Tile>

        {/* Active project spotlight */}
        <Tile className="lg:col-span-2">
          <TileHead title="In Progress" href="/projects" action="All" />
          {data.project ? (
            <>
              <div className="mt-3 flex items-center gap-2 text-sage-foreground">
                <Hammer className="size-4" strokeWidth={2} />
                <span className="text-sm font-semibold text-foreground">{data.project.name}</span>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium tabular-nums">{data.project.progress}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-wood"
                    style={{ width: `${data.project.progress}%` }}
                  />
                </div>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Circle className="size-2 fill-wood text-wood" strokeWidth={0} />
                Next: {data.project.next}
                {data.project.nextWhen && ` · ${data.project.nextWhen}`}
              </p>
            </>
          ) : (
            <div className="mt-3 flex flex-1 flex-col items-center justify-center gap-2 py-4 text-center">
              <Hammer className="size-6 text-muted-foreground" strokeWidth={1.75} />
              <p className="text-sm font-medium">No active projects</p>
              <Link href="/projects" className="text-xs font-medium text-primary hover:opacity-80">
                Plan a project
              </Link>
            </div>
          )}
        </Tile>

        {/* Activity ticker */}
        <Tile className="bg-transparent shadow-none lg:col-span-4">
          <TileHead title="Recent Activity" />
          {data.activity.length === 0 ? (
            <p className="mt-3 flex flex-1 items-center text-sm text-muted-foreground">
              Nothing logged yet — your home&apos;s activity will show up here.
            </p>
          ) : (
            <ul className="mt-3 grid flex-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {data.activity.map(({ id, icon, text, time }) => {
                const Icon = iconFor(icon)
                return (
                  <li key={id} className="flex min-w-0 items-center gap-2.5">
                    <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                    <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{text}</p>
                    <span className="shrink-0 text-xs text-muted-foreground/70 tabular-nums">{time}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </Tile>
      </div>
    </div>
  )
}
