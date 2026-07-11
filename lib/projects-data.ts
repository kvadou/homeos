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
} from 'lucide-react'

export type Tone = 'sage' | 'wood' | 'navy'

/* ------------------------------- Hero ------------------------------- */

export const heroSummary = {
  active: 3,
  completed: 4,
  invested: 67000,
  /* The one-line AI narrative — references real projects and connects current
     work → next recommendation → overall investment. */
  aiSummary:
    'Your basement project is halfway complete and your backyard is nearly finished. Over the past five years you\u2019ve invested approximately $67K into your home. HomeOS recommends planning for a water heater replacement around 2027.',
}

/* --------------------------- Active Projects --------------------------- */

export type ProjectStatus = 'In progress' | 'Planning' | 'Scheduled' | 'On hold'

export type ActiveProject = {
  id: string
  name: string
  icon: LucideIcon
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

export const activeProjects: ActiveProject[] = [
  {
    id: 'basement-finish',
    name: 'Basement Finish',
    icon: Layers,
    tone: 'wood',
    status: 'In progress',
    progress: 45,
    summary: 'Turning the unfinished basement into a family room, guest suite, and storage.',
    budget: '$38,000',
    spent: '$17,100',
    nextMilestone: 'Framing inspection',
    nextWhen: 'Next week',
    contractor: 'Birchwood Builders',
    started: 'May 2026',
    targetEnd: 'Sep 2026',
    image: '/projects/basement.png',
    imageAlt: 'Basement mid-framing progress photo',
  },
  {
    id: 'backyard-landscaping',
    name: 'Backyard Landscaping',
    icon: Trees,
    tone: 'sage',
    status: 'In progress',
    progress: 70,
    summary: 'New native plantings, a stone path, and a level lawn for the kids.',
    budget: '$12,500',
    spent: '$8,750',
    nextMilestone: 'Sod & final grading',
    nextWhen: 'This weekend',
    contractor: 'Green Valley Landscapes',
    started: 'Apr 2026',
    targetEnd: 'Jul 2026',
    image: '/projects/backyard.png',
    imageAlt: 'Backyard landscaping progress photo',
  },
  {
    id: 'bathroom-refresh',
    name: 'Primary Bath Refresh',
    icon: Bath,
    tone: 'navy',
    status: 'Planning',
    progress: 15,
    summary: 'Updating fixtures, tile, and vanity while keeping the existing footprint.',
    budget: '$9,800',
    spent: '$0',
    nextMilestone: 'Finalize tile selection',
    nextWhen: 'Aug 2026',
    contractor: undefined,
    started: 'Quote stage',
    targetEnd: 'Late 2026',
    image: '/projects/bathroom.png',
    imageAlt: 'Bathroom tile inspiration',
  },
]

/* ------------------------- Recommended Projects ------------------------- */

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
  icon: LucideIcon
  cost: string
  basis: RecommendationBasis
  timing: string
  /* A conversational "Why now?" — a short paragraph, not clipped bullets. */
  whyNow: string
  benefits: string[]
  /* Soft, low-pressure CTA — not every card should feel like a purchase. */
  cta: 'Start Planning' | 'Explore Project' | 'Learn More' | 'Save for Later'
}

