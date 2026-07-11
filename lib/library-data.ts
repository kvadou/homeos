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
  Waves,
  Flame,
  Trees,
  Lightbulb,
  CalendarClock,
  Snowflake,
  RotateCcw,
  Power,
  Droplet,
  Zap,
} from 'lucide-react'

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
  icon: LucideIcon
  count: number
  tint: string
  preview: string[]
}

/* Organized around how homeowners think about their home — not file types.
   Each surfaces a preview so it's obvious real knowledge lives inside. */
export const collections: Collection[] = [
  { key: 'systems', label: 'Systems', icon: Wind, count: 6, tint: 'navy', preview: ['HVAC', 'Roof', 'Electrical'] },
  { key: 'rooms', label: 'Rooms', icon: DoorOpen, count: 9, tint: 'wood', preview: ['Kitchen', 'Primary Bath', 'Garage'] },
  { key: 'projects', label: 'Projects', icon: Hammer, count: 12, tint: 'sage', preview: ['Kitchen Remodel', 'Deck', 'Landscape Lighting'] },
  { key: 'contractors', label: 'Contractors', icon: HardHat, count: 8, tint: 'navy', preview: ['John\u2019s Plumbing', 'Comfort Air', 'Summit Roofing'] },
  { key: 'appliances', label: 'Appliances', icon: Refrigerator, count: 14, tint: 'sage', preview: ['Dishwasher', 'Refrigerator', 'Range'] },
  { key: 'exterior', label: 'Exterior', icon: Home, count: 11, tint: 'wood', preview: ['Siding', 'Windows', 'Gutters'] },
  { key: 'yard', label: 'Yard', icon: Trees, count: 7, tint: 'sage', preview: ['Sprinklers', 'Lighting', 'Fence'] },
  { key: 'paint', label: 'Paint', icon: Palette, count: 21, tint: 'wood', preview: ['Kitchen', 'Living Room', 'Trim'] },
  { key: 'measurements', label: 'Measurements', icon: Ruler, count: 34, tint: 'navy', preview: ['Windows', 'Rooms', 'Ceilings'] },
  { key: 'timeline', label: 'Timeline', icon: CalendarClock, count: 18, tint: 'sage', preview: ['2024 Roof', '2025 Kitchen', '2026 Lighting'] },
]

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

/* The Library actively organizes itself — proactive observations that make it feel alive. */
export type LivingObservation = {
  id: string
  icon: LucideIcon
  text: string
  action: string
  href: string
  tint: string
}

export const livingObservations: LivingObservation[] = [
  {
    id: 'hvac-docs',
    icon: Wind,
    text: 'We found three documents related to your HVAC.',
    action: 'Review',
    href: '/library/item/furnace',
    tint: 'navy',
  },
  {
    id: 'warranty-date',
    icon: ShieldCheck,
    text: 'This water heater warranty is missing an installation date.',
    action: 'Add date',
    href: '/library/item/water-heater',
    tint: 'wood',
  },
  {
    id: 'contractor-link',
    icon: HardHat,
    text: 'We linked John\u2019s Plumbing to your kitchen remodel.',
    action: 'See link',
    href: '/library/room/kitchen',
    tint: 'sage',
  },
  {
    id: 'duplicate-manuals',
    icon: BookText,
    text: 'We found two copies of your dishwasher manual and merged them.',
    action: 'View',
    href: '/library/item/dishwasher',
    tint: 'navy',
  },
  {
    id: 'furnace-photo',
    icon: Wind,
    text: 'We identified your furnace model from a photo you added.',
    action: 'Confirm',
    href: '/library/item/furnace',
    tint: 'wood',
  },
]

/* Practical family knowledge — first-class content, not notes buried in documents. */
export type HouseholdKnow = {
  id: string
  title: string
  meta: string
  icon: LucideIcon
  tint: string
}

export const householdKnowledge: HouseholdKnow[] = [
  {
    id: 'winterize-sprinklers',
    title: 'How to winterize the sprinkler system',
    meta: 'Doug\u2019s walkthrough · Video',
    icon: Snowflake,
    tint: 'navy',
  },
  {
    id: 'reset-garage',
    title: 'How to reset the garage door',
    meta: 'Step-by-step · Note',
    icon: RotateCcw,
    tint: 'wood',
  },
  {
    id: 'start-generator',
    title: 'How to start the generator',
    meta: 'Note · Updated 2025',
    icon: Power,
    tint: 'sage',
  },
  {
    id: 'water-shutoff',
    title: 'Where the main water shutoff is',
    meta: 'Photo + location',
    icon: Droplet,
    tint: 'navy',
  },
  {
    id: 'basement-breaker',
    title: 'Which breaker controls the basement',
    meta: 'Panel map · Note',
    icon: Zap,
    tint: 'wood',
  },
  {
    id: 'garage-keypad',
    title: 'Garage keypad instructions',
    meta: 'Note',
    icon: Lightbulb,
    tint: 'sage',
  },
]

