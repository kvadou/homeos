import type { LucideIcon } from 'lucide-react'
import {
  Wind,
  Home,
  Droplet,
  Zap,
  Flame,
  Blocks,
  PaintRoller,
  ShieldCheck,
  Bell,
  Wrench,
  Snowflake,
  Sun,
  Leaf,
  Sprout,
  CloudRain,
  FileText,
  CalendarClock,
} from 'lucide-react'

/* ---------------------------------------------------------------------------
   Care data — the operational heart of HomeOS. Everything here is written to
   answer one question calmly: "What does my home need right now?" The tone is
   an advisor, never a checklist that induces guilt.
--------------------------------------------------------------------------- */

export type Health = 'excellent' | 'good' | 'watch' | 'plan'

export const healthLabel: Record<Health, string> = {
  excellent: 'Excellent',
  good: 'Good',
  watch: 'Keep an eye on it',
  plan: 'Plan ahead',
}

/* Tone tints reused across the Care surface. */
export const healthTint: Record<Health, string> = {
  excellent: 'bg-sage/15 text-sage-foreground',
  good: 'bg-sage/15 text-sage-foreground',
  watch: 'bg-wood/20 text-wood-foreground',
  plan: 'bg-wood/20 text-wood-foreground',
}

export const healthDot: Record<Health, string> = {
  excellent: 'bg-sage',
  good: 'bg-sage',
  watch: 'bg-wood-foreground',
  plan: 'bg-wood-foreground',
}

/* ----------------------------- Activity Feed ----------------------------- */

/* A quiet, living signal that HomeOS is watching the house between visits.
   Small and calm — never noisy. */
export type Activity = {
  id: string
  icon: LucideIcon
  text: string
  when: string
  tone?: 'sage' | 'wood'
}

export const activityFeed: Activity[] = [
  {
    id: 'reschedule',
    icon: CalendarClock,
    text: 'Heavy rain is expected Friday, so I moved deck resealing to next week.',
    when: '2h ago',
    tone: 'wood',
  },
  {
    id: 'watering',
    icon: CloudRain,
    text: 'The forecast has rain this weekend \u2014 no need to water the yard.',
    when: 'Yesterday',
    tone: 'sage',
  },
  {
    id: 'warranty',
    icon: ShieldCheck,
    text: 'Noted your Comfort Air furnace warranty expires in 18 months \u2014 still well covered.',
    when: 'Yesterday',
    tone: 'sage',
  },
  {
    id: 'invoice',
    icon: FileText,
    text: 'Filed your latest plumbing invoice from John\u2019s Plumbing into the Library.',
    when: '2 days ago',
    tone: 'sage',
  },
]

/* ----------------------------- This Week ----------------------------- */

export type WeekTask = {
  id: string
  title: string
  time: string
  why: string
  system: string
  priority: 'highest' | 'normal'
}

export const thisWeek: WeekTask[] = [
  {
    id: 'filter',
    title: 'Replace the HVAC filter',
    time: '15 min',
    system: 'HVAC',
    priority: 'highest',
    why: 'It has been running hard through the summer heat. A fresh filter keeps the air clean and can trim up to 8% off this month\u2019s cooling bill.',
  },
  {
    id: 'gutters',
    title: 'Clear the gutters',
    time: '45 min',
    system: 'Exterior',
    priority: 'normal',
    why: 'Late-summer storms are common in your area. Clear gutters now so the first heavy rain drains away from the foundation instead of pooling.',
  },
  {
    id: 'extinguisher',
    title: 'Replace the kitchen fire extinguisher',
    time: '10 min',
    system: 'Safety',
    priority: 'normal',
    why: 'Yours reaches its expiration next month. Swapping it early keeps your kitchen protected with zero gap in coverage.',
  },
]

/* ----------------------------- Home Systems ----------------------------- */

export type SystemFact = { label: string; value: string; tone?: 'good' | 'attention' }

export type System = {
  id: string
  name: string
  icon: LucideIcon
  health: Health
  /* A single headline figure so each system leads with what matters most about
     it — efficiency, age, life remaining, or a status word — instead of every
     card repeating the same layout. */
  metric: string
  metricSub: string
  summary: string
  /* Two supporting facts, chosen per system to add variety. */
  facts: SystemFact[]
  nextAction: string
  nextWhen: string
  lastService: string
  installed: number
  lifespanEnd: number
  lifespanLabel: string
  /* Whether the age/lifespan bar is the meaningful view for this system.
     Monitoring-only systems (plumbing, electrical, foundation) hide it. */
  showLifespan: boolean
  /* Deep-link into the Library entry for this system. */
  href: string
}