export const recommendedProjects: RecommendedProject[] = [
  {
    id: 'water-heater',
    name: 'Replace Water Heater',
    icon: Flame,
    cost: '$1,600 – $2,400',
    basis: 'Based on system age',
    timing: 'Best before winter 2027',
    whyNow:
      'Your water heater is entering the last quarter of its expected lifespan. Replacing it proactively greatly reduces the chance of an unexpected winter failure — and lets you do it calmly, on your own schedule.',
    benefits: [
      'Avoids an unexpected cold-water failure.',
      'Lets you schedule the work calmly, not urgently.',
      'Keeps a core system current for resale.',
    ],
    cta: 'Start Planning',
  },
  {
    id: 'attic-insulation',
    name: 'Upgrade Attic Insulation',
    icon: Wind,
    cost: '$2,000 – $2,600',
    basis: 'Based on your climate',
    timing: 'Ideally before winter',
    whyNow:
      'Homes built around 2005 often have less attic insulation than today\u2019s standards, and Minnesota winters make that heat loss expensive. Topping it up now is one of the highest-return improvements you can make before the cold sets in.',
    benefits: [
      'Lower heating costs — an estimated ~$380/year.',
      'More even, comfortable temperatures upstairs.',
      'One of the highest-return improvements available to you.',
    ],
    cta: 'Explore Project',
  },
  {
    id: 'exterior-repaint',
    name: 'Repaint Exterior Trim',
    icon: PaintRoller,
    cost: '$4,500 – $6,000',
    basis: 'Based on maintenance history',
    timing: 'Plan for 2028',
    whyNow:
      'It\u2019s been about eight years since your trim was last painted. There\u2019s no rush, but refreshing it in the next couple of years will protect the fiber-cement siding underneath and keep the exterior looking sharp.',
    benefits: [
      'Protects siding from moisture and wear.',
      'Noticeably improves curb appeal.',
    ],
    cta: 'Save for Later',
  },
]

/* ------------------------- Investment Outlook ------------------------- */

/* All figures here are estimates — the UI must label them as such and never
   imply guaranteed returns. */
export const investmentOutlook = {
  totalInvested: '$67,000',
  valueAdded: '+$81,000',
  fiveYearNeeds: '$10,400',
  monthlyReserve: '$175',
  insight:
    'Your completed improvements are estimated to have added more value than they cost. The next several years are focused on system replacements rather than large renovations, so a modest monthly reserve should keep you comfortably ahead.',
}

/* ---------------------------- Home Timeline ---------------------------- */

export type TimelineEntry = {
  id: string
  year: number
  title: string
  detail: string
  icon: LucideIcon
  kind: 'built' | 'major' | 'system' | 'future'
}

export const homeTimeline: TimelineEntry[] = [
  {
    id: 'built',
    year: 2005,
    title: 'Home built',
    detail: 'Willow Lane completed — poured foundation, 200-amp electrical.',
    icon: Home,
    kind: 'built',
  },
  {
    id: 'water-heater-install',
    year: 2015,
    title: 'Water heater installed',
    detail: 'AO Smith ProLine XE 50-gallon gas unit.',
    icon: Flame,
    kind: 'system',
  },
  {
    id: 'roof',
    year: 2016,
    title: 'Roof replaced',
    detail: 'Architectural shingles, rated for 25–30 years.',
    icon: Home,
    kind: 'major',
  },
  {
    id: 'hvac',
    year: 2019,
    title: 'HVAC installed',
    detail: 'Carrier furnace & AC by Comfort Air.',
    icon: Wind,
    kind: 'system',
  },
  {
    id: 'electrical',
    year: 2023,
    title: 'Electrical panel updated',
    detail: 'Breakers modernized to handle household load.',
    icon: Zap,
    kind: 'system',
  },
  {
    id: 'kitchen',
    year: 2025,
    title: 'Kitchen remodeled',
    detail: 'New cabinets, quartz counters, and appliances — a $41,200 transformation.',
    icon: ChefHat,
    kind: 'major',
  },
  {
    id: 'water-heater-future',
    year: 2027,
    title: 'Water heater replacement',
    detail: 'Recommended — budget $1,600–$2,400.',
    icon: Flame,
    kind: 'future',
  },
  {
    id: 'exterior-future',
    year: 2028,
    title: 'Exterior repaint',
    detail: 'Recommended — refresh trim and protect siding.',
    icon: PaintRoller,
    kind: 'future',
  },
]

/* ------------------------------- Ideas ------------------------------- */

export type Idea = {
  id: string
  title: string
  category: string
  roughCost: string
  note: string
  icon: LucideIcon
}

