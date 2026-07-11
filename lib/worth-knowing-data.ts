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

export type Fact = {
  id: string
  category: string
  /* Lucide export name (RSC-safe); resolve with factIcon() in client code. */
  icon: string
  tone: FactTone
  /* The stat that leads the card, if there is one. */
  stat?: string
  headline: string
  detail: string
  /* Where HomeOS drew this from — reinforces "the AI figured this out." */
  basis: string
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

/* Deterministic tone from the category so the grid looks varied but stable
   across renders (insights carry no tone column). */
const TONES: FactTone[] = ['sage', 'wood', 'navy']
function toneFor(s: string): FactTone {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return TONES[h % TONES.length]
}

/** Map an insight row → a Worth Knowing fact card. */
export function insightToFact(row: InsightRow): Fact {
  const key = row.category.toLowerCase()
  return {
    id: row.id,
    category: titleCase(row.category),
    icon: iconByCategory[key] ?? 'Lightbulb',
    tone: toneFor(key),
    stat: row.stat ?? undefined,
    headline: row.headline,
    detail: row.detail ?? '',
    basis: row.basis ?? row.source ?? '',
    action: row.action ? { label: row.action, href: '/ask' } : undefined,
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