export const systems: System[] = [
  {
    id: 'hvac',
    name: 'HVAC',
    icon: Wind,
    health: 'excellent',
    metric: '92%',
    metricSub: 'Running efficiently',
    summary: 'Cooling well this summer. Serviced every fall by Comfort Air.',
    facts: [
      { label: 'Warranty', value: 'Active to 2029', tone: 'good' },
      { label: 'Next tune-up', value: 'Nov 2026' },
    ],
    nextAction: 'Annual tune-up',
    nextWhen: 'Nov 2026',
    lastService: 'Nov 2025',
    installed: 2019,
    lifespanEnd: 2039,
    lifespanLabel: '15\u201320 yrs',
    showLifespan: false,
    href: '/library/item/furnace',
  },
  {
    id: 'roof',
    name: 'Roof',
    icon: Home,
    health: 'good',
    metric: '65%',
    metricSub: 'Life remaining',
    summary: 'Architectural shingles in good condition. No leaks on record.',
    facts: [
      { label: 'Last inspected', value: 'Apr 2024' },
      { label: 'Leaks on record', value: 'None', tone: 'good' },
    ],
    nextAction: 'Routine inspection',
    nextWhen: '2028',
    lastService: 'Apr 2024',
    installed: 2016,
    lifespanEnd: 2046,
    lifespanLabel: '25\u201330 yrs',
    showLifespan: true,
    href: '/library/item/roof',
  },
  {
    id: 'plumbing',
    name: 'Plumbing',
    icon: Droplet,
    health: 'good',
    metric: 'No leaks',
    metricSub: 'Copper lines, healthy',
    summary: 'Copper supply lines, no leaks. Main shutoff tested and accessible.',
    facts: [
      { label: 'Main shutoff', value: 'Tested Mar 2026', tone: 'good' },
      { label: 'Status', value: 'Monitoring only' },
    ],
    nextAction: 'No action needed',
    nextWhen: 'Monitoring',
    lastService: 'Mar 2026',
    installed: 2005,
    lifespanEnd: 2055,
    lifespanLabel: '50+ yrs',
    showLifespan: false,
    href: '/library/item/water-shutoff',
  },
  {
    id: 'electrical',
    name: 'Electrical',
    icon: Zap,
    health: 'good',
    metric: '200A',
    metricSub: 'Panel capacity',
    summary: '200-amp panel, updated breakers. Handles your household load easily.',
    facts: [
      { label: 'Breakers', value: 'Updated 2023' },
      { label: 'Household load', value: 'Comfortable', tone: 'good' },
    ],
    nextAction: 'No action needed',
    nextWhen: 'Monitoring',
    lastService: 'Sep 2023',
    installed: 2005,
    lifespanEnd: 2045,
    lifespanLabel: '40+ yrs',
    showLifespan: false,
    href: '/library/item/basement-breaker',
  },
  {
    id: 'water-heater',
    name: 'Water Heater',
    icon: Flame,
    health: 'watch',
    metric: '11 yrs',
    metricSub: 'About 4 years of life left',
    summary: 'Well maintained, but 11 years old and entering its final stretch.',
    facts: [
      { label: 'Recommendation', value: 'Budget replacement', tone: 'attention' },
      { label: 'Last flushed', value: 'Mar 2026' },
    ],
    nextAction: 'Budget for replacement',
    nextWhen: '2027\u20132028',
    lastService: 'Mar 2026',
    installed: 2015,
    lifespanEnd: 2030,
    lifespanLabel: '12\u201315 yrs',
    showLifespan: true,
    href: '/library/item/water-heater',
  },
  {
    id: 'foundation',
    name: 'Foundation',
    icon: Blocks,
    health: 'excellent',
    metric: 'Stable',
    metricSub: 'No movement detected',
    summary: 'Poured concrete, no settling or cracks noted at last inspection.',
    facts: [
      { label: 'Last inspected', value: 'Apr 2024' },
      { label: 'Status', value: 'Monitoring only', tone: 'good' },
    ],
    nextAction: 'No action needed',
    nextWhen: 'Monitoring',
    lastService: 'Apr 2024',
    installed: 2005,
    lifespanEnd: 2105,
    lifespanLabel: '100+ yrs',
    showLifespan: false,
    href: '/library',
  },
  {
    id: 'exterior',
    name: 'Exterior',
    icon: PaintRoller,
    health: 'good',
    metric: 'Reseal',
    metricSub: 'Deck due late summer',
    summary: 'Fiber-cement siding holding up well. Deck could use a reseal soon.',
    facts: [
      { label: 'Siding', value: 'Holding up well', tone: 'good' },
      { label: 'Deck last sealed', value: 'Jun 2023' },
    ],
    nextAction: 'Reseal the deck',
    nextWhen: 'Late summer',
    lastService: 'Jun 2023',
    installed: 2016,
    lifespanEnd: 2046,
    lifespanLabel: '25\u201330 yrs',
    showLifespan: false,
    href: '/library',
  },
]

