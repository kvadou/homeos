import type { LucideIcon } from 'lucide-react'
import {
  Home,
  Building2,
  Warehouse,
  TreePine,
  Palmtree,
  KeyRound,
  Wind,
  Flame,
  Droplet,
  Zap,
  ShowerHead,
  Trees,
  Waves,
  Refrigerator,
  Sun,
  Car,
  Cpu,
  Layers,
  FileText,
  Receipt,
  ShieldCheck,
  BookOpen,
  Image,
  Video,
  StickyNote,
  CalendarCheck,
  FolderOpen,
  PiggyBank,
  Hammer,
  TrendingUp,
  Tag,
  Leaf,
  Brain,
  Building,
  Palette,
} from 'lucide-react'

export const STEP_COUNT = 9

export const stepMeta: { id: number; label: string; optional?: boolean }[] = [
  { id: 1, label: 'Welcome' },
  { id: 2, label: 'Your home' },
  { id: 3, label: 'About the home', optional: true },
  { id: 4, label: 'Systems', optional: true },
  { id: 5, label: 'Documents', optional: true },
  { id: 6, label: 'Knowledge', optional: true },
  { id: 7, label: 'Household', optional: true },
  { id: 8, label: 'Goals', optional: true },
  { id: 9, label: 'Ready' },
]

/* Progress framed as HomeOS accomplishing something, not just advancing forms. */
export const stepPhase: Record<number, string> = {
  1: 'Getting started',
  2: 'Finding your home',
  3: 'Learning your home',
  4: 'Discovering your systems',
  5: 'Building your home’s memory',
  6: 'Remembering what matters',
  7: 'Adding your household',
  8: 'Understanding your goals',
  9: 'Your home is ready',
}

/* ---------- Selectable option sets ---------- */

export type TileOption = { key: string; label: string; icon: LucideIcon; hint?: string }

export const propertyTypes: TileOption[] = [
  { key: 'single-family', label: 'Single-family home', icon: Home },
  { key: 'townhome', label: 'Townhome', icon: Building2 },
  { key: 'condo', label: 'Condo', icon: Building },
  { key: 'cabin', label: 'Cabin', icon: TreePine },
  { key: 'vacation', label: 'Vacation home', icon: Palmtree },
  { key: 'rental', label: 'Rental property', icon: KeyRound },
]

export const homeFeatures: TileOption[] = [
  { key: 'basement', label: 'Basement', icon: Layers },
  { key: 'deck', label: 'Deck', icon: Warehouse },
  { key: 'pool', label: 'Pool', icon: Waves },
  { key: 'irrigation', label: 'Irrigation', icon: Droplet },
  { key: 'fireplace', label: 'Fireplace', icon: Flame },
  { key: 'septic', label: 'Septic', icon: ShowerHead },
  { key: 'well', label: 'Well', icon: Droplet },
  { key: 'generator', label: 'Generator', icon: Zap },
  { key: 'solar', label: 'Solar', icon: Sun },
  { key: 'garage', label: 'Garage', icon: Car },
  { key: 'smart-home', label: 'Smart-home devices', icon: Cpu },
]

export const majorSystems: TileOption[] = [
  { key: 'hvac', label: 'HVAC', icon: Wind },
  { key: 'water-heater', label: 'Water heater', icon: Flame },
  { key: 'roof', label: 'Roof', icon: Home },
  { key: 'plumbing', label: 'Plumbing', icon: Droplet },
  { key: 'electrical', label: 'Electrical', icon: Zap },
  { key: 'irrigation', label: 'Irrigation', icon: Trees },
  { key: 'sump-pump', label: 'Sump pump', icon: Waves },
  { key: 'appliances', label: 'Appliances', icon: Refrigerator },
]

/* Common manufacturers per system, so users tap instead of type. */
export const manufacturerSuggestions: Record<string, string[]> = {
  hvac: ['Carrier', 'Lennox', 'Trane', 'Bryant', 'Rheem'],
  'water-heater': ['Rheem', 'A.O. Smith', 'Bradford White', 'Navien'],
  roof: ['GAF', 'Owens Corning', 'CertainTeed', 'Malarkey'],
  plumbing: ['Kohler', 'Moen', 'Delta', 'American Standard'],
  electrical: ['Square D', 'Eaton', 'Siemens', 'GE'],
  irrigation: ['Rain Bird', 'Hunter', 'Toro', 'Orbit'],
  'sump-pump': ['Zoeller', 'Wayne', 'Liberty', 'Superior'],
  appliances: ['Whirlpool', 'GE', 'Samsung', 'LG', 'Bosch'],
}

export const defaultManufacturers = ['Carrier', 'GE', 'Whirlpool', 'Kohler', 'Rheem']

