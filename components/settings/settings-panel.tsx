'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  User,
  House,
  Bell,
  Lock,
  CreditCard,
  ChevronRight,
  Check,
  Sparkles,
  Gauge,
  FolderCog,
  CalendarPlus,
  Wallet,
  Ruler,
  CalendarClock,
  Home as HomeIcon,
  Wind,
  Flame,
  Droplets,
  Plus,
  ArrowRight,
  Link2,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* Settings reimagined as a HomeOS control panel: a summary hero, then grouped
   lists that lean into the "operating system for your home" idea — Home
   Intelligence, Home Profile, Family, and Connected Sources — rather than a
   generic SaaS account screen. */

const summaryStats = [
  { label: 'Home Knowledge', value: '87%', accent: true },
  { label: 'Connected Sources', value: '6' },
  { label: 'My Homes', value: '2' },
  { label: 'Family Members', value: '4' },
]

const recommendationStyles = [
  {
    key: 'Conservative',
    blurb: 'I\u2019ll only flag things that clearly need attention, and stay quiet otherwise.',
  },
  {
    key: 'Balanced',
    blurb: 'I\u2019ll surface timely suggestions and the occasional idea worth considering.',
  },
  {
    key: 'Proactive',
    blurb: 'I\u2019ll plan ahead aggressively \u2014 scheduling, bundling visits, and spotting savings early.',
  },
]

const budgetStyles = ['Modest', 'Moderate', 'Ambitious']

const connectedSources = [
  { name: 'Google Photos', logo: '/logos/google-photos.svg', detail: 'Rooms & project photos', on: true },
  { name: 'Gmail', logo: '/logos/gmail.svg', detail: 'Receipts & warranties', on: true },
  { name: 'Google Drive', logo: '/logos/google-drive.svg', detail: 'Documents & manuals', on: true },
  { name: 'Google Nest', logo: '/logos/google-home.svg', detail: 'Thermostat & climate', on: true },
  { name: 'Ring', logo: '/logos/ring.svg', detail: 'Doorbell & cameras', on: true },
  { name: 'SmartThings', logo: '/logos/smartthings.svg', detail: 'Connected devices', on: true },
  { name: 'Philips Hue', logo: '/logos/philips-hue.svg', detail: 'Lighting', on: false },
  { name: 'Google Calendar', logo: '/logos/google-calendar.svg', detail: 'Maintenance schedule', on: true },
]

const family = [
  { name: 'Alexis Rivera', role: 'Owner', initial: 'A', tint: 'bg-wood/25 text-wood-foreground' },
  { name: 'Sam Rivera', role: 'Editor', initial: 'S', tint: 'bg-sage/20 text-sage-foreground' },
  { name: 'Maya Rivera', role: 'Viewer', initial: 'M', tint: 'bg-primary/10 text-primary' },
  { name: 'Grandma Jo', role: 'Viewer', initial: 'J', tint: 'bg-secondary text-secondary-foreground' },
]

const homeSystems = [
  { icon: Wind, label: 'HVAC', detail: 'Carrier · 2019' },
  { icon: Flame, label: 'Furnace', detail: 'Carrier · 2019' },
  { icon: Droplets, label: 'Water heater', detail: 'Rheem · 2021' },
]