/* ----------------------------- Seasonal Care ----------------------------- */

export type Season = 'spring' | 'summer' | 'fall' | 'winter'

export const seasonMeta: Record<
  Season,
  { label: string; icon: LucideIcon; blurb: string }
> = {
  spring: { label: 'Spring', icon: Sprout, blurb: 'Recovery and prep after winter.' },
  summer: {
    label: 'Summer',
    icon: Sun,
    blurb: 'Peak cooling season in Minneapolis \u2014 focus on air, water, and the exterior.',
  },
  fall: { label: 'Fall', icon: Leaf, blurb: 'Get ahead of the first freeze.' },
  winter: { label: 'Winter', icon: Snowflake, blurb: 'Protect against cold and moisture.' },
}

/* The current season, derived once so the UI adapts automatically. */
export function currentSeason(date = new Date()): Season {
  const m = date.getMonth()
  if (m >= 2 && m <= 4) return 'spring'
  if (m >= 5 && m <= 7) return 'summer'
  if (m >= 8 && m <= 10) return 'fall'
  return 'winter'
}

export type SeasonalTask = {
  title: string
  detail: string
  done?: boolean
}

export const seasonalCare: Record<Season, SeasonalTask[]> = {
  summer: [
    {
      title: 'Service the AC before peak heat',
      detail: 'Comfort Air already handled this in the fall \u2014 you\u2019re covered.',
      done: true,
    },
    { title: 'Reseal the deck', detail: 'Protects the wood through winter\u2019s freeze-thaw cycles.' },
    { title: 'Check exterior caulking', detail: 'Warm, dry days are ideal for sealing gaps and cracks.' },
    { title: 'Clean the dryer vent', detail: 'Reduces fire risk and helps loads dry faster.' },
  ],
  fall: [
    { title: 'Schedule the furnace tune-up', detail: 'Keeps heat efficient and the warranty valid.' },
    { title: 'Clear gutters after leaf-fall', detail: 'Prevents ice dams once the freeze arrives.' },
    { title: 'Winterize outdoor faucets', detail: 'Drain and shut off to avoid burst pipes.' },
  ],
  spring: [
    { title: 'Inspect the roof after winter', detail: 'Look for shingles loosened by snow and ice.' },
    { title: 'Test the sump pump', detail: 'Spring melt is when you need it most.' },
    { title: 'Service the AC', detail: 'Get ahead of the first hot week.' },
  ],
  winter: [
    { title: 'Keep vents clear of snow', detail: 'Protects against carbon monoxide buildup.' },
    { title: 'Watch for ice dams', detail: 'Address heat loss at the roof edge early.' },
    { title: 'Test detectors', detail: 'Heating season is when they matter most.' },
  ],
}

/* ----------------------------- Looking Ahead ----------------------------- */

export type FutureItem = {
  year: string
  title: string
  detail: string
  cost: string
  health: Health
}

export const lookingAhead: FutureItem[] = [
  {
    year: '2027',
    title: 'Replace the water heater',
    detail: 'Plan a proactive swap before it fails. A tankless upgrade is an option.',
    cost: '$2,100',
    health: 'watch',
  },
  {
    year: '2027',
    title: 'Reseal the driveway',
    detail: 'Every 3\u20134 years keeps cracks from spreading through the freeze-thaw.',
    cost: '$400',
    health: 'plan',
  },
  {
    year: '2028',
    title: 'Roof inspection & minor repair',
    detail: 'Mid-life checkup for the shingles. Likely minor, not a replacement.',
    cost: '$600',
    health: 'plan',
  },
  {
    year: '2029',
    title: 'Exterior repaint / re-side touch-up',
    detail: 'Refresh caulking and trim to protect the siding investment.',
    cost: '$1,800',
    health: 'plan',
  },
  {
    year: '2031',
    title: 'HVAC condenser replacement',
    detail: 'Approaching the far end of its life. Budget gradually, no rush.',
    cost: '$5,500',
    health: 'plan',
  },
]

