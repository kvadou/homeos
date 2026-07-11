import type { LucideIcon } from 'lucide-react'
import {
  Flame,
  Wind,
  Home,
  Palette,
  Droplet,
  ShieldCheck,
  Receipt,
  BookText,
  Video,
  Image as ImageIcon,
  HardHat,
  Hammer,
  Wrench,
  DollarSign,
  CalendarClock,
  Snowflake,
  Leaf,
  TrendingUp,
  RotateCcw,
  MapPin,
  Lightbulb,
  Gauge,
  Bell,
  StickyNote,
  GitCompare,
  Phone,
  FileText,
} from 'lucide-react'

/* What kind of underlying record a citation points to — drives the in-app
   document viewer so people can audit every answer. */
export type DocKind = 'pdf' | 'photo' | 'receipt' | 'warranty' | 'video' | 'note' | 'record'

/* A mock preview shown when a source is opened, so citations feel auditable. */
export type SourcePreview = {
  /* For photo/video previews */
  src?: string
  /* Human summary shown at the top of the viewer */
  summary?: string
  /* Key/value fields, e.g. a receipt or warranty certificate */
  fields?: { label: string; value: string }[]
  /* Free-form lines, e.g. a note or document body */
  body?: string[]
  /* A short meta line, e.g. "PDF · 2 pages · added 2024" */
  meta?: string
}

/* A citation — where a piece of an answer came from. Every answer shows these
   to make it obvious HomeOS is reasoning over the home's real records. */
export type Source = {
  label: string
  kind: string
  icon: LucideIcon
  tint: 'sage' | 'navy' | 'wood'
  href?: string
  docType?: DocKind
  preview?: SourcePreview
}

/* Photo hotspot annotation — AI pointing at exactly what it's talking about. */
export type Hotspot = { x: number; y: number; label: string; tone?: 'sage' | 'wood' | 'navy' }

/* Rich answer blocks. Answers are composed of several of these so a response
   feels synthesized from many parts of the home, not a single document. */
export type AnswerBlock =
  | { type: 'lead'; text: string }
  | { type: 'text'; text: string }
  | {
      type: 'stats'
      items: { label: string; value: string; tone?: 'good' | 'attention' | 'neutral' }[]
    }
  | { type: 'lifespan'; installed: number; expectedMin: number; expectedMax: number }
  | { type: 'photo'; src: string; caption: string }
  | { type: 'annotatedPhoto'; src: string; caption: string; hotspots: Hotspot[] }
  | { type: 'gallery'; photos: { src?: string; label: string }[] }
  | { type: 'timeline'; entries: { date: string; title: string; by?: string }[] }
  | { type: 'warranty'; status: 'active' | 'expired'; coverage: string; detail: string }
  | { type: 'cost'; label: string; range: string; note: string }
  | { type: 'verdict'; headline: string; detail: string; tone: 'good' | 'attention' | 'plan' }
  | { type: 'contractor'; name: string; trade: string; detail: string; phone?: string }
  | {
      type: 'related'
      title: string
      items: { label: string; meta: string; icon: LucideIcon; href?: string }[]
    }
  | { type: 'location'; place: string; detail: string }
  | { type: 'steps'; items: string[] }

/* An optional explicit section label to override auto-grouping of blocks. */
export type SectionLabel = string

/* HomeOS's confidence in the answer, with the evidence it's based on. */
export type Confidence = {
  level: 'high' | 'medium' | 'low'
  basis: string[]
  note?: string
}

/* A thing the user can do off the back of an answer — turns Q&A into an OS. */
export type AskAction = {
  label: string
  icon: LucideIcon
  variant?: 'primary' | 'default'
}

