import type { LucideIcon } from 'lucide-react'
import {
  Refrigerator,
  Wind,
  Home,
  Hammer,
  DoorOpen,
  Palette,
  HardHat,
  Image,
  Receipt,
  BookText,
  Video,
  Ruler,
  ShieldCheck,
  Lightbulb,
  CalendarClock,
  Trees,
  Package,
} from 'lucide-react'
import type { Database } from '@/lib/supabase/database.types'

type ItemRow = Database['public']['Tables']['items']['Row']
type FileRow = Database['public']['Tables']['files']['Row']
type RoomRow = Database['public']['Tables']['rooms']['Row']
type CareEventRow = Database['public']['Tables']['care_events']['Row']
type CareTaskRow = Database['public']['Tables']['care_tasks']['Row']

/* Icon components can't cross the server→client boundary (RSC can't serialize
   functions). Data that flows into "use client" components carries an icon
   NAME; the component resolves it here (a direct import, not a prop). */
const iconRegistry: Record<string, LucideIcon> = {
  Wind,
  Refrigerator,
  Palette,
  Home,
  Trees,
  Ruler,
  Package,
  DoorOpen,
  Hammer,
  HardHat,
  CalendarClock,
}

export function iconFor(name: string): LucideIcon {
  return iconRegistry[name] ?? Package
}

/* ---------------------------------------------------------------------------
   Presentational maps + view types + DB→view adapters for the Library.
   The Library owns NO data of its own — every list is built from Supabase
   rows by the adapters below. Icons/tints/labels live here (keyed by
   category or file type) because the DB has no presentation columns.
--------------------------------------------------------------------------- */

export type CollectionKey =
  | 'systems'
  | 'rooms'
  | 'projects'
  | 'contractors'
  | 'appliances'
  | 'exterior'
  | 'yard'
  | 'paint'
  | 'measurements'
  | 'timeline'

export type Collection = {
  key: CollectionKey
  label: string
  icon: string
  count: number
  tint: string
  preview: string[]
}

/* Presentation for each collection surface (grid card + detail header).
   `icon` is a registry name (see iconFor) so it can cross to client code. */
export const collectionMeta: Record<CollectionKey, { label: string; icon: string; tint: string }> = {
  systems: { label: 'Systems', icon: 'Wind', tint: 'navy' },
  rooms: { label: 'Rooms', icon: 'DoorOpen', tint: 'wood' },
  projects: { label: 'Projects', icon: 'Hammer', tint: 'sage' },
  contractors: { label: 'Contractors', icon: 'HardHat', tint: 'navy' },
  appliances: { label: 'Appliances', icon: 'Refrigerator', tint: 'sage' },
  exterior: { label: 'Exterior', icon: 'Home', tint: 'wood' },
  yard: { label: 'Yard', icon: 'Trees', tint: 'sage' },
  paint: { label: 'Paint', icon: 'Palette', tint: 'wood' },
  measurements: { label: 'Measurements', icon: 'Ruler', tint: 'navy' },
  timeline: { label: 'Timeline', icon: 'CalendarClock', tint: 'sage' },
}

/* Item categories (DB `items.category`, lowercase) → presentation + the
   collection they roll up into. Also drives the create-item category select.
   `icon` is a registry name (see iconFor). */
type CategoryMeta = { label: string; icon: string; tint: string; collection: CollectionKey }

export const categoryMeta: Record<string, CategoryMeta> = {
  system: { label: 'System', icon: 'Wind', tint: 'navy', collection: 'systems' },
  appliance: { label: 'Appliance', icon: 'Refrigerator', tint: 'sage', collection: 'appliances' },
  paint: { label: 'Paint', icon: 'Palette', tint: 'wood', collection: 'paint' },
  exterior: { label: 'Exterior', icon: 'Home', tint: 'wood', collection: 'exterior' },
  yard: { label: 'Yard', icon: 'Trees', tint: 'sage', collection: 'yard' },
  measurement: { label: 'Measurement', icon: 'Ruler', tint: 'navy', collection: 'measurements' },
}

/** Category presentation with a safe fallback for anything unmapped. */
export function catMeta(category: string): CategoryMeta {
  return categoryMeta[category] ?? { label: titleCase(category), icon: 'Package', tint: 'navy', collection: 'systems' }
}

/** Collection key → the DB item category it filters by. */
export const collectionCategory: Partial<Record<CollectionKey, string>> = {
  systems: 'system',
  appliances: 'appliance',
  paint: 'paint',
  exterior: 'exterior',
  yard: 'yard',
  measurements: 'measurement',
}