export const savingsSuggestion = {
  monthly: 175,
  fiveYear: 10400,
  note: 'Setting aside about $175 a month fully covers everything HomeOS anticipates over the next five years \u2014 no surprises, no scrambling.',
}

/* ----------------------------- Insights ----------------------------- */

export type Insight = {
  id: string
  icon: LucideIcon
  headline: string
  detail: string
  basis: string
  /* A natural jump to the page that has more on this — connects the app. */
  link: { label: string; href: string }
}

export const insights: Insight[] = [
  {
    id: 'filter-cycle',
    icon: Wind,
    headline: 'Your filters clog faster in July and August',
    detail:
      'The last two summers, your HVAC filter needed changing a month early. I\u2019ll remind you mid-summer so airflow never drops during the heat.',
    basis: 'Based on 2 years of filter-change history',
    link: { label: 'Learn why', href: '/worth-knowing' },
  },
  {
    id: 'contractor-loyalty',
    icon: Wrench,
    headline: 'One visit could cover several plumbing items',
    detail:
      'John\u2019s Plumbing services your water heater, main shutoff, and supply lines. Bundling the next water-heater check with a whole-system look saves a trip fee.',
    basis: 'Based on 3 past service records',
    link: { label: 'View service records', href: '/library' },
  },
  {
    id: 'warranty-window',
    icon: ShieldCheck,
    headline: 'Your furnace warranty is still working for you',
    detail:
      'Carrier covers parts through 2029 as long as annual servicing continues. Staying with Comfort Air keeps that protection intact \u2014 worth it while it lasts.',
    basis: 'Based on your warranty certificate',
    link: { label: 'View warranty', href: '/library' },
  },
]

/* ----------------------------- Recently Completed ----------------------------- */

export type Completed = {
  id: string
  title: string
  when: string
  by: string
  note: string
}

export const recentlyCompleted: Completed[] = [
  {
    id: 'flush',
    title: 'Flushed the water heater',
    when: 'Mar 2026',
    by: 'John\u2019s Plumbing',
    note: 'Cleared sediment and tested the pressure valve \u2014 buys the tank more good years.',
  },
  {
    id: 'furnace',
    title: 'Furnace annual tune-up',
    when: 'Nov 2025',
    by: 'Comfort Air',
    note: 'Kept efficiency high heading into winter and the warranty active.',
  },
  {
    id: 'detectors',
    title: 'Tested all smoke & CO detectors',
    when: 'Oct 2025',
    by: 'You',
    note: 'Every detector responded. Your family is well protected.',
  },
]

export const careWins = {
  count: 12,
  window: 'the last 12 months',
  note: 'You\u2019ve stayed ahead of everything that mattered this year.',
}

/* ----------------------------- Emergency Readiness ----------------------------- */

export type ReadyItem = {
  id: string
  label: string
  icon: LucideIcon
  status: 'ready' | 'soon'
  detail: string
}

export const emergencyItems: ReadyItem[] = [
  {
    id: 'smoke',
    label: 'Smoke & CO detectors',
    icon: Bell,
    status: 'ready',
    detail: 'All 6 tested Oct 2025',
  },
  {
    id: 'shutoff',
    label: 'Water main shutoff',
    icon: Droplet,
    status: 'ready',
    detail: 'Located in basement, tested Mar 2026',
  },
  {
    id: 'gas',
    label: 'Gas shutoff',
    icon: Flame,
    status: 'ready',
    detail: 'Meter side of the house, wrench nearby',
  },
  {
    id: 'extinguisher',
    label: 'Fire extinguishers',
    icon: ShieldCheck,
    status: 'soon',
    detail: 'Kitchen unit expires next month',
  },
  {
    id: 'electrical',
    label: 'Main breaker panel',
    icon: Zap,
    status: 'ready',
    detail: 'Labeled and accessible in garage',
  },
  {
    id: 'contacts',
    label: 'Emergency contacts',
    icon: Wrench,
    status: 'ready',
    detail: 'Plumber, electrician & HVAC on file',
  },
]