export type ItemField = { label: string; value: string; href?: boolean }
export type RelatedRef = { label: string; kind: string; id?: string }

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
  documents: { label: string; meta: string; icon: LucideIcon }[]
  receipts?: { label: string; meta: string }[]
  photos?: { src?: string; label: string }[]
  maintenance: { date: string; title: string; by?: string }[]
  knowledge: { label: string; meta: string; icon: LucideIcon }[]
  contractor?: { name: string; trade: string }
  relatedProjects?: { label: string; meta: string; id?: string }[]
  recommendations?: { title: string; detail: string; tone: 'attention' | 'plan' | 'good' }[]
  questions: string[]
  room?: string
}

export const items: Record<string, LibraryItem> = {
  'water-heater': {
    id: 'water-heater',
    name: 'Water Heater',
    icon: Flame,
    category: 'Appliance',
    tint: 'wood',
    summary: 'AO Smith 50-gallon gas water heater in the basement utility closet.',
    status: { label: 'Nearing end of life', tone: 'attention' },
    lifespan: { installed: 2015, expectedMin: 2027, expectedMax: 2030 },
    heroPhoto: '/objects/water-heater.png',
    facts: [
      { label: 'Installed', value: '2015' },
      { label: 'Manufacturer', value: 'AO Smith' },
      { label: 'Model', value: 'ProLine XE' },
      { label: 'Serial number', value: 'AOS-4471-2015' },
      { label: 'Capacity', value: '50 gallons' },
      { label: 'Fuel', value: 'Natural gas' },
      { label: 'Warranty', value: 'Expired 2021' },
      { label: 'Expected life', value: '12–15 years' },
      { label: 'Last service', value: 'March 2026' },
      { label: 'Location', value: 'Basement utility closet' },
    ],
    documents: [
      { label: 'Owner\u2019s manual', meta: 'PDF · 2.4 MB', icon: BookText },
      { label: 'Warranty certificate', meta: 'PDF · Expired 2021', icon: ShieldCheck },
    ],
    receipts: [
      { label: 'Original purchase', meta: 'Home Depot · $1,180 · 2015' },
      { label: 'Anode rod replacement', meta: 'John\u2019s Plumbing · $240 · 2024' },
    ],
    photos: [
      { src: '/objects/water-heater.png', label: 'Front view' },
      { label: 'Model & serial plate' },
      { label: 'Shutoff valve' },
    ],
    maintenance: [
      { date: 'Mar 2026', title: 'Flushed tank & tested pressure valve', by: 'John\u2019s Plumbing' },
      { date: 'Apr 2024', title: 'Anode rod replaced', by: 'John\u2019s Plumbing' },
      { date: 'May 2022', title: 'Annual inspection', by: 'John\u2019s Plumbing' },
    ],
    knowledge: [
      { label: 'Doug\u2019s maintenance walkthrough', meta: 'Video · 4 min', icon: Video },
      { label: 'Where the shutoff valve is', meta: 'Note', icon: Lightbulb },
    ],
    contractor: { name: 'John\u2019s Plumbing', trade: 'Plumbing' },
    relatedProjects: [
      { label: 'Basement utility upgrade', meta: 'Planned · 2027' },
    ],
    recommendations: [
      {
        title: 'Start planning a replacement',
        detail:
          'At 11 years old, this unit is entering its final stretch. Replacing on your schedule avoids a cold-water emergency and gives you time to compare tankless options.',
        tone: 'attention',
      },
      {
        title: 'Consider a tankless upgrade',
        detail:
          'Given your gas line and household size, a tankless unit could cut standby losses and free up floor space in the utility closet.',
        tone: 'plan',
      },
    ],
    questions: [
      'Should I replace this now or wait?',
      'What\u2019s the expected replacement cost?',
      'What are good tankless alternatives?',
      'How much have I spent maintaining it?',
    ],
    room: 'basement',
  },
  'furnace': {
    id: 'furnace',
    name: 'Furnace',
    icon: Wind,
    category: 'System',
    tint: 'navy',
    summary: 'Carrier high-efficiency gas furnace serving the whole home.',
    status: { label: 'Healthy', tone: 'good' },
    facts: [
      { label: 'Installed', value: '2019' },
      { label: 'Manufacturer', value: 'Carrier' },
      { label: 'Model', value: 'Infinity 98' },
      { label: 'Warranty', value: 'Active through 2029' },
      { label: 'Expected life', value: '15–20 years' },
      { label: 'Last service', value: 'Nov 2025' },
    ],
    documents: [
      { label: 'Owner\u2019s manual', meta: 'PDF · 3.1 MB', icon: BookText },
      { label: 'Warranty certificate', meta: 'PDF · Active', icon: ShieldCheck },
    ],
    maintenance: [
      { date: 'Nov 2025', title: 'Annual tune-up & filter change', by: 'Comfort Air' },
      { date: 'Oct 2024', title: 'Annual tune-up', by: 'Comfort Air' },
    ],
    knowledge: [{ label: 'How to change the filter', meta: 'Video · 3 min', icon: Video }],
    contractor: { name: 'Comfort Air', trade: 'HVAC' },
    questions: ['When is the next service due?', 'What filter size does this take?'],
    room: 'basement',
  },
  'roof': {
    id: 'roof',
    name: 'Roof',
    icon: Home,
    category: 'System',
    tint: 'sage',
    summary: 'Architectural asphalt shingle roof, replaced in 2024.',
    status: { label: 'Excellent condition', tone: 'good' },
    facts: [
      { label: 'Replaced', value: '2024' },
      { label: 'Material', value: 'Architectural asphalt' },
      { label: 'Manufacturer', value: 'GAF Timberline HDZ' },
      { label: 'Warranty', value: 'Active through 2049' },
      { label: 'Expected life', value: '25–30 years' },
      { label: 'Next inspection', value: 'Recommended 2028' },
    ],
    documents: [
      { label: 'Roof warranty', meta: 'PDF · 25-year', icon: ShieldCheck },
      { label: 'Replacement invoice', meta: 'PDF · Summit Roofing', icon: Receipt },
    ],
    maintenance: [{ date: 'Jun 2024', title: 'Full roof replacement', by: 'Summit Roofing' }],
    knowledge: [{ label: 'Drone inspection photos', meta: '18 photos', icon: Image }],
    contractor: { name: 'Summit Roofing', trade: 'Roofing' },
    questions: ['When should the next inspection be?', 'What does the warranty cover?'],
  },
  'kitchen-paint': {
    id: 'kitchen-paint',
    name: 'Kitchen Paint',
    icon: Palette,
    category: 'Paint',
    tint: 'wood',
    summary: 'Warm neutral wall color used throughout the kitchen and breakfast nook.',
    status: { label: 'On file', tone: 'neutral' },
    facts: [
      { label: 'Color', value: 'Accessible Beige' },
      { label: 'Brand', value: 'Sherwin-Williams' },
      { label: 'Code', value: 'SW 7036' },
      { label: 'Finish', value: 'Eggshell' },
      { label: 'Painted', value: '2025' },
      { label: 'Room', value: 'Kitchen' },
    ],
    documents: [{ label: 'Paint receipt', meta: 'PDF · 2 gallons', icon: Receipt }],
    maintenance: [],
    knowledge: [{ label: 'Trim is SW Pure White', meta: 'Note', icon: Lightbulb }],
    questions: ['How much paint do I need for a touch-up?', 'What finish is the trim?'],
    room: 'kitchen',
  },
  'dishwasher': {
    id: 'dishwasher',
    name: 'Dishwasher',
    icon: Refrigerator,
    category: 'Appliance',
    tint: 'sage',
    summary: 'Bosch 800 Series dishwasher installed during the 2025 kitchen refresh.',
    status: { label: 'Under warranty', tone: 'good' },
    facts: [
      { label: 'Installed', value: '2025' },
      { label: 'Manufacturer', value: 'Bosch' },
      { label: 'Model', value: '800 Series' },
      { label: 'Warranty', value: 'Active through 2027' },
      { label: 'Expected life', value: '10 years' },
    ],
    documents: [
      { label: 'Owner\u2019s manual', meta: 'PDF · 1.8 MB', icon: BookText },
      { label: 'Receipt', meta: 'PDF · 2025', icon: Receipt },
    ],
    maintenance: [],
    knowledge: [],
    contractor: { name: 'Best Buy Install', trade: 'Appliance' },
    questions: ['How do I clean the filter?', 'What\u2019s covered under warranty?'],
    room: 'kitchen',
  },
}