/* A labeled group of blocks, so long answers are easy to scan. */
export type Section = {
  label: string
  blocks: AnswerBlock[]
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export type Answer = {
  blocks: AnswerBlock[]
  sources: Source[]
  followups: string[]
  /* Conversational, multi-paragraph reasoning shown before the cards.
     If omitted, the leading lead/text blocks are used as the narrative. */
  narrative?: string[]
  /* How sure HomeOS is. If omitted, it's derived from the number of sources. */
  confidence?: Confidence
  /* "What HomeOS noticed" — cross-record insights inferred from the home's
     history (patterns, repetition, connections), not restated facts. */
  noticed?: string[]
  /* A tiny memory statement that reinforces "your home has a memory" —
     e.g. "HomeOS has tracked this room since your 2025 remodel." */
  memory?: string
  /* "Why I'm recommending this" — transparent observations. */
  reasoning?: string[]
  /* Suggested next actions. If omitted, a sensible default set is used. */
  actions?: AskAction[]
}

export type SeededConversation = {
  id: string
  question: string
  /* Short teaser shown in the example-conversation gallery */
  teaser: string
  icon: LucideIcon
  tint: 'sage' | 'navy' | 'wood'
  /* Keywords used to loosely match free-text questions to this answer */
  match: string[]
  answer: Answer
}

/* ----------------------------------------------------------------------------
   Seeded conversations — a curated product demo. Each answer weaves together
   documents, warranties, photos, maintenance history, contractors, costs,
   and household knowledge so the vision is felt immediately.
---------------------------------------------------------------------------- */

export const conversations: SeededConversation[] = [
  {
    id: 'replace-water-heater',
    question: 'When should I replace my water heater?',
    teaser: 'Age, warranty, cost, and the smartest time to act.',
    icon: Flame,
    tint: 'wood',
    match: ['water heater', 'replace water heater', 'hot water', 'water heater age'],
    answer: {
      blocks: [
        {
          type: 'stats',
          items: [
            { label: 'Age', value: '11 years', tone: 'attention' },
            { label: 'Expected life', value: '12\u201315 yrs' },
            { label: 'Warranty', value: 'Expired 2021', tone: 'attention' },
            { label: 'Last service', value: 'Mar 2026', tone: 'good' },
          ],
        },
        { type: 'lifespan', installed: 2015, expectedMin: 2027, expectedMax: 2030 },
        {
          type: 'annotatedPhoto',
          src: '/objects/water-heater.png',
          caption: 'AO Smith ProLine XE 50-gal \u00b7 basement utility closet',
          hotspots: [
            { x: 50, y: 20, label: 'Model & serial label', tone: 'navy' },
            { x: 74, y: 55, label: 'Anode rod port (replaced 2024)', tone: 'sage' },
            { x: 30, y: 78, label: 'Drain valve for flushing', tone: 'wood' },
          ],
        },
        {
          type: 'timeline',
          entries: [
            { date: 'Mar 2026', title: 'Flushed tank & tested pressure valve', by: 'John\u2019s Plumbing' },
            { date: 'Apr 2024', title: 'Anode rod replaced', by: 'John\u2019s Plumbing' },
            { date: 'May 2022', title: 'Annual inspection', by: 'John\u2019s Plumbing' },
          ],
        },
        {
          type: 'cost',
          label: 'Estimated replacement',
          range: '$1,600\u2013$2,400',
          note: 'Standard 50-gal gas unit installed. A tankless upgrade runs $3,800\u2013$5,200 but fits your gas line and household size.',
        },
        {
          type: 'verdict',
          headline: 'Plan replacement for 2027\u20132028',
          detail:
            'The anode rod was replaced in 2024, which buys some time. Budgeting now and replacing before winter 2027 avoids an emergency cold-water failure.',
          tone: 'attention',
        },
        {
          type: 'contractor',
          name: 'John\u2019s Plumbing',
          trade: 'Plumbing',
          detail: 'Has serviced this unit 3 times since 2022 \u2014 they know it well.',
          phone: '(612) 555-0148',
        },
        {
          type: 'related',
          title: 'Connected to this water heater',
          items: [
            { label: 'Plumbing system', meta: 'Supply line & main shutoff', icon: Droplet, href: '/library/item/water-heater' },
            { label: 'Gas line', meta: 'Feeds this unit \u00b7 inspected 2022', icon: Flame },
            { label: 'Utility room', meta: 'Basement \u00b7 north wall', icon: Home },
            { label: 'John\u2019s Plumbing', meta: 'Contractor \u00b7 3 visits', icon: HardHat },
            { label: 'Replace before 2028', meta: 'Reminder \u00b7 not yet set', icon: Bell },
            { label: 'Warranty & manual', meta: '2 documents', icon: FileText },
          ],
        },
      ],
      narrative: [
        'Good news \u2014 your water heater is in better shape than most homes its age.',
        'It\u2019s 11 years old now, which is still within the expected 12\u201315 year lifespan. Because John\u2019s Plumbing has kept up with it \u2014 including a fresh anode rod in 2024 \u2014 you likely have some extra runway before it needs replacing.',
        'I wouldn\u2019t rush anything. But I\u2019d start budgeting so you can replace it on your schedule around 2027\u20132028, rather than after a cold-water surprise some winter morning.',
      ],
      noticed: [
        'Because the anode rod was replaced in 2024, corrosion has likely slowed \u2014 which is why I\u2019d expect this tank to reach the upper end of its lifespan rather than fail early.',
        'You\u2019ve used John\u2019s Plumbing for all three services since 2022, so when you replace it, they can quote from firsthand knowledge of the install.',
        'This unit has never needed an emergency repair \u2014 a strong sign the annual servicing is paying off.',
        'It shares a contractor with your plumbing system and main shutoff, so a single visit could cover several connected items at once.',
      ],
      memory: 'HomeOS has followed this water heater for 4 years \u2014 3 services and 5 linked records.',
      confidence: {
        level: 'high',
        basis: [
          'Installation date on the unit label',
          'Warranty certificate',
          '3 maintenance records',
          'Anode rod replacement receipt (2024)',
        ],
      },
      reasoning: [
        'It was installed in 2015 \u2014 that makes it 11 years old.',
        'The manufacturer warranty expired in 2021.',
        'It\u2019s had 3 documented maintenance visits since 2022.',
        'The anode rod was replaced in 2024, which slows corrosion.',
        'Units like this typically last 12\u201315 years.',
      ],
      actions: [
        { label: 'Set a replacement reminder', icon: Bell, variant: 'primary' },
        { label: 'Request a quote from John\u2019s Plumbing', icon: Phone },
        { label: 'Compare tankless options', icon: GitCompare },
        { label: 'Add a note', icon: StickyNote },
        { label: 'Start a replacement project', icon: Hammer },
      ],
      sources: [
        {
          label: 'Water Heater profile',
          kind: 'Appliance record',
          icon: Flame,
          tint: 'wood',
          href: '/library/item/water-heater',
          docType: 'record',
          preview: {
            summary: 'AO Smith ProLine XE 50-gallon gas water heater, installed 2015.',
            meta: 'Appliance record \u00b7 last updated Mar 2026',
            fields: [
              { label: 'Model', value: 'AO Smith ProLine XE' },
              { label: 'Capacity', value: '50 gallon' },
              { label: 'Fuel', value: 'Natural gas' },
              { label: 'Installed', value: 'June 2015' },
              { label: 'Location', value: 'Basement utility closet' },
            ],
          },
        },
        {
          label: 'Warranty certificate',
          kind: 'PDF \u00b7 Expired 2021',
          icon: ShieldCheck,
          tint: 'navy',
          docType: 'warranty',
          preview: {
            summary: '6-year limited manufacturer warranty on the tank and parts.',
            meta: 'PDF \u00b7 2 pages \u00b7 added 2015',
            fields: [
              { label: 'Provider', value: 'AO Smith' },
              { label: 'Term', value: '6 years' },
              { label: 'Coverage', value: 'Tank & parts' },
              { label: 'Status', value: 'Expired June 2021' },
            ],
          },
        },
        {
          label: 'Anode rod replacement',
          kind: 'Receipt \u00b7 2024',
          icon: Receipt,
          tint: 'wood',
          docType: 'receipt',
          preview: {
            summary: 'Anode rod replaced to extend tank life and slow corrosion.',
            meta: 'Receipt \u00b7 John\u2019s Plumbing \u00b7 Apr 2024',
            fields: [
              { label: 'Service', value: 'Anode rod replacement' },
              { label: 'Parts', value: 'Magnesium anode rod' },
              { label: 'Labor', value: '$140' },
              { label: 'Total', value: '$196' },
            ],
          },
        },
        {
          label: 'Maintenance history',
          kind: '3 records',
          icon: Wrench,
          tint: 'sage',
          docType: 'note',
          preview: {
            summary: 'Three documented service visits since 2022.',
            body: [
              'Mar 2026 \u2014 Flushed tank & tested pressure relief valve (John\u2019s Plumbing).',
              'Apr 2024 \u2014 Anode rod replaced (John\u2019s Plumbing).',
              'May 2022 \u2014 Annual inspection, no issues found (John\u2019s Plumbing).',
            ],
          },
        },
        {
          label: 'Installation photo',
          kind: 'Photo \u00b7 2015',
          icon: ImageIcon,
          tint: 'sage',
          docType: 'photo',
          preview: {
            src: '/objects/water-heater.png',
            summary: 'The unit as installed in the basement utility closet.',
            meta: 'Photo \u00b7 added June 2015',
          },
        },
      ],
      followups: [
        'Can this wait another five years?',
        'What happens if it fails?',
        'How much have I spent maintaining it?',
        'Should I replace it before selling?',
        'What brands fit my house?',
      ],
    },
  },
  {
    id: 'water-shutoff',
    question: 'Where is my water shutoff?',
    teaser: 'The exact location, with a photo and how to use it.',
    icon: Droplet,
    tint: 'navy',
    match: ['water shutoff', 'shut off', 'shutoff valve', 'turn off water', 'main water'],
    answer: {
      blocks: [
        {
          type: 'lead',
          text: 'Your main water shutoff is in the basement utility closet, on the north wall behind the shelving \u2014 right next to the water heater. Turn the red lever a quarter-turn clockwise to shut off water to the whole house.',
        },
        {
          type: 'location',
          place: 'Basement utility closet \u00b7 north wall',
          detail: 'Behind the shelving unit, at knee height on the incoming copper line.',
        },
        {
          type: 'gallery',
          photos: [
            { src: '/objects/water-heater.png', label: 'Utility closet \u2014 valve at left' },
            { label: 'Shutoff lever close-up' },
          ],
        },
        {
          type: 'steps',
          items: [
            'Clear the shelving to reach the north wall.',
            'Find the red quarter-turn lever on the vertical copper pipe.',
            'Turn it a quarter-turn clockwise until it stops.',
            'Open a faucet upstairs to relieve pressure and confirm it\u2019s off.',
          ],
        },
      ],
      sources: [
        { label: 'Where the main water shutoff is', kind: 'Photo + location note', icon: Droplet, tint: 'navy' },
        { label: 'Water Heater profile', kind: 'Appliance record', icon: Flame, tint: 'wood', href: '/library/item/water-heater' },
      ],
      followups: [
        'Where are the individual shutoffs for sinks?',
        'How do I drain the pipes for winter?',
        'Who do I call for a plumbing emergency?',
      ],
    },
  },
  {
    id: 'roof',
    question: 'What do I know about my roof?',
    teaser: 'Everything from the 2024 replacement, in one place.',
    icon: Home,
    tint: 'sage',
    match: ['roof', 'shingles', 'roof warranty', 'about my roof'],
    answer: {
      blocks: [
        {
          type: 'lead',
          text: 'Your roof is in excellent shape. It was fully replaced in 2024 with GAF Timberline HDZ architectural shingles and carries an active 25-year warranty through 2049. The next inspection isn\u2019t needed until 2028.',
        },
        {
          type: 'stats',
          items: [
            { label: 'Replaced', value: '2024', tone: 'good' },
            { label: 'Material', value: 'Architectural asphalt' },
            { label: 'Warranty', value: 'Through 2049', tone: 'good' },
            { label: 'Next inspection', value: '2028' },
          ],
        },
        {
          type: 'warranty',
          status: 'active',
          coverage: '25-year manufacturer warranty (GAF)',
          detail: 'Covers material defects and includes workmanship coverage through Summit Roofing.',
        },
        {
          type: 'verdict',
          headline: 'No action needed',
          detail:
            'At two years old, your roof is early in its life. Keep gutters clear and schedule the recommended 2028 inspection to protect the warranty.',
          tone: 'good',
        },
        {
          type: 'contractor',
          name: 'Summit Roofing',
          trade: 'Roofing',
          detail: 'Completed the 2024 replacement and holds your workmanship warranty.',
          phone: '(612) 555-0192',
        },
      ],
      sources: [
        { label: 'Roof profile', kind: 'System record', icon: Home, tint: 'sage', href: '/library/item/roof' },
        { label: 'Roof warranty', kind: 'PDF \u00b7 25-year', icon: ShieldCheck, tint: 'navy' },
        { label: 'Replacement invoice', kind: 'Summit Roofing \u00b7 2024', icon: Receipt, tint: 'wood' },
        { label: 'Drone inspection photos', kind: '18 photos', icon: ImageIcon, tint: 'sage' },
      ],
      followups: [
        'What exactly does the roof warranty cover?',
        'When should I clean the gutters?',
        'How much did the 2024 replacement cost?',
      ],
    },
  },
  {
    id: 'hvac-service',
    question: 'Who serviced my HVAC last?',
    teaser: 'Last visit, what was done, and who to call next.',
    icon: Wind,
    tint: 'navy',
    match: ['hvac', 'furnace', 'serviced hvac', 'hvac service', 'heating'],
    answer: {
      blocks: [
        {
          type: 'stats',
          items: [
            { label: 'Last service', value: 'Nov 2025', tone: 'good' },
            { label: 'By', value: 'Comfort Air' },
            { label: 'Warranty', value: 'Through 2029', tone: 'good' },
            { label: 'Next due', value: 'Nov 2026' },
          ],
        },
        {
          type: 'timeline',
          entries: [
            { date: 'Nov 2025', title: 'Annual tune-up & filter change', by: 'Comfort Air' },
            { date: 'Oct 2024', title: 'Annual tune-up', by: 'Comfort Air' },
          ],
        },
        {
          type: 'contractor',
          name: 'Comfort Air',
          trade: 'HVAC',
          detail: 'Your regular HVAC company \u2014 they installed the system in 2019.',
          phone: '(612) 555-0175',
        },
      ],
      narrative: [
        'You\u2019ve been with Comfort Air since they installed your Carrier furnace back in 2019.',
        'They handled your last tune-up in November 2025 \u2014 an annual service with a fresh filter \u2014 so your system is healthy and still under warranty through 2029.',
        'You\u2019re in good shape until around next fall. I\u2019d plan on the next visit around November 2026 to keep the streak going.',
      ],
      noticed: [
        'Because your tune-ups have landed every October\u2013November since 2019, I\u2019d expect the next one due around November 2026 \u2014 booking early fall keeps the pattern intact.',
        'Comfort Air both installed and services this system, so they already know its full history \u2014 worth staying with them while it\u2019s under warranty through 2029.',
        'Six straight years of on-schedule servicing is a big reason this furnace is still trouble-free at its age.',
      ],
      memory: 'HomeOS has tracked this furnace since Comfort Air installed it in 2019.',
      sources: [
        { label: 'Furnace profile', kind: 'System record', icon: Wind, tint: 'navy', href: '/library/item/furnace' },
        { label: 'Maintenance history', kind: '2 records', icon: Wrench, tint: 'sage' },
        { label: 'How to change the filter', kind: 'Video \u00b7 3 min', icon: Video, tint: 'wood' },
      ],
      followups: [
        'What filter size does my furnace take?',
        'Should I schedule the next tune-up now?',
        'Is the humidifier covered under warranty?',
      ],
    },
  },
  {
    id: 'kitchen-paint',
    question: 'What paint color is in the kitchen?',
    teaser: 'Exact color, code, finish, and how much to buy.',
    icon: Palette,
    tint: 'wood',
    match: ['paint', 'kitchen paint', 'paint color', 'wall color', 'claire'],
    answer: {
      blocks: [
        {
          type: 'stats',
          items: [
            { label: 'Color', value: 'Accessible Beige' },
            { label: 'Code', value: 'SW 7036' },
            { label: 'Finish', value: 'Eggshell' },
            { label: 'Trim', value: 'SW Pure White' },
          ],
        },
        {
          type: 'photo',
          src: '/rooms/kitchen.png',
          caption: 'Kitchen \u2014 refreshed 2025',
        },
        {
          type: 'related',
          title: 'Everything from the 2025 Kitchen Refresh',
          items: [
            { label: 'Kitchen Refresh', meta: 'Project \u00b7 completed 2025', icon: Hammer, href: '/library/room/kitchen' },
            { label: 'Prairie Creek Builders', meta: 'General contractor', icon: HardHat },
            { label: 'Shaker cabinets', meta: 'White oak \u00b7 soft-close', icon: Home },
            { label: 'Quartz countertops', meta: 'Caesarstone \u00b7 Cloudburst', icon: Home },
            { label: 'Accessible Beige paint', meta: 'SW 7036 \u00b7 eggshell', icon: Palette, href: '/library/item/kitchen-paint' },
            { label: 'Bosch Dishwasher', meta: '800 Series \u00b7 warranty to 2030', icon: Wrench, href: '/library/item/dishwasher' },
            { label: 'White Oak flooring', meta: 'Matte \u00b7 refinished 2025', icon: Home },
            { label: 'Contractor invoices', meta: '4 invoices \u00b7 $41,200', icon: Receipt },
            { label: 'Building permit', meta: 'Closed \u00b7 city inspected', icon: FileText },
            { label: 'Before / after photos', meta: '6 photos', icon: ImageIcon },
            { label: 'Appliance warranties', meta: '3 documents', icon: ShieldCheck },
            { label: 'Project budget', meta: 'Final \u00b7 3% under estimate', icon: Gauge },
          ],
        },
      ],
      narrative: [
        'Since your 2025 kitchen remodel, you\u2019ve been using Sherwin-Williams \u201CAccessible Beige\u201D (SW 7036) as the main color across your living spaces.',
        'In the kitchen it\u2019s an eggshell finish, with Pure White on the trim. For touch-ups you\u2019d only need about a quart \u2014 and you probably won\u2019t have to buy any.',
        'Your receipt shows you bought two gallons and the job needed a little over one, so there\u2019s likely close to a full gallon left over. That\u2019s more than enough to cover both the kitchen and the dining room, since they share the same color.',
      ],
      noticed: [
        'Because you bought two gallons and the kitchen used a little over one, you likely have close to a full gallon left \u2014 enough for years of touch-ups.',
        'Your dining room uses the same Accessible Beige, so a single quart could refresh both rooms at once.',
        'Accessible Beige now appears in three connected spaces \u2014 it\u2019s effectively become your home\u2019s signature neutral.',
        'The 2025 refresh is your kitchen\u2019s only major update since you bought the home, and every part of it is documented together.',
      ],
      memory: 'HomeOS has tracked this room since your 2025 remodel \u2014 12 linked records so far.',
      sources: [
        { label: 'Kitchen Paint', kind: 'Paint record', icon: Palette, tint: 'wood', href: '/library/item/kitchen-paint' },
        { label: 'Paint receipt', kind: 'PDF \u00b7 2 gallons', icon: Receipt, tint: 'navy' },
        { label: 'Trim is SW Pure White', kind: 'Note', icon: Lightbulb, tint: 'sage' },
      ],
      followups: [
        'How much paint do I need for the whole kitchen?',
        'What finish is on the trim?',
        'What colors are in the other rooms?',
      ],
    },
  },
  {
    id: 'winter-maintenance',
    question: 'What maintenance should I do before winter?',
    teaser: 'A prioritized checklist built from your home\u2019s systems.',
    icon: Snowflake,
    tint: 'navy',
    match: ['winter', 'before winter', 'fall maintenance', 'winterize', 'seasonal'],
    answer: {
      blocks: [
        {
          type: 'lead',
          text: 'Based on your systems and last year\u2019s history, here are the four things worth doing before the first freeze. Two you can do yourself; two are worth a pro.',
        },
        {
          type: 'related',
          title: 'Your winter checklist',
          items: [
            { label: 'Winterize the sprinkler system', meta: 'Due now \u00b7 Doug has a walkthrough video', icon: Snowflake },
            { label: 'Schedule furnace tune-up', meta: 'Comfort Air \u00b7 last done Nov 2025', icon: Wind, href: '/library/item/furnace' },
            { label: 'Clear gutters before leaves freeze', meta: 'Protects your 2024 roof', icon: Leaf, href: '/library/item/roof' },
            { label: 'Flush the water heater', meta: 'Last flushed Mar 2026', icon: Flame, href: '/library/item/water-heater' },
          ],
        },
        {
          type: 'verdict',
          headline: 'Start with the sprinklers',
          detail:
            'Your area typically sees first freeze in mid-November. Winterizing irrigation is the most time-sensitive \u2014 a cracked line is an expensive spring surprise.',
          tone: 'attention',
        },
      ],
      sources: [
        { label: 'How to winterize the sprinklers', kind: 'Doug\u2019s video \u00b7 4 min', icon: Video, tint: 'navy' },
        { label: 'Furnace profile', kind: 'System record', icon: Wind, tint: 'sage', href: '/library/item/furnace' },
        { label: 'Roof profile', kind: 'System record', icon: Home, tint: 'wood', href: '/library/item/roof' },
        { label: 'Water Heater profile', kind: 'Appliance record', icon: Flame, tint: 'wood', href: '/library/item/water-heater' },
      ],
      followups: [
        'Show me how to winterize the sprinklers',
        'When is the first freeze usually here?',
        'Add these to my maintenance calendar',
      ],
    },
  },
  {
    id: 'kitchen-remodel',
    question: 'Show everything related to the kitchen remodel.',
    teaser: 'Appliances, paint, receipts, and photos \u2014 connected.',
    icon: Hammer,
    tint: 'sage',
    match: ['kitchen remodel', 'kitchen refresh', 'kitchen project', 'remodel'],
    answer: {
      blocks: [
        {
          type: 'lead',
          text: 'The 2025 Kitchen Refresh touched paint, flooring, appliances, and hardware. Here\u2019s everything HomeOS has connected to it \u2014 pulled from receipts, manuals, and photos you added along the way.',
        },
        {
          type: 'photo',
          src: '/rooms/kitchen.png',
          caption: 'Kitchen \u2014 after the 2025 refresh',
        },
        {
          type: 'related',
          title: 'Connected to this project',
          items: [
            { label: 'Bosch Dishwasher', meta: '800 Series \u00b7 under warranty to 2027', icon: Wrench, href: '/library/item/dishwasher' },
            { label: 'Accessible Beige paint', meta: 'SW 7036 \u00b7 eggshell', icon: Palette, href: '/library/item/kitchen-paint' },
            { label: 'White Oak Engineered flooring', meta: 'Matte \u00b7 2025', icon: Home },
            { label: 'GE Refrigerator & KitchenAid Range', meta: 'Installed 2025', icon: Wrench },
          ],
        },
        {
          type: 'stats',
          items: [
            { label: 'Completed', value: '2025', tone: 'good' },
            { label: 'Items linked', value: '6' },
            { label: 'Photos', value: '24' },
            { label: 'Room', value: 'Kitchen' },
          ],
        },
      ],
      sources: [
        { label: 'Kitchen room', kind: 'Room record', icon: Home, tint: 'sage', href: '/library/room/kitchen' },
        { label: 'Kitchen Paint', kind: 'Paint record', icon: Palette, tint: 'wood', href: '/library/item/kitchen-paint' },
        { label: 'Bosch Dishwasher', kind: 'Appliance record', icon: Wrench, tint: 'navy', href: '/library/item/dishwasher' },
        { label: 'Before & after', kind: '24 photos', icon: ImageIcon, tint: 'sage' },
      ],
      followups: [
        'What did the kitchen remodel cost in total?',
        'Which appliances are still under warranty?',
        'What paint did we use in the kitchen?',
      ],
    },
  },
  {
    id: 'garage-reset',
    question: 'How do I reset the garage door?',
    teaser: 'The saved step-by-step from your household knowledge.',
    icon: RotateCcw,
    tint: 'wood',
    match: ['garage', 'reset garage', 'garage door', 'garage keypad'],
    answer: {
      blocks: [
        {
          type: 'lead',
          text: 'You saved a step-by-step for this. To reset the garage door opener after a power outage or code issue, follow these steps \u2014 it takes about two minutes.',
        },
        {
          type: 'steps',
          items: [
            'Press and hold the \u201CLearn\u201D button on the motor unit until the LED turns off (about 6 seconds).',
            'Within 30 seconds, press the button on your remote until the motor light blinks.',
            'To reset the keypad, enter your 4-digit PIN followed by the Enter key.',
            'Test the door twice to confirm the reset held.',
          ],
        },
        {
          type: 'text',
          text: 'The keypad PIN and remote pairing notes are saved with this entry, along with the garage keypad instructions.',
        },
      ],
      sources: [
        { label: 'How to reset the garage door', kind: 'Step-by-step \u00b7 Note', icon: RotateCcw, tint: 'wood' },
        { label: 'Garage keypad instructions', kind: 'Note', icon: Lightbulb, tint: 'sage' },
      ],
      followups: [
        'How do I reprogram a new remote?',
        'What\u2019s the garage keypad PIN?',
        'Who installed the garage opener?',
      ],
    },
  },
  {
    id: 'roi-projects',
    question: 'Which projects have the highest ROI?',
    teaser: 'What pays back most when it\u2019s time to sell.',
    icon: TrendingUp,
    tint: 'sage',
    match: ['roi', 'return on investment', 'highest roi', 'resale', 'value', 'projects roi'],
    answer: {
      blocks: [
        {
          type: 'lead',
          text: 'Looking across your completed and planned projects, your 2024 roof and 2025 kitchen refresh are already your strongest equity builders. Of what\u2019s left, refreshing curb appeal returns the most per dollar.',
        },
        {
          type: 'related',
          title: 'Ranked by estimated return',
          items: [
            { label: 'New roof (2024)', meta: 'Done \u00b7 ~85% recouped + buyer confidence', icon: Home, href: '/library/item/roof' },
            { label: 'Kitchen refresh (2025)', meta: 'Done \u00b7 ~75% recouped', icon: Hammer, href: '/library/room/kitchen' },
            { label: 'Landscape & lighting', meta: 'Planned \u00b7 ~90% recouped, high curb appeal', icon: Leaf },
            { label: 'Water heater \u2192 tankless', meta: 'Planned \u00b7 efficiency + selling point', icon: Flame, href: '/library/item/water-heater' },
          ],
        },
        {
          type: 'verdict',
          headline: 'Prioritize curb appeal next',
          detail:
            'Landscape lighting and exterior refresh return the most per dollar and make every other improvement show better. Your roof and kitchen already anchor the home\u2019s value.',
          tone: 'plan',
        },
      ],
      sources: [
        { label: 'Home timeline', kind: '5 milestones', icon: CalendarClock, tint: 'sage' },
        { label: 'Roof profile', kind: 'System record', icon: Home, tint: 'wood', href: '/library/item/roof' },
        { label: 'Kitchen room', kind: 'Room record', icon: Hammer, tint: 'navy', href: '/library/room/kitchen' },
      ],
      followups: [
        'What would a landscape lighting project cost?',
        'How much value did the new roof add?',
        'What should I fix before selling?',
      ],
    },
  },
]

/* Suggested starter questions shown under the input. Rotated/curated so the
   home feels like it has a lot to offer. */
export const starterQuestions: { text: string; icon: LucideIcon }[] = [
  { text: 'When should I replace my water heater?', icon: Flame },
  { text: 'Where is my water shutoff?', icon: Droplet },
  { text: 'What maintenance should I do before winter?', icon: Snowflake },
  { text: 'Who serviced my HVAC last?', icon: Wind },
  { text: 'What paint color is in the kitchen?', icon: Palette },
  { text: 'Which projects have the highest ROI?', icon: TrendingUp },
]

/* The grounding steps shown while HomeOS "thinks" — reinforces that answers
   are drawn from the home's real records, not a generic model. */
export const groundingSteps = [
  'Searching your documents',
  'Checking maintenance history',
  'Reading warranties & receipts',
  'Connecting related systems',
]

/* ----------------------------------------------------------------------------
   Answer shaping helpers — used by the renderer to group and enrich answers
   consistently, whether or not each field was hand-authored.
---------------------------------------------------------------------------- */

/* Default section label for a block when not explicitly grouped. */
function sectionForBlock(b: AnswerBlock): string {
  switch (b.type) {
    case 'stats':
      return 'What HomeOS knows'
    case 'lifespan':
      return 'Lifespan'
    case 'photo':
    case 'annotatedPhoto':
    case 'gallery':
      return 'Photo'
    case 'timeline':
      return 'Maintenance history'
    case 'warranty':
      return 'Warranty'
    case 'cost':
      return 'Replacement guidance'
    case 'verdict':
      return 'Recommendation'
    case 'contractor':
      return 'Contractor'
    case 'related':
      return b.title
    case 'location':
      return 'Location'
    case 'steps':
      return 'Steps'
    default:
      return 'Details'
  }
}

/* The conversational intro shown before the structured cards. */
export function getNarrative(answer: Answer): string[] {
  if (answer.narrative && answer.narrative.length) return answer.narrative
  const paras: string[] = []
  for (const b of answer.blocks) {
    if (b.type === 'lead' || b.type === 'text') paras.push(b.text)
    else break
  }
  return paras
}

/* Blocks that belong in the body (everything after the leading narrative run). */
function getBodyBlocks(answer: Answer): AnswerBlock[] {
  let i = 0
  while (
    i < answer.blocks.length &&
    (answer.blocks[i].type === 'lead' || answer.blocks[i].type === 'text')
  ) {
    i++
  }
  return answer.blocks.slice(i)
}

/* Group body blocks into labeled, scannable sections. */
export function getSections(answer: Answer): Section[] {
  const body = getBodyBlocks(answer)
  const sections: Section[] = []
  for (const block of body) {
    const label = sectionForBlock(block)
    const last = sections[sections.length - 1]
    if (last && last.label === label) {
      last.blocks.push(block)
    } else {
      sections.push({
        label,
        blocks: [block],
        collapsible: label === 'Maintenance history',
        defaultCollapsed: label === 'Maintenance history',
      })
    }
  }
  return sections
}

/* Confidence — authored when available, otherwise derived from source count. */
export function getConfidence(answer: Answer): Confidence {
  if (answer.confidence) return answer.confidence
  const n = answer.sources.length
  const level: Confidence['level'] = n >= 3 ? 'high' : n === 2 ? 'medium' : 'low'
  return {
    level,
    basis: answer.sources.slice(0, 4).map((s) => s.label),
    note:
      level === 'low'
        ? 'I\u2019m working from limited records \u2014 add more and I\u2019ll sharpen this.'
        : undefined,
  }
}

const baseActions: AskAction[] = [
  { label: 'Create reminder', icon: Bell, variant: 'primary' },
  { label: 'Add a note', icon: StickyNote },
  { label: 'Schedule maintenance', icon: CalendarClock },
]

/* Next actions — authored when available, otherwise a sensible default set. */
export function getActions(answer: Answer): AskAction[] {
  return answer.actions && answer.actions.length ? answer.actions : baseActions
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
}

/* Loosely match free-text to a seeded answer. Falls back to a graceful,
   still-grounded response so the demo never dead-ends. */
export function answerFor(question: string): { answer: Answer; matched: boolean } {
  const q = normalize(question)

  // Exact-ish question match first
  const exact = conversations.find((c) => normalize(c.question) === q)
  if (exact) return { answer: exact.answer, matched: true }

  // Keyword scoring
  let best: SeededConversation | null = null
  let bestScore = 0
  for (const c of conversations) {
    let score = 0
    for (const kw of c.match) {
      if (q.includes(normalize(kw))) score += kw.split(' ').length
    }
    if (score > bestScore) {
      bestScore = score
      best = c
    }
  }
  if (best && bestScore > 0) return { answer: best.answer, matched: true }

  return { answer: fallbackAnswer(question), matched: false }
}

function fallbackAnswer(question: string): Answer {
  return {
    blocks: [
      {
        type: 'lead',
        text: `I looked across everything your home remembers for \u201C${question.trim()}\u201D. I don\u2019t have a saved answer yet, but here\u2019s what I can connect it to \u2014 and the moment you add more, I\u2019ll fold it in.`,
      },
      {
        type: 'related',
        title: 'Related in your home',
        items: [
          { label: 'Systems', meta: 'HVAC, roof, water heater & more', icon: Gauge, href: '/library' },
          { label: 'Household knowledge', meta: 'Shutoffs, resets, walkthroughs', icon: Lightbulb, href: '/library' },
          { label: 'Documents & warranties', meta: 'Manuals, receipts, coverage', icon: BookText, href: '/library' },
        ],
      },
      {
        type: 'text',
        text: 'Try one of the suggested questions below, or add a document and ask again.',
      },
    ],
    sources: [
      { label: 'Your Library', kind: 'Everything your home knows', icon: BookText, tint: 'navy', href: '/library' },
    ],
    followups: [
      'When should I replace my water heater?',
      'What maintenance should I do before winter?',
      'Where is my water shutoff?',
    ],
  }
}