/** Options for the create/edit item category select. */
export const categoryOptions = Object.entries(categoryMeta).map(([value, m]) => ({
  value,
  label: m.label,
}))

/* File types are secondary filters, not primary navigation. */
export type FileFilter = { key: string; label: string; icon: LucideIcon }

export const fileFilters: FileFilter[] = [
  { key: 'all', label: 'All', icon: BookText },
  { key: 'documents', label: 'Documents', icon: BookText },
  { key: 'photos', label: 'Photos', icon: Image },
  { key: 'videos', label: 'Videos', icon: Video },
  { key: 'receipts', label: 'Receipts', icon: Receipt },
  { key: 'manuals', label: 'Manuals', icon: BookText },
  { key: 'warranties', label: 'Warranties', icon: ShieldCheck },
]

export type LibraryFileType = 'documents' | 'photos' | 'videos' | 'receipts' | 'manuals' | 'warranties'

/* DB `files.type` (singular) → view metadata (plural filter key + presentation). */
export const fileTypeMeta: Record<
  string,
  { lib: LibraryFileType; label: string; tint: string; preview: 'doc' | 'photo' | 'video' | 'swatch'; icon: LucideIcon }
> = {
  document: { lib: 'documents', label: 'Document', tint: 'navy', preview: 'doc', icon: BookText },
  photo: { lib: 'photos', label: 'Photo', tint: 'wood', preview: 'photo', icon: Image },
  video: { lib: 'videos', label: 'Video', tint: 'navy', preview: 'video', icon: Video },
  receipt: { lib: 'receipts', label: 'Receipt', tint: 'sage', preview: 'doc', icon: Receipt },
  manual: { lib: 'manuals', label: 'Manual', tint: 'sage', preview: 'doc', icon: BookText },
  warranty: { lib: 'warranties', label: 'Warranty', tint: 'wood', preview: 'doc', icon: ShieldCheck },
}

/* Options for the upload file-type select (all real DB types). */
export const fileTypeOptions = Object.entries(fileTypeMeta).map(([value, m]) => ({
  value,
  label: m.label,
}))

/* Proactive observation shown on the Library home. `icon` is a registry name. */
export type LivingObservation = {
  id: string
  icon: string
  text: string
  action: string
  href: string
  tint: string
}

export type ItemField = { label: string; value: string; href?: boolean }

/* Lightweight card used by the home search + collection lists. `icon` is a
   registry name so the card can cross into "use client" components. */
export type ItemCard = {
  id: string
  name: string
  icon: string
  category: string
  tint: string
  summary: string
}

export type LibraryItem = {
  id: string
  name: string
  icon: LucideIcon
  category: string
  tint: string
  summary: string
  status?: { label: string; tone: 'good' | 'attention' | 'neutral' }
  /* Powers the lifespan visualization on the object profile */
  lifespan?: { installed: number; expectedMin: number; expectedMax: number }
  heroPhoto?: string
  facts: ItemField[]
  documents: { label: string; meta: string; icon: LucideIcon; href?: string }[]
  receipts?: { label: string; meta: string; href?: string }[]
  photos?: { src?: string; label: string }[]
  maintenance: { date: string; title: string; by?: string }[]
  knowledge: { label: string; meta: string; icon: LucideIcon }[]
  contractor?: { name: string; trade: string }
  relatedProjects?: { label: string; meta: string; id?: string }[]
  recommendations?: { title: string; detail: string; tone: 'attention' | 'plan' | 'good' }[]
  questions: string[]
  /* Resolved room (slug + name) so components don't look up a mock table. */
  roomRef?: { slug: string; name: string }
}

export type LibraryFile = {
  id: string
  name: string
  type: LibraryFileType
  typeLabel: string
  meta: string
  date: string
  /* Higher = more recent, used for sorting. */
  order: number
  itemId: string
  collection: string
  preview: 'doc' | 'photo' | 'video' | 'swatch'
  image?: string
  color?: string
  tint: string
}

export type Room = {
  slug: string
  name: string
  summary: string
  groups: { label: string; icon: LucideIcon; items: { id?: string; label: string; meta: string }[] }[]
}

/* Room summary card for the Rooms collection grid. */
export type RoomCard = { slug: string; name: string; count: number }

