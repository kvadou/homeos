import type { LucideIcon } from 'lucide-react'
import {
  ChefHat,
  Trees,
  Home,
  Bath,
  Flame,
  Layers,
  PaintRoller,
  Wind,
  Zap,
  Lightbulb,
  Armchair,
  Plug,
  Warehouse,
  Sprout,
  Sun,
  Hammer,
  Wrench,
  CalendarClock,
  Sparkles,
} from 'lucide-react'
import type { Database, Json } from '@/lib/supabase/database.types'

export type Tone = 'sage' | 'wood' | 'navy'

/* --------------------------- DB row shapes --------------------------- */

export type ProjectRow = Database['public']['Tables']['projects']['Row']
export type TimelineRow = Database['public']['Tables']['timeline_events']['Row']
/* projects.select('*, contractor:contractors(name)') */
export type ProjectWithContractor = ProjectRow & { contractor: { name: string } | null }

/* ------------------------------- Types ------------------------------- */

export type HeroSummary = {
  active: number
  completed: number
  invested: number
  aiSummary: string
}

export type ProjectStatus = 'In progress' | 'Planning' | 'Scheduled' | 'On hold'

export type ActiveProject = {
  id: string
  name: string
  icon: string // Lucide export name; resolve with iconFor() at render (RSC-safe)
  tone: Tone
  status: ProjectStatus
  progress: number // 0-100
  summary: string
  budget: string
  spent: string
  nextMilestone: string
  nextWhen: string
  contractor?: string
  started: string
  targetEnd: string
  /* Optional thumbnail — a subtle rendering/photo that hints at the project. */
  image?: string
  imageAlt?: string
}

/* A trust-building label explaining what the recommendation is grounded in,
   rather than a generic "High / Medium priority". */
export type RecommendationBasis =
  | 'Based on system age'
  | 'Based on inspection'
  | 'Based on maintenance history'
  | 'Based on your climate'
  | 'Recommended for your home'

export type RecommendedProject = {
  id: string
  name: string
  icon: string // Lucide export name; resolve with iconFor() at render (RSC-safe)
  cost: string
  basis: RecommendationBasis
  timing: string
  /* A conversational "Why now?" — a short paragraph, not clipped bullets. */
  whyNow: string
  benefits: string[]
  /* Soft, low-pressure CTA — not every card should feel like a purchase. */
  cta: 'Start Planning' | 'Explore Project' | 'Learn More' | 'Save for Later'
}

/* All figures here are estimates — the UI must label them as such and never
   imply guaranteed returns. */
export type InvestmentOutlook = {
  totalInvested: string
  valueAdded: string
  fiveYearNeeds: string
  monthlyReserve: string
  insight: string
  /* Raw figures so the comparison bars can be drawn to scale. */
  investedNum: number
  valueAddedNum: number
}

export type TimelineEntry = {
  id: string
  year: number
  title: string
  detail: string
  icon: string // Lucide export name; resolve with iconFor() at render (RSC-safe)
  kind: 'built' | 'major' | 'system' | 'future'
}

export type Idea = {
  id: string
  title: string
  category: string
  roughCost: string
  note: string
  icon: string // Lucide export name; resolve with iconFor() at render (RSC-safe)
}

export type CompletedProject = {
  id: string
  name: string
  year: number
  cost: string
  /* Estimated value added — clearly an estimate in the UI. */
  valueAdded: string
  icon: string // Lucide export name; resolve with iconFor() at render (RSC-safe)
  tone: Tone
  summary: string
  contractor: string
  records: number
  image: string
  imageAlt: string
}

/* Fresh wins — the small, satisfying milestones checked off recently. */
export type RecentWin = {
  id: string
  title: string
  project: string
  when: string
}

export type ProjectsView = {
  hero: HeroSummary
  active: ActiveProject[]
  recommended: RecommendedProject[]
  outlook: InvestmentOutlook
  timeline: TimelineEntry[]
  ideas: Idea[]
  completed: CompletedProject[]
  recentWins: RecentWin[]
}

/* ---------------------------- Formatters ---------------------------- */

