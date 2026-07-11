'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  House,
  ArrowUpRight,
  ArrowRight,
  Check,
  Clock,
  Star,
  Sparkles,
  CloudRain,
  Wind,
  Snowflake,
  Fan,
  Flame,
  Trees,
  Droplets,
  ChevronRight,
  CheckCircle2,
  FileText,
  Bell,
  Hammer,
  Circle,
  CalendarDays,
  Receipt,
  ShieldAlert,
  Sun,
  ClipboardCheck,
  Leaf,
  Info,
  CalendarClock,
  Paperclip,
  Undo2,
  PartyPopper,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AiBadge } from '@/components/ai-badge'

/* ------------------------------- Data ------------------------------- */

const healthScore = 91
const healthAreas = [
  { label: 'Systems', value: 94 },
  { label: 'Safety', value: 90 },
  { label: 'Docs', value: 88 },
  { label: 'Upkeep', value: 92 },
  { label: 'Knowledge', value: 84 },
]

type Task = { id: string; title: string; time: string; highlight?: boolean; done: boolean }
const initialTasks: Task[] = [
  { id: '1', title: 'Replace HVAC filter', time: '15 min', highlight: true, done: false },
  { id: '2', title: 'Inspect the deck', time: '20 min', done: false },
  { id: '3', title: 'Test smoke & CO detectors', time: '10 min', done: false },
]

const weatherAlerts = [
  { icon: Wind, label: 'High winds tomorrow', hint: 'Secure patio furniture' },
  { icon: Snowflake, label: 'First freeze next week', hint: 'Winterize outdoor faucets' },
]

type Group = 'Week' | 'Month' | 'Season'
const maintenance: { icon: typeof Fan; title: string; due: string; group: Group }[] = [
  { icon: Fan, title: 'HVAC filter change', due: '3 days', group: 'Week' },
  { icon: Droplets, title: 'Flush water heater', due: '5 days', group: 'Week' },
  { icon: Flame, title: 'Furnace inspection', due: 'Oct 18', group: 'Month' },
  { icon: Trees, title: 'Trim backyard hedges', due: 'Oct 24', group: 'Month' },
  { icon: Snowflake, title: 'Winterize faucets', due: 'Nov 2', group: 'Season' },
]
const groups: Group[] = ['Week', 'Month', 'Season']

const activity = [
  { icon: CheckCircle2, text: 'Gutter cleaning marked complete', time: '2h' },
  { icon: Sparkles, text: 'HomeOS scheduled your HVAC filter change', time: '1d' },
  { icon: FileText, text: 'Warranty added for LG refrigerator', time: '2d' },
  { icon: Bell, text: 'Reminder set for furnace inspection', time: '4d' },
]

/* Day-aware briefing — the thing that makes every visit feel different.
   Keyed by weekday so the home tells a slightly different story each day. */
type BriefTone = 'sage' | 'wood' | 'navy'
type Brief = { icon: LucideIcon; text: string; hint: string; tone: BriefTone }

const briefingByDay: Record<number, Brief[]> = {
  0: [
    { icon: ClipboardCheck, text: 'Weekend wrap-up', hint: '1 task left before Monday', tone: 'wood' },
    { icon: Sun, text: 'Clear and mild', hint: 'A good day to inspect the deck', tone: 'sage' },
    { icon: Hammer, text: 'Basement at 55%', hint: 'Framing inspection Tuesday', tone: 'navy' },
  ],
  1: [
    { icon: Receipt, text: 'New invoice uploaded', hint: 'Ridgeline Plumbing · $240', tone: 'sage' },
    { icon: CalendarDays, text: 'Basement inspection tomorrow', hint: '9:00 AM · framing', tone: 'wood' },
    { icon: ShieldAlert, text: 'Furnace warranty expiring', hint: '38 days left to renew', tone: 'navy' },
  ],
  2: [
    { icon: CalendarDays, text: 'Framing inspection today', hint: 'Birchwood Builders · 9 AM', tone: 'wood' },
    { icon: Leaf, text: 'Trim hedges this week', hint: 'Before the first frost', tone: 'sage' },
    { icon: CheckCircle2, text: 'Gutter cleaning done', hint: 'Marked complete yesterday', tone: 'navy' },
  ],
  3: [
    { icon: Droplets, text: 'Water heater service due', hint: 'Annual flush recommended', tone: 'wood' },
    { icon: Sun, text: 'Calm, clear skies', hint: 'No weather concerns today', tone: 'sage' },
    { icon: FileText, text: '2 documents added', hint: 'HVAC report · appliance manual', tone: 'navy' },
  ],
  4: [
    { icon: ClipboardCheck, text: 'Weekend prep', hint: '3 tasks queued for Saturday', tone: 'wood' },
    { icon: Wind, text: 'High winds Friday', hint: 'Secure the patio furniture', tone: 'navy' },
    { icon: Hammer, text: 'Basement: drywall next', hint: 'After Tuesday inspection', tone: 'sage' },
  ],
  5: [
    { icon: ClipboardCheck, text: 'Weekend ahead', hint: 'About 45 min of home care', tone: 'wood' },
    { icon: CloudRain, text: 'Rain Saturday', hint: '~2 inches · check the sump pump', tone: 'navy' },
    { icon: Hammer, text: 'Basement at 55%', hint: 'On track for September', tone: 'sage' },
  ],
  6: [
    { icon: ClipboardCheck, text: 'Weekend tasks ready', hint: '3 items · about 45 min', tone: 'wood' },
    { icon: CloudRain, text: 'Heavy rain today', hint: 'A good moment to check the sump pump', tone: 'navy' },
    { icon: Fan, text: 'HVAC filter due', hint: 'Quick 15-minute swap', tone: 'sage' },
  ],
}