export const ideas: Idea[] = [
  { id: 'outdoor-lighting', title: 'Outdoor Lighting', category: 'Exterior', roughCost: '$1,500', note: 'Path and facade lighting for the front walk.', icon: Lightbulb },
  { id: 'patio', title: 'Stone Patio', category: 'Outdoor living', roughCost: '$8,000', note: 'Off the kitchen — pairs well with the backyard work.', icon: Sun },
  { id: 'ev-charger', title: 'EV Charger', category: 'Garage', roughCost: '$1,200', note: 'Level 2 charger; panel already has capacity.', icon: Plug },
  { id: 'mudroom', title: 'Mudroom Lockers', category: 'Entry', roughCost: '$2,400', note: 'Built-in cubbies by the side door.', icon: Warehouse },
  { id: 'built-ins', title: 'Living Room Built-ins', category: 'Interior', roughCost: '$3,600', note: 'Shelving flanking the fireplace.', icon: Armchair },
  { id: 'garden-beds', title: 'Raised Garden Beds', category: 'Backyard', roughCost: '$900', note: 'Cedar beds for vegetables and herbs.', icon: Sprout },
]

/* -------------------------- Completed Projects -------------------------- */

export type CompletedProject = {
  id: string
  name: string
  year: number
  cost: string
  /* Estimated value added — clearly an estimate in the UI. */
  valueAdded: string
  icon: LucideIcon
  tone: Tone
  summary: string
  contractor: string
  records: number
  image: string
  imageAlt: string
}

export const completedProjects: CompletedProject[] = [
  {
    id: 'kitchen-remodel',
    name: 'Kitchen Remodel',
    year: 2025,
    cost: '$41,200',
    valueAdded: '+$52,000',
    icon: ChefHat,
    tone: 'wood',
    summary: 'A full transformation — Shaker cabinets, quartz counters, and new appliances.',
    contractor: 'Prairie Creek Builders',
    records: 12,
    image: '/rooms/kitchen.png',
    imageAlt: 'Remodeled kitchen with Shaker cabinets and quartz counters',
  },
  {
    id: 'electrical-update',
    name: 'Electrical Panel Update',
    year: 2023,
    cost: '$3,200',
    valueAdded: '+$4,000',
    icon: Zap,
    tone: 'navy',
    summary: 'Modernized breakers to comfortably handle the household load.',
    contractor: 'Bright Spark Electric',
    records: 4,
    image: '/projects/electrical.png',
    imageAlt: 'Modern labeled electrical breaker panel',
  },
  {
    id: 'hvac-install',
    name: 'HVAC Installation',
    year: 2019,
    cost: '$8,500',
    valueAdded: '+$9,500',
    icon: Wind,
    tone: 'sage',
    summary: 'New Carrier furnace and AC, still under warranty through 2029.',
    contractor: 'Comfort Air',
    records: 6,
    image: '/projects/hvac.png',
    imageAlt: 'New high-efficiency furnace in a clean utility room',
  },
  {
    id: 'roof-replacement',
    name: 'Roof Replacement',
    year: 2016,
    cost: '$13,900',
    valueAdded: '+$15,500',
    icon: Home,
    tone: 'wood',
    summary: 'Architectural shingles rated for 25–30 years. No leaks since.',
    contractor: 'Summit Roofing',
    records: 5,
    image: '/projects/roof.png',
    imageAlt: 'House with a newly replaced architectural shingle roof',
  },
]

/* -------------------------- Recently Finished -------------------------- */

/* Fresh wins — the small, satisfying milestones checked off in the last few
   weeks. Distinct from the lifetime archive: this is momentum, not history. */
export type RecentWin = {
  id: string
  title: string
  project: string
  when: string
}

export const recentlyFinished: RecentWin[] = [
  { id: 'w1', title: 'Basement electrical inspection passed', project: 'Basement Finishing', when: '2 days ago' },
  { id: 'w2', title: 'New sod laid across the backyard', project: 'Backyard Landscaping', when: '5 days ago' },
  { id: 'w3', title: 'Kitchen backsplash installed', project: 'Kitchen Refresh', when: '1 week ago' },
  { id: 'w4', title: 'Basement framing completed', project: 'Basement Finishing', when: '2 weeks ago' },
]

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