export function SettingsPanel() {
  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <h1 className="font-serif text-3xl tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your home, your family, and how I work for you.
        </p>
      </header>

      {/* Summary hero — makes Settings feel like part of HomeOS, not a SaaS form */}
      <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b border-border/60 bg-sage/[0.06] px-5 py-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sage/20 text-sage-foreground">
            <HomeIcon className="size-5.5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-serif text-lg leading-tight tracking-tight">Willow Lane</p>
            <p className="text-xs text-muted-foreground">HomeOS Plus · caring for your home since 2019</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 divide-x divide-y divide-border/60 sm:grid-cols-4 sm:divide-y-0">
          {summaryStats.map((s) => (
            <div key={s.label} className="px-4 py-4 text-center">
              <dd
                className={cn(
                  'font-serif text-2xl leading-none tracking-tight tabular-nums',
                  s.accent && 'text-sage-foreground',
                )}
              >
                {s.value}
              </dd>
              <dt className="mt-1.5 text-[11px] font-medium leading-tight text-muted-foreground">
                {s.label}
              </dt>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-9 space-y-9">
        {/* -------------------- Home Intelligence -------------------- */}
        <HomeIntelligence />

        {/* -------------------- Home Profile -------------------- */}
        <Group title="Home Profile">
          <ValueRow icon={CalendarClock} label="Year built" value="1998" />
          <ValueRow icon={Ruler} label="Square footage" value="2,340 sq ft" />
          <ValueRow icon={HomeIcon} label="Home type" value="Single-family" />
          <div className="border-b border-border/60 px-4 py-3.5">
            <div className="flex items-center gap-3.5">
              <RowIcon Icon={FolderCog} />
              <span className="flex-1 text-sm font-medium">Systems on file</span>
              <span className="text-sm text-muted-foreground">{homeSystems.length}</span>
            </div>
            <ul className="mt-3 flex flex-wrap gap-2 pl-11">
              {homeSystems.map((sys) => (
                <li
                  key={sys.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/40 px-2.5 py-1 text-xs"
                >
                  <sys.icon className="size-3.5 text-muted-foreground" strokeWidth={2} />
                  <span className="font-medium">{sys.label}</span>
                  <span className="text-muted-foreground">· {sys.detail}</span>
                </li>
              ))}
            </ul>
          </div>
          <LinkRowItem icon={FolderCog} label="Edit home details" href="/library" last />
        </Group>

        {/* -------------------- My Homes -------------------- */}
        <Group title="My Homes">
          <ValueRow icon={House} label="Willow Lane" value="Primary" />
          <ValueRow icon={House} label="Lakeside Cabin" value="Secondary" />
          <ActionRow icon={Plus} label="Add a home" last />
        </Group>

        {/* -------------------- Family -------------------- */}
        <Group
          title="Family"
          caption="Everyone who can see and help care for your home"
        >
          {family.map((m, i) => (
            <div
              key={m.name}
              className={cn(
                'flex items-center gap-3.5 px-4 py-3',
                i !== family.length - 1 && 'border-b border-border/60',
              )}
            >
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                  m.tint,
                )}
              >
                {m.initial}
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium">{m.name}</span>
              <RoleBadge role={m.role} />
            </div>
          ))}
          <ActionRow icon={Plus} label="Invite family" last />
        </Group>

        {/* -------------------- Connected Sources -------------------- */}
        <Group
          title="Connected Sources"
          caption="Where I gather what I know about your home"
        >
          {connectedSources.map((src, i) => (
            <SourceRow key={src.name} src={src} last={i === connectedSources.length - 1} />
          ))}
        </Group>

        {/* -------------------- Notifications -------------------- */}
        <Group title="Notifications">
          <ToggleRow icon={Bell} label="Maintenance reminders" hint="Seasonal tasks and due dates" defaultOn />
          <ToggleRow icon={Bell} label="Weather alerts" hint="Storms and freeze warnings" defaultOn />
          <ToggleRow icon={Bell} label="Weekly digest" hint="A Sunday summary of your home" last />
        </Group>

        {/* -------------------- Privacy -------------------- */}
        <Group title="Privacy">
          <ToggleRow icon={Lock} label="Share anonymized insights" hint="Helps improve my suggestions for everyone" />
          <LinkRowItem icon={Lock} label="Data & export" value="Manage" last />
        </Group>

        {/* -------------------- Subscription -------------------- */}
        <Group title="Subscription">
          <ValueRow icon={CreditCard} label="Plan" value="HomeOS Plus" />
          <ValueRow icon={CreditCard} label="Billing" value="Visa ·· 4242" last />
        </Group>

        <p className="pt-2 text-center text-xs text-muted-foreground">HomeOS · Version 2.4.0</p>
      </div>
    </div>
  )
}

/* Home Intelligence — the section that makes Settings feel like HomeOS. It's
   interactive: choosing a recommendation style updates how HomeOS describes
   itself, reinforcing that these controls actually change its behavior. */
function HomeIntelligence() {
  const [style, setStyle] = useState('Balanced')
  const [budget, setBudget] = useState('Moderate')
  const active = recommendationStyles.find((s) => s.key === style) ?? recommendationStyles[1]

  return (
    <section>
      <h2 className="mb-2 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-sage-foreground">
        <Sparkles className="size-3.5" strokeWidth={2.25} />
        Home Intelligence
      </h2>
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        {/* Knowledge score */}
        <Link
          href="/library"
          className="flex items-center gap-3.5 border-b border-border/60 px-4 py-3.5 transition-colors hover:bg-accent/40"
        >
          <RowIcon Icon={Gauge} accent />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-tight">Home Knowledge Score</p>
            <p className="mt-0.5 text-xs text-muted-foreground">How much of your home I understand</p>
          </div>
          <span className="text-sm font-semibold tabular-nums text-sage-foreground">87%</span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" strokeWidth={2} />
        </Link>

        {/* Recommendation style — segmented control + live explanation */}
        <div className="border-b border-border/60 px-4 py-3.5">
          <div className="flex items-center gap-3.5">
            <RowIcon Icon={Sparkles} accent />
            <span className="flex-1 text-sm font-medium">Recommendation style</span>
          </div>
          <div className="mt-3 pl-11">
            <Segmented options={recommendationStyles.map((s) => s.key)} value={style} onChange={setStyle} />
            <p className="mt-2.5 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
              <Sparkles className="mt-0.5 size-3 shrink-0 text-sage-foreground" strokeWidth={2.25} />
              {active.blurb}
            </p>
          </div>
        </div>

        {/* Budget preference */}
        <div className="border-b border-border/60 px-4 py-3.5">
          <div className="flex items-center gap-3.5">
            <RowIcon Icon={Wallet} accent />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight">Budget preference</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Shapes the projects I suggest</p>
            </div>
          </div>
          <div className="mt-3 pl-11">
            <Segmented options={budgetStyles} value={budget} onChange={setBudget} />
          </div>
        </div>

        {/* Automation toggles */}
        <ToggleRow
          icon={FolderCog}
          label="Auto-organize uploads"
          hint="I'll file documents and photos where they belong"
          defaultOn
        />
        <ToggleRow
          icon={CalendarPlus}
          label="Create maintenance reminders"
          hint="I'll schedule upkeep before things become problems"
          defaultOn
          last
        />
      </div>
    </section>
  )
}

/* ---------------------------- building blocks ---------------------------- */

function Group({
  title,
  caption,
  children,
}: {
  title: string
  caption?: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">{children}</div>
      {caption && <p className="mt-2 px-1 text-xs text-muted-foreground">{caption}</p>}
    </section>
  )
}

function RowIcon({ Icon, accent }: { Icon: LucideIcon; accent?: boolean }) {
  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-lg',
        accent ? 'bg-sage/15 text-sage-foreground' : 'bg-secondary text-muted-foreground',
      )}
    >
      <Icon className="size-4" strokeWidth={2} />
    </span>
  )
}