/* Seasonal headline — a single item that always leads the briefing so the
   home feels aware of the time of year (freeze warnings, irrigation, etc.). */
const briefingBySeason: Record<'winter' | 'spring' | 'summer' | 'fall', Brief> = {
  winter: {
    icon: Snowflake,
    text: 'Freeze warning tonight',
    hint: 'Let a faucet drip and keep the garage closed',
    tone: 'navy',
  },
  spring: {
    icon: Droplets,
    text: 'Time to wake up the irrigation',
    hint: 'Schedule a sprinkler start-up this week',
    tone: 'sage',
  },
  summer: {
    icon: Sun,
    text: 'Peak cooling season',
    hint: 'A fresh AC filter keeps bills down',
    tone: 'sage',
  },
  fall: {
    icon: Leaf,
    text: 'Fall is settling in',
    hint: 'Clear the gutters before the first freeze',
    tone: 'wood',
  },
}

function seasonFor(month: number): keyof typeof briefingBySeason {
  if (month <= 1 || month === 11) return 'winter'
  if (month <= 4) return 'spring'
  if (month <= 7) return 'summer'
  return 'fall'
}

const briefToneStyles: Record<BriefTone, string> = {
  sage: 'bg-sage/15 text-sage-foreground',
  wood: 'bg-wood/25 text-wood-foreground',
  navy: 'bg-secondary text-secondary-foreground',
}

/* Proactive moments — things HomeOS quietly handled on its own since the last
   visit. First person, always with the reasoning, and a way to look closer or
   undo. This is what makes the product feel like it's working for you. */
type ProactiveAction = {
  id: string
  icon: LucideIcon
  text: string
  reason: string
  cta: { label: string; href: string } | null
  undoable?: boolean
}

const proactiveActions: ProactiveAction[] = [
  {
    id: 'p1',
    icon: CalendarClock,
    text: 'I moved your deck resealing to next weekend',
    reason: 'Heavy rain is forecast this Saturday — the stain needs two dry days to cure',
    cta: { label: 'See the plan', href: '/care' },
    undoable: true,
  },
  {
    id: 'p2',
    icon: Paperclip,
    text: 'I filed your new water heater warranty with its install invoice',
    reason: 'You uploaded the warranty PDF — I matched it to the Ridgeline Plumbing receipt',
    cta: { label: 'View in Library', href: '/library' },
  },
  {
    id: 'p3',
    icon: Bell,
    text: 'I set a reminder to swap the HVAC filter',
    reason: 'Summer pollen tends to clog yours about a month early',
    cta: { label: 'Why this matters', href: '/worth-knowing' },
  },
]

/* --------------------------- Tile primitive --------------------------- */

function Tile({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
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

function TileHead({
  title,
  href,
  action,
}: {
  title: string
  href?: string
  action?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-0.5 text-xs font-medium text-primary transition-opacity hover:opacity-80"
        >
          {action ?? 'View'}
          <ChevronRight className="size-3.5" strokeWidth={2} />
        </Link>
      )}
    </div>
  )
}

/* ------------------------------ Cockpit ------------------------------ */