export type RecentItem = {
  id: string
  name: string
  icon: LucideIcon
  when: string
  kind: string
  /* Visual cue so items are recognizable at a glance */
  preview: 'doc' | 'video' | 'swatch' | 'photo'
  color?: string
  image?: string
}

export const recentlyAdded: RecentItem[] = [
  {
    id: 'roof',
    name: 'Roof warranty',
    icon: ShieldCheck,
    when: 'Yesterday',
    kind: 'Warranty · PDF',
    preview: 'doc',
  },
  {
    id: 'water-heater',
    name: 'Sprinkler shutoff video',
    icon: Video,
    when: 'Today',
    kind: 'Video · 4 min',
    preview: 'video',
  },
  {
    id: 'kitchen-paint',
    name: 'Kitchen paint color',
    icon: Palette,
    when: 'Monday',
    kind: 'SW 7036 · Eggshell',
    preview: 'swatch',
    color: 'oklch(0.82 0.03 75)',
  },
  {
    id: 'water-heater',
    name: 'Water heater photo',
    icon: Image,
    when: 'Last week',
    kind: 'Photo',
    preview: 'photo',
    image: '/objects/water-heater.png',
  },
]

/* Individual files — the atoms of the browser. Each maps to a file-type
   filter and links back to the object/room it belongs to. This is what makes
   the Library feel like a real file browser rather than a dashboard. */
