'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { Dialog } from '@base-ui/react/dialog'
import {
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
  Zap,
  Plus,
  ArrowRight,
  Link2,
  Pencil,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Database } from '@/lib/supabase/database.types'
import { updateHome, removeMember, updateProfileName } from '@/lib/actions/settings'

/* Settings reimagined as a HomeOS control panel: a summary hero, then grouped
   lists that lean into the "operating system for your home" idea — Home
   Intelligence, Home Profile, Family, and Connected Sources — rather than a
   generic SaaS account screen. */

type HomeRow = Database['public']['Tables']['homes']['Row']
type Member = { userId: string; role: string; name: string | null; email: string }
type SystemItem = { name: string; manufacturer: string | null; installed_on: string | null }

const recommendationStyles = [
  {
    key: 'Conservative',
    blurb: 'I’ll only flag things that clearly need attention, and stay quiet otherwise.',
  },
  {
    key: 'Balanced',
    blurb: 'I’ll surface timely suggestions and the occasional idea worth considering.',
  },
  {
    key: 'Proactive',
    blurb: 'I’ll plan ahead aggressively — scheduling, bundling visits, and spotting savings early.',
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

/* Presentational only — semantic data lives in the DB. */
const propertyTypeOptions: [string, string][] = [
  ['single-family', 'Single-family home'],
  ['townhome', 'Townhome'],
  ['condo', 'Condo'],
  ['cabin', 'Cabin'],
  ['vacation', 'Vacation home'],
  ['rental', 'Rental property'],
]

const memberTints = [
  'bg-wood/25 text-wood-foreground',
  'bg-sage/20 text-sage-foreground',
  'bg-primary/10 text-primary',
  'bg-secondary text-secondary-foreground',
]

const systemIcons: Record<string, LucideIcon> = {
  HVAC: Wind,
  'Water heater': Flame,
  Roof: HomeIcon,
  Plumbing: Droplets,
  Electrical: Zap,
  Irrigation: Droplets,
  'Sump pump': Droplets,
}

/* owner|family|guest -> the display labels this UI was designed around. */
function roleLabel(role: string): string {
  if (role === 'owner') return 'Owner'
  if (role === 'guest') return 'Viewer'
  return 'Editor'
}

function formatType(type: string | null): string {
  if (!type) return '—'
  const label = propertyTypeOptions.find(([v]) => v === type)?.[1]
  return label ?? type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ')
}

function systemDetail(sys: SystemItem): string {
  const year = sys.installed_on ? sys.installed_on.slice(0, 4) : null
  return [sys.manufacturer, year].filter(Boolean).join(' · ')
}

export function SettingsPanel({
  home,
  members,
  systems,
  currentUserId,
  isOwner,
}: {
  home: HomeRow
  members: Member[]
  systems: SystemItem[]
  currentUserId: string
  isOwner: boolean
}) {
  const [editingHome, setEditingHome] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [removing, setRemoving] = useState<Member | null>(null)

  const me = members.find((m) => m.userId === currentUserId)
  const since = new Date(home.created_at).getFullYear()

  const summaryStats = [
    { label: 'Home Knowledge', value: '87%', accent: true },
    { label: 'Connected Sources', value: String(connectedSources.filter((s) => s.on).length) },
    { label: 'My Homes', value: '1' },
    { label: 'Family Members', value: String(members.length) },
  ]

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
            <p className="truncate font-serif text-lg leading-tight tracking-tight">{home.name}</p>
            <p className="text-xs text-muted-foreground">
              HomeOS Plus · caring for your home since {since}
            </p>
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
          <ValueRow icon={CalendarClock} label="Year built" value={home.year_built?.toString() ?? '—'} />
          <ValueRow
            icon={Ruler}
            label="Square footage"
            value={home.sqft ? `${home.sqft.toLocaleString()} sq ft` : '—'}
          />
          <ValueRow icon={HomeIcon} label="Home type" value={formatType(home.property_type)} />
          <div className="border-b border-border/60 px-4 py-3.5">
            <div className="flex items-center gap-3.5">
              <RowIcon Icon={FolderCog} />
              <span className="flex-1 text-sm font-medium">Systems on file</span>
              <span className="text-sm text-muted-foreground">{systems.length}</span>
            </div>
            {systems.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2 pl-11">
                {systems.map((sys, i) => {
                  const Icon = systemIcons[sys.name] ?? FolderCog
                  const detail = systemDetail(sys)
                  return (
                    <li
                      key={`${sys.name}-${i}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/40 px-2.5 py-1 text-xs"
                    >
                      <Icon className="size-3.5 text-muted-foreground" strokeWidth={2} />
                      <span className="font-medium">{sys.name}</span>
                      {detail && <span className="text-muted-foreground">· {detail}</span>}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
          <ActionRow icon={FolderCog} label="Edit home details" onClick={() => setEditingHome(true)} last />
        </Group>

        {/* -------------------- My Homes -------------------- */}
        <Group title="My Homes">
          <ValueRow icon={House} label={home.name} value="Primary" />
          <ActionRow icon={Plus} label="Add a home" last />
        </Group>

        {/* -------------------- Family -------------------- */}
        <Group title="Family" caption="Everyone who can see and help care for your home">
          {members.length === 0 && (
            <p className="px-4 py-4 text-sm text-muted-foreground">No family members yet.</p>
          )}
          {members.map((m, i) => {
            const isMe = m.userId === currentUserId
            const displayName = m.name || m.email || 'Member'
            const initial = displayName.charAt(0).toUpperCase()
            return (
              <div
                key={m.userId}
                className={cn(
                  'flex items-center gap-3.5 px-4 py-3',
                  i !== members.length - 1 && 'border-b border-border/60',
                )}
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                    memberTints[i % memberTints.length],
                  )}
                >
                  {initial}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {displayName}
                    {isMe && <span className="text-muted-foreground"> (You)</span>}
                  </p>
                  {isMe && m.email && (
                    <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                  )}
                </div>
                <RoleBadge role={roleLabel(m.role)} />
                {isMe ? (
                  <button
                    type="button"
                    onClick={() => setEditingName(true)}
                    aria-label="Edit your name"
                    className="flex size-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                  >
                    <Pencil className="size-4" strokeWidth={2} />
                  </button>
                ) : (
                  isOwner && (
                    <button
                      type="button"
                      onClick={() => setRemoving(m)}
                      aria-label={`Remove ${displayName}`}
                      className="flex size-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" strokeWidth={2} />
                    </button>
                  )
                )}
              </div>
            )
          })}
          <ActionRow icon={Plus} label="Invite family" last />
        </Group>

        {/* -------------------- Connected Sources -------------------- */}
        <Group title="Connected Sources" caption="Where I gather what I know about your home">
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

      <EditHomeDialog open={editingHome} onClose={() => setEditingHome(false)} home={home} />
      <EditNameDialog
        open={editingName}
        onClose={() => setEditingName(false)}
        currentName={me?.name ?? ''}
      />
      <RemoveMemberDialog
        member={removing}
        homeId={home.id}
        onClose={() => setRemoving(null)}
      />
    </div>
  )
}

/* ------------------------------ dialogs ------------------------------ */

function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border/70 bg-card p-6 shadow-xl outline-none transition-all data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-serif text-xl tracking-tight">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close className="flex size-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground">
              <X className="size-4.5" strokeWidth={2} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Field({
  label,
  value,
  onChange,
  className,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  className?: string
  type?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-2xl border border-border bg-card px-3.5 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
      />
    </label>
  )
}

function toInt(v: string): number | null {
  const digits = v.replace(/[^\d]/g, '')
  return digits ? parseInt(digits, 10) : null
}
function toNum(v: string): number | null {
  const cleaned = v.replace(/[^\d.]/g, '')
  return cleaned ? Number(cleaned) : null
}

function EditHomeDialog({
  open,
  onClose,
  home,
}: {
  open: boolean
  onClose: () => void
  home: HomeRow
}) {
  const [form, setForm] = useState({
    name: home.name,
    street: home.street ?? '',
    city: home.city ?? '',
    state: home.state ?? '',
    zip: home.zip ?? '',
    year_built: home.year_built?.toString() ?? '',
    sqft: home.sqft?.toString() ?? '',
    beds: home.beds?.toString() ?? '',
    baths: home.baths?.toString() ?? '',
    property_type: home.property_type ?? '',
  })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function save() {
    setPending(true)
    setError(null)
    const res = await updateHome(home.id, {
      name: form.name.trim() || home.name,
      street: form.street.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      zip: form.zip.trim() || null,
      year_built: toInt(form.year_built),
      sqft: toInt(form.sqft),
      beds: toInt(form.beds),
      baths: toNum(form.baths),
      property_type: form.property_type || null,
    })
    if (res?.error) {
      setError(res.error)
      setPending(false)
      return
    }
    setPending(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit home details">
      <div className="space-y-3">
        <Field label="Home name" value={form.name} onChange={set('name')} />
        <Field label="Street address" value={form.street} onChange={set('street')} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="City" value={form.city} onChange={set('city')} className="col-span-2" />
          <Field label="State" value={form.state} onChange={set('state')} />
          <Field label="ZIP" value={form.zip} onChange={set('zip')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Year built" value={form.year_built} onChange={set('year_built')} />
          <Field label="Square footage" value={form.sqft} onChange={set('sqft')} />
          <Field label="Bedrooms" value={form.beds} onChange={set('beds')} />
          <Field label="Bathrooms" value={form.baths} onChange={set('baths')} />
        </div>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Home type</span>
          <select
            value={form.property_type}
            onChange={(e) => set('property_type')(e.target.value)}
            className="h-11 w-full rounded-2xl border border-border bg-card px-3.5 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          >
            <option value="">Not set</option>
            {propertyTypeOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <div className="mt-5 flex justify-end gap-2">
        <Dialog.Close className="rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent/40">
          Cancel
        </Dialog.Close>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70"
        >
          {pending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </Modal>
  )
}

function EditNameDialog({
  open,
  onClose,
  currentName,
}: {
  open: boolean
  onClose: () => void
  currentName: string
}) {
  const [name, setName] = useState(currentName)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setPending(true)
    setError(null)
    const res = await updateProfileName(name)
    if (res?.error) {
      setError(res.error)
      setPending(false)
      return
    }
    setPending(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Your name" description="How you appear across your home.">
      <Field label="Display name" value={name} onChange={setName} />
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Dialog.Close className="rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent/40">
          Cancel
        </Dialog.Close>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Modal>
  )
}

function RemoveMemberDialog({
  member,
  homeId,
  onClose,
}: {
  member: Member | null
  homeId: string
  onClose: () => void
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const name = member?.name || member?.email || 'this member'

  async function confirm() {
    if (!member) return
    setPending(true)
    setError(null)
    const res = await removeMember(homeId, member.userId)
    if (res?.error) {
      setError(res.error)
      setPending(false)
      return
    }
    setPending(false)
    onClose()
  }

  return (
    <Modal
      open={member !== null}
      onClose={onClose}
      title="Remove member"
      description={`${name} will lose access to your home. You can invite them again later.`}
    >
      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Dialog.Close className="rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent/40">
          Cancel
        </Dialog.Close>
        <button
          type="button"
          onClick={confirm}
          disabled={pending}
          className="rounded-2xl bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-70"
        >
          {pending ? 'Removing…' : 'Remove'}
        </button>
      </div>
    </Modal>
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

function ActionRow({
  icon: Icon,
  label,
  onClick,
  last,
}: {
  icon: LucideIcon
  label: string
  onClick?: () => void
  last?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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
              'min-w-0 flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-10',
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
        'relative flex h-6 w-10 shrink-0 items-center rounded-full transition-colors before:absolute before:-inset-2.5 before:content-[""]',
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