export const uploadKinds: TileOption[] = [
  { key: 'document', label: 'Document', icon: FileText },
  { key: 'receipt', label: 'Receipt', icon: Receipt },
  { key: 'warranty', label: 'Warranty', icon: ShieldCheck },
  { key: 'manual', label: 'Manual', icon: BookOpen },
  { key: 'photo', label: 'Photo', icon: Image },
  { key: 'video', label: 'Video', icon: Video },
  { key: 'note', label: 'Note', icon: StickyNote },
]

export const uploadExamples: { label: string; icon: LucideIcon }[] = [
  { label: 'Roof warranty', icon: ShieldCheck },
  { label: 'Furnace manual', icon: BookOpen },
  { label: 'Water-shutoff photo', icon: Image },
  { label: 'Paint label', icon: Palette },
  { label: 'Sprinkler walkthrough video', icon: Video },
]

export const knowledgePrompts: { key: string; prompt: string; icon: LucideIcon }[] = [
  { key: 'sprinkler', prompt: 'Who winterizes the sprinkler system?', icon: Trees },
  { key: 'breaker', prompt: 'Which breaker controls the basement?', icon: Zap },
  { key: 'paint', prompt: 'Where are the extra paint cans?', icon: Palette },
  { key: 'garage', prompt: 'How do you reset the garage door?', icon: KeyRound },
]

export const captureMethods: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'note', label: 'Write a note', icon: StickyNote },
  { key: 'photo', label: 'Take a photo', icon: Image },
  { key: 'video', label: 'Record video', icon: Video },
  { key: 'voice', label: 'Voice note', icon: Waves },
]

export type Role = 'Owner' | 'Family Member' | 'Guest'
export const roles: Role[] = ['Owner', 'Family Member', 'Guest']
export const roleHints: Record<Role, string> = {
  Owner: 'Manages everything',
  'Family Member': 'Can add and edit',
  Guest: 'Can view only',
}

/* Ordered by how common each motivation is, most common first. */
export const goals: TileOption[] = [
  { key: 'maintenance', label: 'Stay ahead of maintenance', icon: CalendarCheck },
  { key: 'surprises', label: 'Avoid expensive surprises', icon: PiggyBank },
  { key: 'documents', label: 'Organize documents', icon: FolderOpen },
  { key: 'knowledge', label: 'Preserve household knowledge', icon: Brain },
  { key: 'projects', label: 'Plan home projects', icon: Hammer },
  { key: 'energy', label: 'Improve energy efficiency', icon: Leaf },
  { key: 'roi', label: 'Understand project ROI', icon: TrendingUp },
  { key: 'sell', label: 'Prepare to sell', icon: Tag },
  { key: 'multi', label: 'Manage multiple homes', icon: Building2 },
]

/* ---------- Persisted state ---------- */

export type SystemDetail = {
  key: string
  year?: string
  manufacturer?: string
  nextService?: string
  unsure?: boolean
}

export type Member = { id: string; name: string; email: string; role: Role }

export type KnowledgeEntry = { key: string; method: string }

export type OnboardingData = {
  home: {
    street: string
    city: string
    state: string
    zip: string
    confirmed: boolean
    yearBuilt: string
    sqft: string
    beds: string
    baths: string
    propertyType: string
  }
  homeType: string
  features: string[]
  systems: SystemDetail[]
  uploads: { name: string; kind: string }[]
  knowledge: KnowledgeEntry[]
  members: Member[]
  goals: string[]
}

export const emptyOnboarding: OnboardingData = {
  home: {
    street: '',
    city: '',
    state: '',
    zip: '',
    confirmed: false,
    yearBuilt: '',
    sqft: '',
    beds: '',
    baths: '',
    propertyType: '',
  },
  homeType: '',
  features: [],
  systems: [],
  uploads: [],
  knowledge: [],
  members: [],
  goals: [],
}

/* Friendly short name for a home, e.g. "42 Willow Lane" -> "Willow Lane".
   Strips a leading house number so copy can say "We found Willow Lane." */
export function homeShortName(street: string): string {
  const trimmed = street.trim()
  if (!trimmed) return 'your home'
  const withoutNumber = trimmed.replace(/^\d+\s+/, '')
  return withoutNumber || trimmed
}

/* Mock property lookup — simulates address autocomplete + public records. */
export const sampleProperty = {
  yearBuilt: '1998',
  sqft: '2,450',
  beds: '4',
  baths: '2.5',
  propertyType: 'single-family',
}

const STORAGE_KEY = 'homeos_onboarding_v1'
const STEP_KEY = 'homeos_onboarding_step_v1'

export function loadOnboarding(): { data: OnboardingData; step: number } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const step = window.localStorage.getItem(STEP_KEY)
    if (!raw) return null
    return { data: { ...emptyOnboarding, ...JSON.parse(raw) }, step: step ? Number(step) : 1 }
  } catch {
    return null
  }
}

export function saveOnboarding(data: OnboardingData, step: number) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    window.localStorage.setItem(STEP_KEY, String(step))
  } catch {
    /* ignore quota errors */
  }
}

export function clearOnboarding() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
  window.localStorage.removeItem(STEP_KEY)
}