export type LibraryFileType =
  | 'documents'
  | 'photos'
  | 'videos'
  | 'receipts'
  | 'manuals'
  | 'warranties'

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

export const libraryFiles: LibraryFile[] = [
  { id: 'f1', name: 'Roof Warranty', type: 'warranties', typeLabel: 'Warranty', meta: 'PDF · 25-year', date: 'Yesterday', order: 20, itemId: 'roof', collection: 'Systems', preview: 'doc', tint: 'sage' },
  { id: 'f2', name: 'Sprinkler Shutoff Walkthrough', type: 'videos', typeLabel: 'Video', meta: '4 min · Doug', date: 'Today', order: 21, itemId: 'water-heater', collection: 'Yard', preview: 'video', tint: 'navy' },
  { id: 'f3', name: 'Kitchen Paint Color', type: 'documents', typeLabel: 'Swatch', meta: 'SW 7036 · Eggshell', date: 'Monday', order: 18, itemId: 'kitchen-paint', collection: 'Paint', preview: 'swatch', color: 'oklch(0.82 0.03 75)', tint: 'wood' },
  { id: 'f4', name: 'Water Heater Photo', type: 'photos', typeLabel: 'Photo', meta: 'Front view', date: 'Last week', order: 15, itemId: 'water-heater', collection: 'Appliances', preview: 'photo', image: '/objects/water-heater.png', tint: 'wood' },
  { id: 'f5', name: 'Furnace Owner\u2019s Manual', type: 'manuals', typeLabel: 'Manual', meta: 'PDF · 3.1 MB', date: 'Nov 2025', order: 12, itemId: 'furnace', collection: 'Systems', preview: 'doc', tint: 'navy' },
  { id: 'f6', name: 'Water Heater Purchase', type: 'receipts', typeLabel: 'Receipt', meta: 'Home Depot · $1,180', date: 'Oct 2025', order: 10, itemId: 'water-heater', collection: 'Appliances', preview: 'doc', tint: 'sage' },
  { id: 'f7', name: 'HVAC Tune-Up Report', type: 'documents', typeLabel: 'Document', meta: 'Comfort Air · PDF', date: 'Nov 2025', order: 13, itemId: 'furnace', collection: 'Systems', preview: 'doc', tint: 'navy' },
  { id: 'f8', name: 'Dishwasher Manual', type: 'manuals', typeLabel: 'Manual', meta: 'PDF · 1.8 MB', date: 'Sep 2025', order: 9, itemId: 'dishwasher', collection: 'Appliances', preview: 'doc', tint: 'sage' },
  { id: 'f9', name: 'Furnace Warranty', type: 'warranties', typeLabel: 'Warranty', meta: 'PDF · Active to 2029', date: 'Aug 2025', order: 8, itemId: 'furnace', collection: 'Systems', preview: 'doc', tint: 'navy' },
  { id: 'f10', name: 'Roof Replacement Invoice', type: 'receipts', typeLabel: 'Receipt', meta: 'Summit Roofing', date: 'Jun 2024', order: 6, itemId: 'roof', collection: 'Systems', preview: 'doc', tint: 'sage' },
  { id: 'f11', name: 'Kitchen Before & After', type: 'photos', typeLabel: 'Photos', meta: '24 photos', date: 'May 2025', order: 7, itemId: 'kitchen-paint', collection: 'Rooms', preview: 'photo', image: '/rooms/kitchen.png', tint: 'wood' },
  { id: 'f12', name: 'Anode Rod Replacement', type: 'receipts', typeLabel: 'Receipt', meta: 'John\u2019s Plumbing · $240', date: 'Apr 2024', order: 5, itemId: 'water-heater', collection: 'Appliances', preview: 'doc', tint: 'wood' },
  { id: 'f13', name: 'Roof Drone Inspection', type: 'photos', typeLabel: 'Photos', meta: '18 photos', date: 'Jun 2024', order: 4, itemId: 'roof', collection: 'Systems', preview: 'photo', tint: 'sage' },
  { id: 'f14', name: 'Dishwasher Receipt', type: 'receipts', typeLabel: 'Receipt', meta: 'Best Buy · 2025', date: 'Mar 2025', order: 3, itemId: 'dishwasher', collection: 'Appliances', preview: 'doc', tint: 'sage' },
  { id: 'f15', name: 'Water Heater Manual', type: 'manuals', typeLabel: 'Manual', meta: 'PDF · 2.4 MB', date: '2015', order: 2, itemId: 'water-heater', collection: 'Appliances', preview: 'doc', tint: 'wood' },
  { id: 'f16', name: 'Kitchen Paint Receipt', type: 'receipts', typeLabel: 'Receipt', meta: '2 gallons · 2025', date: 'May 2025', order: 1, itemId: 'kitchen-paint', collection: 'Paint', preview: 'doc', tint: 'wood' },
]