export const tintClasses: Record<string, string> = {
  sage: 'bg-sage/15 text-sage-foreground',
  navy: 'bg-primary/10 text-primary',
  wood: 'bg-wood/20 text-wood-foreground',
}

/* --------------------------------- helpers -------------------------------- */

function titleCase(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

/** "Mar 2026" for timeline-ish labels; '' for null/invalid. */
function fmtDate(d: string | null | undefined): string {
  if (!d) return ''
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function yearOf(d: string | null | undefined): string {
  if (!d) return ''
  const date = new Date(d)
  return Number.isNaN(date.getTime()) ? '' : String(date.getFullYear())
}

const statusTones: Record<string, 'good' | 'attention' | 'neutral'> = {
  good: 'good',
  healthy: 'good',
  excellent: 'good',
  active: 'good',
  attention: 'attention',
  watch: 'attention',
  warning: 'attention',
  plan: 'attention',
}

function statusBadge(status: string | null): LibraryItem['status'] {
  if (!status) return undefined
  return { label: titleCase(status), tone: statusTones[status.toLowerCase()] ?? 'neutral' }
}

function lifespanFrom(item: ItemRow): LibraryItem['lifespan'] {
  if (!item.installed_on || !item.lifespan_years) return undefined
  const installed = new Date(item.installed_on).getFullYear()
  if (Number.isNaN(installed)) return undefined
  const expectedMax = installed + item.lifespan_years
  // ponytail: replacement window = last 3 years of expected life; tune when we track real degradation.
  const expectedMin = installed + Math.max(1, item.lifespan_years - 3)
  return { installed, expectedMin, expectedMax }
}

/* -------------------------------- adapters -------------------------------- */

export function rowToItemCard(item: ItemRow): ItemCard {
  const m = catMeta(item.category)
  return { id: item.id, name: item.name, icon: m.icon, category: m.label, tint: m.tint, summary: item.summary ?? '' }
}

/** A file row paired with its (already resolved) signed URL, if any. */
export type FileWithUrl = { file: FileRow; url: string | null }

export function fileRowToLibraryFile(
  f: FileRow,
  opts: { url?: string | null; itemName?: string | null } = {},
): LibraryFile {
  const m = fileTypeMeta[f.type] ?? fileTypeMeta.document
  return {
    id: f.id,
    name: f.name,
    type: m.lib,
    typeLabel: m.label,
    meta: opts.itemName || m.label,
    date: fmtDate(f.taken_at ?? f.created_at),
    order: new Date(f.created_at).getTime() || 0,
    itemId: f.item_id ?? '',
    collection: opts.itemName || m.label,
    preview: m.preview,
    image: m.preview === 'photo' ? opts.url ?? undefined : undefined,
    tint: m.tint,
  }
}

export function itemToLibraryItem(
  item: ItemRow,
  extras: {
    files?: FileWithUrl[]
    events?: CareEventRow[]
    tasks?: CareTaskRow[]
    room?: { slug: string; name: string } | null
  } = {},
): LibraryItem {
  const m = catMeta(item.category)
  const files = extras.files ?? []

  const photos = files
    .filter((f) => f.file.type === 'photo')
    .map((f) => ({ src: f.url ?? undefined, label: f.file.name }))

  const documents = files
    .filter((f) => f.file.type === 'document' || f.file.type === 'manual' || f.file.type === 'warranty')
    .map((f) => ({
      label: f.file.name,
      meta: (fileTypeMeta[f.file.type] ?? fileTypeMeta.document).label,
      icon: (fileTypeMeta[f.file.type] ?? fileTypeMeta.document).icon,
      href: f.url ?? undefined,
    }))

  const receipts = files
    .filter((f) => f.file.type === 'receipt')
    .map((f) => ({
      label: f.file.name,
      meta: fmtDate(f.file.taken_at ?? f.file.created_at) || 'Receipt',
      href: f.url ?? undefined,
    }))

  const colFacts: ItemField[] = []
  if (item.installed_on) colFacts.push({ label: 'Installed', value: yearOf(item.installed_on) })
  if (item.manufacturer) colFacts.push({ label: 'Manufacturer', value: item.manufacturer })
  if (item.model) colFacts.push({ label: 'Model', value: item.model })
  if (item.serial) colFacts.push({ label: 'Serial number', value: item.serial })
  if (item.lifespan_years) colFacts.push({ label: 'Expected life', value: `${item.lifespan_years} years` })
  const jsonFacts = Array.isArray(item.facts) ? (item.facts as unknown as ItemField[]) : []
  const facts = [...colFacts, ...jsonFacts]

  const know = Array.isArray(item.knowledge) ? (item.knowledge as unknown as string[]) : []
  const knowledge = know
    .filter((k) => typeof k === 'string' && k.trim())
    .map((k) => ({ label: k, meta: 'Note', icon: Lightbulb }))

  // Maintenance history = past care events + completed care tasks, newest first.
  const history: { date: string; title: string; by?: string; sort: string }[] = [
    ...(extras.events ?? []).map((e) => ({
      date: fmtDate(e.occurred_on),
      title: e.title,
      by: e.note ?? undefined,
      sort: e.occurred_on,
    })),
    ...(extras.tasks ?? [])
      .filter((t) => t.completed_at)
      .map((t) => ({ date: fmtDate(t.completed_at), title: t.title, by: undefined, sort: t.completed_at as string })),
  ]
  const maintenance = history
    .sort((a, b) => (b.sort ?? '').localeCompare(a.sort ?? ''))
    .map((m) => ({ date: m.date, title: m.title, by: m.by }))

  const noun = item.name.toLowerCase()
  const questions = [
    `When was the ${noun} installed?`,
    `What's the maintenance history for the ${noun}?`,
    `What should I know about the ${noun}?`,
  ]

  return {
    id: item.id,
    name: item.name,
    icon: iconFor(m.icon),
    category: m.label,
    tint: m.tint,
    summary: item.summary ?? '',
    status: statusBadge(item.status),
    lifespan: lifespanFrom(item),
    heroPhoto: photos.find((p) => p.src)?.src,
    facts,
    documents,
    receipts,
    photos,
    maintenance,
    knowledge,
    questions,
    roomRef: extras.room ?? undefined,
  }
}

/**
 * Collections grid for the Library home: one card per item category that has
 * content, plus Rooms when any exist. Only navigable collections are included.
 */
export function buildCollections(
  items: Pick<ItemRow, 'category'>[],
  roomCount: number,
): Collection[] {
  const byCat = new Map<string, number>()
  for (const it of items) byCat.set(it.category, (byCat.get(it.category) ?? 0) + 1)

  const out: Collection[] = []
  for (const cat of Object.keys(categoryMeta)) {
    const n = byCat.get(cat) ?? 0
    if (n === 0) continue
    const key = categoryMeta[cat].collection
    const cm = collectionMeta[key]
    out.push({ key, label: cm.label, icon: cm.icon, count: n, tint: cm.tint, preview: [] })
  }
  if (roomCount > 0) {
    const cm = collectionMeta.rooms
    out.push({ key: 'rooms', label: cm.label, icon: cm.icon, count: roomCount, tint: cm.tint, preview: [] })
  }
  return out
}

/** Build a Room view (items grouped by category) from real rows. */
export function itemsToRoom(room: RoomRow, items: ItemRow[]): Room {
  const byCat = new Map<string, ItemRow[]>()
  for (const it of items) {
    const arr = byCat.get(it.category) ?? []
    arr.push(it)
    byCat.set(it.category, arr)
  }
  const groups = [...byCat.entries()].map(([cat, its]) => {
    const m = catMeta(cat)
    return {
      label: its.length === 1 ? m.label : `${m.label}s`,
      icon: iconFor(m.icon),
      items: its.map((it) => ({
        id: it.id,
        label: it.name,
        meta: [it.manufacturer, it.model].filter(Boolean).join(' ') || it.summary || m.label,
      })),
    }
  })
  return {
    slug: room.slug,
    name: room.name,
    summary: room.summary ?? `Everything connected to your ${room.name.toLowerCase()}.`,
    groups,
  }
}

/** Recent items → "discovery" cards for the Library home. */
export function recentItemsToObservations(items: ItemRow[]): LivingObservation[] {
  return items.map((it) => {
    const m = catMeta(it.category)
    return {
      id: it.id,
      icon: m.icon,
      text: it.summary?.trim() ? it.summary : `${it.name} is in your library.`,
      action: 'View',
      href: `/library/item/${it.id}`,
      tint: m.tint,
    }
  })
}

/**
 * Transparent "how much of your home I understand" heuristic.
 * ponytail: 8 pts per item + 4 per file, capped at 98 — no model, just
 * "more captured = better understood". Swap when a real signal exists.
 */
export function understandingPct(itemCount: number, fileCount: number): number | null {
  if (itemCount + fileCount === 0) return null
  return null
}