function ValueRow({
  icon: Icon,
  label,
  value,
  last,
}: {
  icon: LucideIcon
  label: string
  value: string
  last?: boolean
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-accent/40',
        !last && 'border-b border-border/60',
      )}
    >
      <RowIcon Icon={Icon} />
      <span className="min-w-0 flex-1 text-sm font-medium">{label}</span>
      <span className="shrink-0 text-sm text-muted-foreground">{value}</span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" strokeWidth={2} />
    </button>
  )
}

function LinkRowItem({
  icon: Icon,
  label,
  value,
  href,
  last,
}: {
  icon: LucideIcon
  label: string
  value?: string
  href?: string
  last?: boolean
}) {
  const className = cn(
    'flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-accent/40',
    !last && 'border-b border-border/60',
  )
  const inner = (
    <>
      <RowIcon Icon={Icon} />
      <span className="min-w-0 flex-1 text-sm font-medium">{label}</span>
      {value && <span className="shrink-0 text-sm text-muted-foreground">{value}</span>}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" strokeWidth={2} />
    </>
  )
  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    )
  }
  return (
    <button type="button" className={className}>
      {inner}
    </button>
  )
}

function ActionRow({ icon: Icon, label, last }: { icon: LucideIcon; label: string; last?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-accent/40',
        !last && 'border-b border-border/60',
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sage/15 text-sage-foreground">
        <Icon className="size-4" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium text-sage-foreground">{label}</span>
    </button>
  )
}

function SourceRow({
  src,
  last,
}: {
  src: { name: string; logo: string; detail: string; on: boolean }
  last: boolean
}) {
  const [on, setOn] = useState(src.on)
  return (
    <div className={cn('flex items-center gap-3.5 px-4 py-3', !last && 'border-b border-border/60')}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card p-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src.logo || '/placeholder.svg'} alt="" className="size-full object-contain" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">{src.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{src.detail}</p>
      </div>
      {on ? (
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1 text-xs font-medium text-sage-foreground sm:inline-flex">
            <Link2 className="size-3.5" strokeWidth={2.25} />
            Connected
          </span>
          <Toggle defaultOn={on} label={src.name} onToggle={setOn} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOn(true)}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border/70 bg-secondary/40 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent/50"
        >
          Connect
          <ArrowRight className="size-3.5" strokeWidth={2.25} />
        </button>
      )}
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    Owner: 'bg-wood/20 text-wood-foreground',
    Editor: 'bg-sage/15 text-sage-foreground',
    Viewer: 'bg-secondary text-muted-foreground',
  }
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold',
        styles[role] ?? styles.Viewer,
      )}
    >
      {role}
    </span>
  )
}

function ToggleRow({
  icon: Icon,
  label,
  hint,
  defaultOn = false,
  last,
}: {
  icon: LucideIcon
  label: string
  hint?: string
  defaultOn?: boolean
  last?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3.5 px-4 py-3.5',
        !last && 'border-b border-border/60',
      )}
    >
      <RowIcon Icon={Icon} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Toggle defaultOn={defaultOn} label={label} />
    </div>
  )
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div
      role="radiogroup"
      className="inline-flex w-full rounded-xl border border-border/70 bg-secondary/40 p-1"
    >
      {options.map((opt) => {
        const selected = opt === value
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt)}
            className={cn(
              'flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

function Toggle({
  defaultOn,
  label,
  onToggle,
}: {
  defaultOn: boolean
  label: string
  onToggle?: (v: boolean) => void
}) {
  const [on, setOn] = useState(defaultOn)
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => {
        const next = !on
        setOn(next)
        onToggle?.(next)
      }}
      className={cn(
        'relative flex h-6 w-10 shrink-0 items-center rounded-full transition-colors',
        on ? 'bg-sage' : 'bg-muted',
      )}
    >
      <span
        className={cn(
          'flex size-5 items-center justify-center rounded-full bg-card shadow-sm transition-transform',
          on ? 'translate-x-[1.125rem]' : 'translate-x-0.5',
        )}
      >
        {on && <Check className="size-3 text-sage-foreground" strokeWidth={3} />}
      </span>
    </button>
  )
}