export type TimelineEntry = {
  year: string
  title: string
  detail: string
  icon: LucideIcon
  tint: string
}

export const timeline: TimelineEntry[] = [
  {
    year: '2022',
    title: 'Bought the home',
    detail: 'Willow Lane became yours.',
    icon: Home,
    tint: 'navy',
  },
  {
    year: '2023',
    title: 'Finished the deck',
    detail: 'Cedar deck and railing added out back.',
    icon: Hammer,
    tint: 'wood',
  },
  {
    year: '2024',
    title: 'New roof',
    detail: '25-year architectural shingles installed.',
    icon: Home,
    tint: 'sage',
  },
  {
    year: '2025',
    title: 'Kitchen refresh',
    detail: 'New paint, dishwasher, and hardware.',
    icon: Palette,
    tint: 'wood',
  },
  {
    year: '2026',
    title: 'Landscape lighting',
    detail: 'Low-voltage lighting along the walkways.',
    icon: Trees,
    tint: 'sage',
  },
]

export type Room = {
  slug: string
  name: string
  summary: string
  groups: { label: string; icon: LucideIcon; items: { id?: string; label: string; meta: string }[] }[]
}

export const rooms: Record<string, Room> = {
  kitchen: {
    slug: 'kitchen',
    name: 'Kitchen',
    summary: 'Refreshed in 2025 — everything connected to this room, in one place.',
    groups: [
      {
        label: 'Appliances',
        icon: Refrigerator,
        items: [
          { id: 'dishwasher', label: 'Bosch Dishwasher', meta: '800 Series · 2025' },
          { label: 'GE Refrigerator', meta: 'Profile · 2025' },
          { label: 'KitchenAid Range', meta: 'Gas · 2025' },
        ],
      },
      {
        label: 'Paint',
        icon: Palette,
        items: [{ id: 'kitchen-paint', label: 'Accessible Beige', meta: 'SW 7036 · Eggshell' }],
      },
      {
        label: 'Flooring',
        icon: Waves,
        items: [{ label: 'White Oak Engineered', meta: 'Matte · 2025' }],
      },
      {
        label: 'Measurements',
        icon: Ruler,
        items: [
          { label: 'Window width', meta: '36 in' },
          { label: 'Island', meta: '72 × 40 in' },
          { label: 'Ceiling height', meta: '9 ft' },
        ],
      },
      {
        label: 'Projects',
        icon: Hammer,
        items: [{ label: 'Kitchen Refresh', meta: 'Completed 2025' }],
      },
      {
        label: 'Photos',
        icon: Image,
        items: [{ label: 'Before & after', meta: '24 photos' }],
      },
    ],
  },
}

export const tintClasses: Record<string, string> = {
  sage: 'bg-sage/15 text-sage-foreground',
  navy: 'bg-primary/10 text-primary',
  wood: 'bg-wood/20 text-wood-foreground',
}