export function money(n: number | null | undefined): string {
  return n == null ? '—' : '$' + Math.round(n).toLocaleString('en-US')
}
function plusMoney(n: number | null | undefined): string {
  return n == null ? '—' : '+$' + Math.round(n).toLocaleString('en-US')
}
export function compact(n: number): string {
  return n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${Math.round(n)}`
}
export function plusCompact(n: number): string {
  return n >= 1000 ? `+$${Math.round(n / 1000)}K` : `+$${Math.round(n)}`
}
function monthYear(date: string | null): string | undefined {
  if (!date) return undefined
  const d = new Date(`${date}T00:00:00`)
  return Number.isNaN(d.getTime())
    ? undefined
    : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

/* ------------------------- Icon resolution ------------------------- */

/* metadata.icon stores a Lucide export name; resolve it back to a component. */
const iconRegistry: Record<string, LucideIcon> = {
  ChefHat, Trees, Home, Bath, Flame, Layers, PaintRoller, Wind, Zap,
  Lightbulb, Armchair, Plug, Warehouse, Sprout, Sun, Hammer, Wrench,
  CalendarClock, Sparkles,
}
export function iconFor(name: unknown, fallback: LucideIcon = Hammer): LucideIcon {
  return (typeof name === 'string' && iconRegistry[name]) || fallback
}

/* --------------------------- metadata reads --------------------------- */

type Meta = Record<string, unknown>
function meta(m: Json | null): Meta {
  return m && typeof m === 'object' && !Array.isArray(m) ? (m as Meta) : {}
}
function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined
}
function num(v: unknown): number | undefined {
  return typeof v === 'number' ? v : undefined
}
function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}
function toneOf(v: unknown): Tone {
  return v === 'sage' || v === 'wood' || v === 'navy' ? v : 'navy'
}
const STATUSES: ProjectStatus[] = ['In progress', 'Planning', 'Scheduled', 'On hold']
function statusOf(v: unknown, fallback: ProjectStatus): ProjectStatus {
  return STATUSES.includes(v as ProjectStatus) ? (v as ProjectStatus) : fallback
}
/* ponytail: pull the low end out of a range string like "$1,600 – $2,400". */
function parseLow(v: unknown): number | undefined {
  if (typeof v !== 'string') return undefined
  const m = v.match(/[\d,]+/)
  return m ? Number(m[0].replace(/,/g, '')) : undefined
}

/* ------------------------------ Adapters ------------------------------ */

function toActive(p: ProjectWithContractor): ActiveProject {
  const m = meta(p.metadata)
  return {
    id: p.id,
    name: p.name,
    icon: str(m.icon) ?? 'Layers',
    tone: toneOf(m.tone),
    status: statusOf(p.status, 'In progress'),
    progress: p.progress ?? 0,
    summary: p.summary ?? '',
    budget: money(p.budget),
    spent: money(p.spent ?? 0),
    nextMilestone: str(m.nextMilestone) ?? 'Next milestone to be set',
    nextWhen: str(m.nextWhen) ?? 'TBD',
    contractor: p.contractor?.name,
    started: str(m.startedLabel) ?? monthYear(p.started_on) ?? 'Not started',
    targetEnd: str(m.targetEndLabel) ?? monthYear(p.target_end) ?? 'TBD',
    image: str(m.image),
    imageAlt: str(m.imageAlt),
  }
}

function toRecommended(p: ProjectWithContractor): RecommendedProject {
  const m = meta(p.metadata)
  return {
    id: p.id,
    name: p.name,
    icon: str(m.icon) ?? 'Sparkles',
    cost: str(m.cost) ?? money(p.cost),
    basis: (str(m.basis) as RecommendationBasis) ?? 'Recommended for your home',
    timing: str(m.timing) ?? '',
    whyNow: str(m.whyNow) ?? p.summary ?? '',
    benefits: strArr(m.benefits),
    cta: (str(m.cta) as RecommendedProject['cta']) ?? 'Learn More',
  }
}

function toIdea(p: ProjectWithContractor): Idea {
  const m = meta(p.metadata)
  return {
    id: p.id,
    title: p.name,
    category: str(m.category) ?? 'Idea',
    roughCost: str(m.roughCost) ?? money(p.budget ?? p.cost),
    note: p.summary ?? str(m.note) ?? '',
    icon: str(m.icon) ?? 'Lightbulb',
  }
}

function toCompleted(p: ProjectWithContractor): CompletedProject {
  const m = meta(p.metadata)
  return {
    id: p.id,
    name: p.name,
    year: p.completed_year ?? 0,
    cost: money(p.cost),
    valueAdded: plusMoney(p.value_added),
    icon: str(m.icon) ?? 'Hammer',
    tone: toneOf(m.tone),
    summary: p.summary ?? '',
    contractor: p.contractor?.name ?? 'Self',
    records: num(m.records) ?? 0,
    image: str(m.image) ?? '/placeholder.svg',
    imageAlt: str(m.imageAlt) ?? p.name,
  }
}

function toRecentWin(p: ProjectWithContractor): RecentWin {
  return {
    id: p.id,
    title: `${p.name} completed`,
    project: p.contractor?.name ?? 'Wrapped up',
    when: p.completed_year ? String(p.completed_year) : 'Recently',
  }
}

const TIMELINE_KINDS: TimelineEntry['kind'][] = ['built', 'major', 'system', 'future']
const kindIconName: Record<TimelineEntry['kind'], string> = {
  built: 'Home',
  major: 'Hammer',
  system: 'Wrench',
  future: 'Sparkles',
}
function timelineKindOf(v: unknown): TimelineEntry['kind'] {
  return TIMELINE_KINDS.includes(v as TimelineEntry['kind'])
    ? (v as TimelineEntry['kind'])
    : 'system'
}
function eventToTimeline(e: TimelineRow): TimelineEntry {
  const kind = timelineKindOf(e.kind)
  return {
    id: e.id,
    year: e.year,
    title: e.title,
    detail: e.detail ?? '',
    icon: kindIconName[kind],
    kind,
  }
}
function completedToTimeline(p: CompletedProject): TimelineEntry {
  return { id: `completed-${p.id}`, year: p.year, title: p.name, detail: p.summary, icon: p.icon, kind: 'major' }
}

/* ponytail: templated from counts; swap for a real LLM summary later. */
function buildAiSummary(active: number, completed: number, invested: number): string {
  if (!active && !completed) {
    return 'No projects yet — add one to start tracking how your home evolves.'
  }
  const parts: string[] = []
  if (active) parts.push(`${active} project${active === 1 ? '' : 's'} underway`)
  if (completed) parts.push(`${completed} completed`)
  const invStr = invested > 0 ? ` You’ve invested about ${money(invested)} in your home so far.` : ''
  return `You have ${parts.join(' and ')}.${invStr}`
}

/* ---------------------------- View builder ---------------------------- */

export function buildProjectsView(
  projects: ProjectWithContractor[],
  events: TimelineRow[],
): ProjectsView {
  const activeRows = projects.filter((p) => p.kind === 'active')
  const recRows = projects.filter((p) => p.kind === 'recommended')
  const ideaRows = projects.filter((p) => p.kind === 'idea')
  const completedRows = projects.filter((p) => p.kind === 'completed')

  const active = activeRows.map(toActive)
  const recommended = recRows.map(toRecommended)
  const ideas = ideaRows.map(toIdea)
  const completed = completedRows
    .map(toCompleted)
    .sort((a, b) => b.year - a.year) // newest first for the archive

  const investedNum =
    activeRows.reduce((s, p) => s + (p.spent ?? 0), 0) +
    completedRows.reduce((s, p) => s + (p.cost ?? 0), 0)
  const valueAddedNum = completedRows.reduce((s, p) => s + (p.value_added ?? 0), 0)
  const fiveYearNum = recRows.reduce(
    (s, p) => s + (parseLow(meta(p.metadata).cost) ?? p.cost ?? 0),
    0,
  )
  const monthlyReserveNum = Math.round(fiveYearNum / 60) // ponytail: upcoming needs / 60 months

  const hero: HeroSummary = {
    active: active.length,
    completed: completed.length,
    invested: investedNum,
    aiSummary: buildAiSummary(active.length, completed.length, investedNum),
  }

  const outlook: InvestmentOutlook = {
    totalInvested: money(investedNum),
    valueAdded: plusMoney(valueAddedNum),
    fiveYearNeeds: money(fiveYearNum),
    monthlyReserve: money(monthlyReserveNum),
    insight:
      valueAddedNum > investedNum
        ? 'Your completed improvements are estimated to have added more value than they cost — turning maintenance into a lasting investment.'
        : 'Your improvements are steadily building long-term value in your home.',
    investedNum,
    valueAddedNum,
  }

  // Completed projects are merged in from the projects table, so skip the mirror
  // 'project' events that completeProject inserts to avoid duplicate rows.
  const timeline = [
    ...events.filter((e) => e.kind !== 'project').map(eventToTimeline),
    ...completed.map(completedToTimeline),
  ].sort((a, b) => a.year - b.year)

  const recentWins = completedRows
    .slice()
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 4)
    .map(toRecentWin)

  return { hero, active, recommended, outlook, timeline, ideas, completed, recentWins }
}

/* ------------------------------ Helpers ------------------------------ */

export const toneCover: Record<Tone, string> = {
  sage: 'bg-sage/15 text-sage-foreground',
  wood: 'bg-wood/25 text-wood-foreground',
  navy: 'bg-primary/10 text-primary',
}

export const statusStyle: Record<ProjectStatus, string> = {
  'In progress': 'bg-sage/15 text-sage-foreground',
  Planning: 'bg-wood/25 text-wood-foreground',
  Scheduled: 'bg-primary/10 text-primary',
  'On hold': 'bg-muted text-muted-foreground',
}

export const timelineKindStyle: Record<TimelineEntry['kind'], string> = {
  built: 'bg-primary text-primary-foreground',
  major: 'bg-wood-foreground text-background',
  system: 'bg-sage text-background',
  future: 'bg-card text-muted-foreground ring-2 ring-dashed ring-border',
}
