'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog } from '@base-ui/react/dialog'
import {
  House,
  ChevronRight,
  Check,
  FolderCog,
  Ruler,
  CalendarClock,
  Home as HomeIcon,
  Wind,
  Flame,
  Droplets,
  Zap,
  Plus,
  Link2,
  Mail,
  Copy,
  Pencil,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Database } from '@/lib/supabase/database.types'
import { updateHome, removeMember, updateProfileName } from '@/lib/actions/settings'
import {
  createInvite,
  revokeInvite,
  type InviteRole,
  type PendingInvite,
} from '@/lib/actions/invites'

/* Settings as a HomeOS control panel: a summary hero over real home data, then
   grouped lists for Home Profile, My Homes, and Family. */

type HomeRow = Database['public']['Tables']['homes']['Row']
type Member = { userId: string; role: string; name: string | null; email: string }
type SystemItem = { name: string; manufacturer: string | null; installed_on: string | null }

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
  invites,
}: {
  home: HomeRow
  members: Member[]
  systems: SystemItem[]
  currentUserId: string
  isOwner: boolean
  invites: PendingInvite[]
}) {
  const [editingHome, setEditingHome] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [removing, setRemoving] = useState<Member | null>(null)
  const [inviting, setInviting] = useState(false)

  const me = members.find((m) => m.userId === currentUserId)
  const since = new Date(home.created_at).getFullYear()

  const summaryStats = [
    { label: 'Systems', value: String(systems.length), accent: true },
    { label: 'Family', value: String(members.length) },
    { label: 'Year Built', value: home.year_built?.toString() ?? '—' },
    { label: 'Square Feet', value: home.sqft ? home.sqft.toLocaleString() : '—' },
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
              Caring for your home since {since}
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
          <ValueRow icon={House} label={home.name} value="Primary" last />
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
          {isOwner &&
            invites.map((inv) => <PendingInviteRow key={inv.id} invite={inv} />)}
          {isOwner && (
            <ActionRow icon={Plus} label="Invite family" onClick={() => setInviting(true)} last />
          )}
        </Group>

        <p className="pt-2 text-center text-xs text-muted-foreground">HomeOS</p>
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
      <InviteFamilyDialog open={inviting} onClose={() => setInviting(false)} />
    </div>
  )
}

/* A pending, not-yet-accepted invite. Owner-only; sits under the members list
   with a Revoke action (single-use links are cheap to remint, so no confirm). */
function PendingInviteRow({ invite }: { invite: PendingInvite }) {
  const [pending, startTransition] = useTransition()
  const label = invite.email || 'Link invite'
  const Icon = invite.email ? Mail : Link2
  const sent = new Date(invite.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })

  function revoke() {
    startTransition(async () => {
      await revokeInvite(invite.id)
    })
  }

  return (
    <div className={cn('flex items-center gap-3.5 border-t border-border/60 px-4 py-3', pending && 'opacity-50')}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-dashed border-border/70 text-muted-foreground">
        <Icon className="size-4" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="truncate text-xs text-muted-foreground">
          Invited {sent} · {roleLabel(invite.role)}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
        Pending
      </span>
      <button
        type="button"
        onClick={revoke}
        disabled={pending}
        aria-label={`Revoke invite for ${label}`}
        className="flex size-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none"
      >
        <Trash2 className="size-4" strokeWidth={2} />
      </button>
    </div>
  )
}

/* Create-invite flow: pick role (+ optional email hint), mint a single-use
   link, then hand back a copyable URL. No email is sent — the owner shares the
   link however they like. */
function InviteFamilyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<InviteRole>('family')
  const [url, setUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setEmail('')
    setRole('family')
    setUrl(null)
    setCopied(false)
    setError(null)
  }

  function close() {
    onClose()
    // Let the closing animation run before clearing the shown link.
    setTimeout(reset, 200)
    router.refresh()
  }

  async function create() {
    setPending(true)
    setError(null)
    const res = await createInvite(email.trim() || undefined, role)
    setPending(false)
    if ('url' in res) {
      setUrl(res.url)
      router.refresh()
      return
    }
    setError(res.error)
  }

  async function copy() {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy — select and copy the link manually.')
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Invite family"
      description={url ? undefined : 'Share access to your home with someone you trust.'}
    >
      {url ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/40 p-2 pl-3.5">
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">{url}</span>
            <button
              type="button"
              onClick={copy}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {copied ? <Check className="size-4" strokeWidth={2.5} /> : <Copy className="size-4" strokeWidth={2} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Text or email this link — it works once and expires in 7 days.
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={close}
              className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Access level</span>
            <div className="grid grid-cols-2 gap-2">
              <RoleOption
                label="Editor"
                hint="Can add and edit"
                selected={role === 'family'}
                onClick={() => setRole('family')}
              />
              <RoleOption
                label="Viewer"
                hint="Can view only"
                selected={role === 'guest'}
                onClick={() => setRole('guest')}
              />
            </div>
          </div>
          <Field
            label="Their email (optional)"
            value={email}
            onChange={setEmail}
            type="email"
          />
          <p className="text-xs text-muted-foreground">
            The email is just a label to help you remember who a link is for.
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Dialog.Close className="rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent/40">
              Cancel
            </Dialog.Close>
            <button
              type="button"
              onClick={create}
              disabled={pending}
              className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70"
            >
              {pending ? 'Creating…' : 'Create invite'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function RoleOption({
  label,
  hint,
  selected,
  onClick,
}: {
  label: string
  hint: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'rounded-2xl border px-3.5 py-3 text-left transition-colors',
        selected
          ? 'border-primary/40 bg-primary/5 ring-2 ring-primary/15'
          : 'border-border bg-card hover:bg-accent/40',
      )}
    >
      <span className="block text-sm font-medium">{label}</span>
      <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
    </button>
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

