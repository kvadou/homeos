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
  type LucideIcon,
} from 'lucide-react'

export type FactTone = 'sage' | 'wood' | 'navy'

export type Fact = {
  id: string
  category: string
  icon: LucideIcon
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

/* A rotating set of genuinely interesting, low-stakes observations about the
   home. Not tasks, not projects — just things that are fun to know. */
export const facts: Fact[] = [
  {
    id: 'equity',
    category: 'Wealth',
    icon: Wallet,
    tone: 'sage',
    stat: '$81K',
    headline: 'You\u2019ve added roughly $81K in equity',
    detail:
      'Between the new roof, the kitchen, and steady upkeep, your improvements have outpaced what you spent on them.',
    basis: 'Based on your project history and local comparable sales.',
    action: { label: 'See your projects', href: '/projects' },
  },
  {
    id: 'roof',
    category: 'Longevity',
    icon: Home,
    tone: 'navy',
    stat: 'Top 20%',
    headline: 'Your roof has outperformed similar roofs',
    detail:
      'Nine years in with no leaks on record — architectural shingles in your area typically show wear by now.',
    basis: 'Compared against roofs of the same age and material nearby.',
  },
  {
    id: 'neighbors',
    category: 'Spending',
    icon: TrendingUp,
    tone: 'sage',
    stat: '12% less',
    headline: 'You\u2019ve spent less than neighboring homes',
    detail:
      'Staying ahead of small maintenance has kept your yearly upkeep meaningfully below homes of a similar size and age.',
    basis: 'Estimated from typical maintenance costs for homes like yours.',
  },
  {
    id: 'furnace',
    category: 'Longevity',
    icon: Flame,
    tone: 'wood',
    stat: 'Top 15%',
    headline: 'Your furnace is in the top 15% for lifespan',
    detail:
      'Regular fall servicing has it running like a unit years younger. At this rate it should comfortably pass its expected retirement.',
    basis: 'Modeled from its service record and manufacturer data.',
  },
  {
    id: 'solar',
    category: 'Your Land',
    icon: Sun,
    tone: 'wood',
    stat: '6+ hrs',
    headline: 'Your backyard gets enough sun for a vegetable garden',
    detail:
      'The back of the house catches over six hours of direct summer sun — plenty for raised beds, solar path lighting, or a small panel.',
    basis: 'Estimated from your orientation and roofline.',
    action: { label: 'Plan a project', href: '/projects' },
  },
  {
    id: 'drainage',
    category: 'Your Land',
    icon: Mountain,
    tone: 'navy',
    stat: '3\u00b0 slope',
    headline: 'Your backyard has enough slope for drainage',
    detail:
      'The gentle grade away from the foundation means water naturally moves off — a quiet reason your basement stays dry.',
    basis: 'Inferred from your lot grading and foundation notes.',
  },
  {
    id: 'paint',
    category: 'Good to Know',
    icon: Paintbrush,
    tone: 'sage',
    stat: undefined,
    headline: 'Your kitchen paint color is discontinued',
    detail:
      'The 2021 kitchen color has since been retired by the manufacturer. Worth saving the code on file before you need a touch-up.',
    basis: 'Matched from your saved paint receipt.',
    action: { label: 'View the receipt', href: '/library' },
  },
  {
    id: 'maintenance',
    category: 'Trends',
    icon: Timer,
    tone: 'sage',
    stat: '38%',
    headline: 'You\u2019ve reduced maintenance by 38%',
    detail:
      'Compared to your first year here, you\u2019re spending far less time on reactive fixes — the home has settled into a rhythm.',
    basis: 'Based on tasks logged over the last four years.',
    action: { label: 'See the trend', href: '/care' },
  },
  {
    id: 'pollen',
    category: 'Good to Know',
    icon: Flame,
    tone: 'wood',
    stat: '~1 mo early',
    headline: 'Your HVAC filter clogs earlier than most',
    detail:
      'Summer pollen in your area is heavier than average, so your filter loads up about a month sooner than the typical home. I nudge your reminders to match.',
    basis: 'Compared against filter cycles for nearby homes.',
    action: { label: 'See it in Care', href: '/care' },
  },
  {
    id: 'water',
    category: 'Trends',
    icon: Droplets,
    tone: 'navy',
    stat: undefined,
    headline: 'Your water use dips every October',
    detail:
      'Like clockwork, usage drops once you shut down the irrigation for the season — a small sign your system is well timed.',
    basis: 'Noticed across several years of seasonal patterns.',
  },
  {
    id: 'trees',
    category: 'Your Land',
    icon: Leaf,
    tone: 'wood',
    stat: '2 trees',
    headline: 'Your shade trees are cutting cooling costs',
    detail:
      'The two maples on the west side block afternoon sun in summer, easing the load on your AC during the hottest hours.',
    basis: 'Estimated from tree placement and sun exposure.',
  },
]

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
