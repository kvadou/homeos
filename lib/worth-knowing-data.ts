import {
  TrendingUp,
  Sun,
  Home,
  Flame,
  Droplets,
  Wallet,
  Paintbrush,
  Mountain,
  Leaf,
  Timer,
  Wind,
  ShieldCheck,
  Wrench,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react'
import type { Database } from '@/lib/supabase/database.types'

export type FactTone = 'sage' | 'wood' | 'navy'
export type FactGroup = 'Care & timing' | 'Money & savings' | 'Home history' | 'Documents'

export type Fact = {
  id: string
  category: string
  /* Lucide export name (RSC-safe); resolve with factIcon() in client code. */
  icon: string
  tone: FactTone
  group: FactGroup
  /* The stat that leads the card, if there is one. */
  stat?: string
  headline: string
  detail: string
  /* Why GatheredOS surfaced this observation. */
  basis: string
  source: string
  confidence?: number
  evidenceCount: number
  createdAt: string
  /* Optional jump to act on the fact elsewhere in the app. Falls back to Ask. */
  action?: { label: string; href: string }
}

type InsightRow = Database['public']['Tables']['insights']['Row']

/* insights.category (lowercase convention) → a leading icon name. */
const iconByCategory: Record<string, string> = {
  hvac: 'Wind',
  warranty: 'ShieldCheck',
  maintenance: 'Wrench',
  cost: 'Wallet',
  spending: 'TrendingUp',
  wealth: 'Wallet',
  equity: 'Wallet',
  longevity: 'Home',
  land: 'Mountain',
  energy: 'Sun',
  water: 'Droplets',
  seasonal: 'Leaf',
  trends: 'Timer',
  paint: 'Paintbrush',
}

function titleCase(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

const careCategories = new Set(['hvac', 'maintenance', 'seasonal', 'water', 'energy'])
const moneyCategories = new Set(['cost', 'spending', 'wealth', 'equity'])
const documentCategories = new Set(['warranty', 'insurance', 'document'])

function groupFor(category: string): FactGroup {
  if (careCategories.has(category)) return 'Care & timing'
  if (moneyCategories.has(category)) return 'Money & savings'
  if (documentCategories.has(category)) return 'Documents'
  return 'Home history'
}

function toneFor(group: FactGroup): FactTone {
  if (group === 'Care & timing') return 'wood'
  if (group === 'Documents') return 'navy'
  return 'sage'
}

function evidenceCount(value: Database['public']['Tables']['insights']['Row']['evidence']): number {
  if (Array.isArray(value)) return value.length
  if (value && typeof value === 'object') return Object.keys(value).length
  return 0
}

function hrefFor(category: string): string {
  if (careCategories.has(category)) return '/care'
  if (moneyCategories.has(category)) return '/forecast'
  if (documentCategories.has(category)) return '/library'
  return '/ask'
}

/** Map an insight row to an evidence-backed Home Intelligence observation. */
export function insightToFact(row: InsightRow): Fact {
  const key = row.category.toLowerCase()
  const group = groupFor(key)
  return {
    id: row.id,
    category: titleCase(row.category),
    icon: iconByCategory[key] ?? 'Lightbulb',
    tone: toneFor(group),
    group,
    stat: row.stat ?? undefined,
    headline: row.headline,
    detail: row.detail ?? '',
    basis: row.basis ?? row.source ?? '',
    source: row.source,
    confidence: row.confidence ?? undefined,
    evidenceCount: evidenceCount(row.evidence),
    createdAt: row.created_at,
    action: row.action ? { label: row.action, href: hrefFor(key) } : undefined,
  }
}

/* Icon registry for the client component (names above resolve here). */
const iconRegistry: Record<string, LucideIcon> = {
  TrendingUp, Sun, Home, Flame, Droplets, Wallet, Paintbrush, Mountain, Leaf,
  Timer, Wind, ShieldCheck, Wrench, Lightbulb,
}
export function factIcon(name: string): LucideIcon {
  return iconRegistry[name] ?? Lightbulb
}

export const factToneStyles: Record<FactTone, { badge: string; icon: string; stat: string }> = {
  sage: {
    badge: 'bg-sage/15 text-sage-foreground',
    icon: 'bg-sage/15 text-sage-foreground',
    stat: 'text-sage-foreground',
  },
  wood: {
    badge: 'bg-wood/20 text-wood-foreground',
    icon: 'bg-wood/25 text-wood-foreground',
    stat: 'text-wood-foreground',
  },
  navy: {
    badge: 'bg-secondary text-secondary-foreground',
    icon: 'bg-secondary text-secondary-foreground',
    stat: 'text-foreground',
  },
}