export function CommandCenter() {
  const [tasks, setTasks] = useState(initialTasks)
  const [group, setGroup] = useState<Group>('Week')
  const completed = tasks.filter((t) => t.done).length
  const remaining = tasks.length - completed
  const toggle = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  const filteredMaint = maintenance.filter((m) => m.group === group)

  /* Resolve the real weekday after mount so the briefing is live but the
     first client render matches the server (defaults to Saturday). */
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => setNow(new Date()), [])
  const day = now ? now.getDay() : 6
  const weekday = now
    ? now.toLocaleDateString('en-US', { weekday: 'long' })
    : 'Saturday'
  const dateLabel = now
    ? now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : 'Saturday, July 11'

  /* Build a briefing that feels fresh every visit: a season-aware headline
     always leads, followed by two day items rotated by the visit count so
     re-opening Home surfaces something you didn't just see. */
  const [visit, setVisit] = useState(0)
  useEffect(() => {
    const key = 'homeos-visit'
    const next = Number(sessionStorage.getItem(key) ?? '0') + 1
    sessionStorage.setItem(key, String(next))
    setVisit(next)
  }, [])
  const month = now ? now.getMonth() : 6
  const season = seasonFor(month)
  const seasonBrief = briefingBySeason[season]
  const dayItems = briefingByDay[day]
  const rotated = [dayItems[visit % dayItems.length], dayItems[(visit + 1) % dayItems.length]]
  const briefing = [seasonBrief, ...rotated]

  /* A greeting that knows the hour and the season — a small, human touch. */
  const hour = now ? now.getHours() : 9
  const partOfDay = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const seasonalHeadline: Record<ReturnType<typeof seasonFor>, string> = {
    winter: 'Cozy and cared for, even in the cold.',
    spring: 'Fresh season, and your home is ready for it.',
    summer: 'Your home is in great shape today.',
    fall: 'Buttoned up and ready for the cooler days.',
  }

  return (
    <div className="space-y-4">
      {/* ---------------------- Command bar ---------------------- */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-sage-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-sage opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-sage" />
            </span>
            All systems normal
          </p>
          <h1 className="mt-1.5 text-balance font-serif text-2xl leading-tight tracking-tight">
            {seasonalHeadline[season]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {dateLabel} · {partOfDay}, Alexis
          </p>
        </div>

        {/* Live status pills */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-secondary/40 px-3.5 py-2.5">
            <House className="size-4 text-sage-foreground" strokeWidth={2} />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Health</p>
              <p className="font-serif text-base leading-none tabular-nums">{healthScore}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-secondary/40 px-3.5 py-2.5">
            <CloudRain className="size-4 text-sage-foreground" strokeWidth={2} />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {weekday.slice(0, 3)}
              </p>
              <p className="text-base font-semibold leading-none tabular-nums">68&deg;</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-wood/30 bg-wood/[0.1] px-3.5 py-2.5">
            <Star className="size-4 fill-current text-wood-foreground" strokeWidth={2} />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">To-dos</p>
              <p className="text-base font-semibold leading-none tabular-nums text-wood-foreground">
                {remaining}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------- While you were away ------------------- */}
      <div className="rounded-2xl border border-sage/25 bg-sage/[0.06] p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-sage/20 text-sage-foreground">
            <Sparkles className="size-4" strokeWidth={2} />
          </span>
          <h2 className="text-sm font-semibold">While you were away, I took care of a few things</h2>
        </div>
        <ul className="mt-4 flex flex-col gap-2.5">
          {proactiveActions.map(({ id, icon: Icon, text, reason, cta, undoable }) => (
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
                {undoable && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Undo2 className="size-3.5" strokeWidth={2} />
                    Undo
                  </button>
                )}
                {cta && (
                  <Link
                    href={cta.href}
                    className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-primary transition-opacity hover:opacity-80"
                  >
                    {cta.label}
                    <ArrowRight className="size-3.5" strokeWidth={2.25} />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
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
        <div className="mt-3.5 grid gap-3 sm:grid-cols-3">
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
        </div>
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
            <h3 className="mt-3 font-serif text-4xl leading-none tracking-tight">Excellent</h3>
            <span className="mt-2 font-serif text-3xl leading-none tracking-tight tabular-nums">
              {healthScore}
            </span>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-sage/15 px-2.5 py-1 text-xs font-medium text-sage-foreground">
              <ArrowUpRight className="size-3.5" strokeWidth={2.5} />
              +11 since move-in
            </span>
          </div>
          <div className="mt-5 flex flex-1 flex-col justify-end gap-2.5">
            {healthAreas.map((a) => (
              <div key={a.label} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-xs text-muted-foreground">{a.label}</span>
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
          <p className="mt-1 text-sm text-muted-foreground">About 45 minutes, well prioritized</p>
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
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" strokeWidth={2} />
                    {task.time}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {/* A small, earned celebration — appears only once everything's done */}
          {remaining === 0 && (
            <div className="mt-3 flex items-start gap-3 rounded-xl border border-sage/30 bg-sage/[0.1] p-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sage/20 text-sage-foreground">
                <PartyPopper className="size-4.5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-sage-foreground">
                  That&apos;s the whole weekend list — nicely done.
                </p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                  Your 100th completed task this year. You&apos;ve saved yourself about 6 hours this
                  season.
                </p>
              </div>
            </div>
          )}
        </Tile>

        {/* HomeOS Insight — spotlight */}
        <Tile className="border-sage/25 bg-sage/[0.06] lg:col-span-2 lg:row-span-2">
          <AiBadge verb="noticed" className="self-start" />
          <p className="mt-4 text-pretty font-serif text-xl leading-snug">
            Since last summer, you&apos;re spending far less time keeping this place running.
          </p>
          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
            Staying ahead of the small tasks has cut your summer upkeep nearly in half. That&apos;s
            time back in your weekends.
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
            <Info className="size-3.5 shrink-0" strokeWidth={2} />
            Based on your logged maintenance hours across the last two summers
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-border/60 bg-card p-3">
              <p className="text-[11px] text-muted-foreground">Last summer</p>
              <p className="mt-0.5 font-serif text-xl tracking-tight tabular-nums">
                11<span className="ml-0.5 text-sm text-muted-foreground">hrs</span>
              </p>
            </div>
            <div className="rounded-xl border border-sage/25 bg-sage/10 p-3">
              <p className="text-[11px] text-sage-foreground">This summer</p>
              <p className="mt-0.5 font-serif text-xl tracking-tight tabular-nums text-sage-foreground">
                6.5<span className="ml-0.5 text-sm">hrs</span>
              </p>
            </div>
          </div>
          <Link
            href="/ask"
            className="mt-auto inline-flex w-fit items-center gap-1.5 pt-4 text-sm font-medium text-primary transition-opacity hover:opacity-80"
          >
            Ask me how you did it
            <ArrowRight className="size-4" strokeWidth={2.25} />
          </Link>
        </Tile>

        {/* Weather */}
        <Tile className="bg-accent/40 lg:col-span-3">
          <TileHead title="Weather Watch" />
          <div className="mt-3 flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-sage-foreground shadow-sm">
              <CloudRain className="size-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm font-medium">Heavy rain this weekend</p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                ~2 inches Saturday. A good moment to check the sump pump.
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-2 border-t border-border/60 pt-3 sm:flex-row">
            {weatherAlerts.map(({ icon: Icon, label, hint }) => (
              <div
                key={label}
                className="flex flex-1 items-center gap-2.5 rounded-xl bg-card/70 px-3 py-2"
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{label}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{hint}</p>
                </div>
              </div>
            ))}
          </div>
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
                  'flex-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors',
                  group === g
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {g}
              </button>
            ))}
          </div>
          <ul className="mt-1 flex flex-1 flex-col divide-y divide-border/70">
            {filteredMaint.map(({ icon: Icon, title, due }) => (
              <li key={title} className="flex items-center gap-3 py-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <Icon className="size-4" strokeWidth={2} />
                </span>
                <p className="flex-1 text-sm font-medium">{title}</p>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground tabular-nums">
                  {due}
                </span>
              </li>
            ))}
          </ul>
        </Tile>

        {/* Active project spotlight */}
        <Tile className="lg:col-span-2">
          <TileHead title="In Progress" href="/projects" action="All" />
          <div className="mt-3 flex items-center gap-2 text-sage-foreground">
            <Hammer className="size-4" strokeWidth={2} />
            <span className="text-sm font-semibold text-foreground">Basement Finishing</span>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium tabular-nums">55%</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-wood" style={{ width: '55%' }} />
            </div>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Circle className="size-2 fill-wood text-wood" strokeWidth={0} />
            Next: framing inspection · Jun 12
          </p>
        </Tile>

        {/* Activity ticker */}
        <Tile className="bg-transparent shadow-none lg:col-span-4">
          <TileHead title="Recent Activity" />
          <ul className="mt-3 grid flex-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {activity.map(({ icon: Icon, text, time }, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                <p className="flex-1 truncate text-sm text-muted-foreground">{text}</p>
                <span className="shrink-0 text-xs text-muted-foreground/70 tabular-nums">
                  {time}
                </span>
              </li>
            ))}
          </ul>
        </Tile>
      </div>
    </div>
  )
}
