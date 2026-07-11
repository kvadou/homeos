/**
 * Demo-data seed script. Ports the original v0 mock content (recovered from
 * git history at 53a1e7d) into a real home so the app looks fully alive.
 *
 * Usage: pnpm dlx tsx scripts/seed.ts --email <user-email> [--wipe]
 */
import { readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"
import type { Database, Json } from "../lib/supabase/database.types"

type Admin = ReturnType<typeof createClient<Database>>

/* ------------------------------- env + args ------------------------------- */

// ponytail: 5-line .env parser — no dotenv dep for a one-off script.
function loadEnvFile(path: string): Record<string, string> {
  const out: Record<string, string> = {}
  let text: string
  try {
    text = readFileSync(path, "utf8")
  } catch {
    return out
  }
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
    if (!m) continue
    let val = (m[2] ?? "").trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    out[m[1]] = val
  }
  return out
}

function loadEnv(): { url: string; serviceKey: string } {
  // .env.local takes precedence over .env, matching Next.js convention.
  const env = { ...loadEnvFile(".env"), ...loadEnvFile(".env.local"), ...process.env }
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env / .env.local",
    )
  }
  return { url, serviceKey }
}

function parseArgs(argv: string[]): { email?: string; wipe: boolean } {
  const args: { email?: string; wipe: boolean } = { wipe: false }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--email") args.email = argv[++i]
    else if (argv[i] === "--wipe") args.wipe = true
  }
  return args
}

/* --------------------------------- helpers -------------------------------- */

function must<T>(res: { data: T | null; error: { message: string } | null }, label: string): T {
  if (res.error) throw new Error(`${label}: ${res.error.message}`)
  if (res.data == null) throw new Error(`${label}: no data returned`)
  return res.data
}

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

/* ------------------------------ wipe ------------------------------ */

const HOME_SCOPED_TABLES = [
  "rooms",
  "items",
  "files",
  "care_tasks",
  "care_events",
  "projects",
  "insights",
  "timeline_events",
  "conversations",
] as const

async function wipeHome(admin: Admin, homeId: string) {
  for (const table of HOME_SCOPED_TABLES) {
    const { error } = await admin.from(table).delete().eq("home_id", homeId)
    if (error) throw new Error(`wipe ${table}: ${error.message}`)
  }
}

/* ------------------------------ rooms ------------------------------ */

const ROOM_DEFS = [
  { slug: "kitchen", name: "Kitchen", summary: "Refreshed in 2025 — everything connected to this room, in one place." },
  { slug: "basement", name: "Basement", summary: "Utility systems and storage." },
  { slug: "garage", name: "Garage", summary: "Parking, storage, and the main electrical panel." },
] as const

async function seedRooms(admin: Admin, homeId: string): Promise<Record<string, string>> {
  const { error } = await admin
    .from("rooms")
    .insert(ROOM_DEFS.map((r) => ({ home_id: homeId, slug: r.slug, name: r.name, summary: r.summary })))
  if (error) throw new Error(`insert rooms: ${error.message}`)
  const rows = must(
    await admin.from("rooms").select("id, slug").eq("home_id", homeId),
    "select rooms",
  )
  return Object.fromEntries(rows.map((r) => [r.slug, r.id]))
}

/* ------------------------------ items ------------------------------ */

type Fact = { label: string; value: string; tone?: "good" | "attention" }

type ItemDef = {
  name: string
  category: string
  status: string | null
  manufacturer?: string
  model?: string
  serial?: string
  installed_on?: string
  lifespan_years?: number
  summary: string
  facts: Fact[]
  knowledge: string[]
  room?: "kitchen" | "basement" | "garage"
}

// The Care "systems" array (7) + a handful of Library appliances/fixtures (4).
const ITEM_DEFS: ItemDef[] = [
  {
    name: "Furnace",
    category: "system",
    status: "excellent",
    manufacturer: "Carrier",
    model: "Infinity 98",
    installed_on: "2019-01-01",
    lifespan_years: 20,
    summary:
      "Carrier high-efficiency gas furnace serving the whole home. Cooling well this summer, serviced every fall by Comfort Air.",
    facts: [
      { label: "Warranty", value: "Active to 2029", tone: "good" },
      { label: "Next tune-up", value: "Nov 2026" },
    ],
    knowledge: ["How to change the filter (video, 3 min)"],
    room: "basement",
  },
  {
    name: "Roof",
    category: "system",
    status: "good",
    installed_on: "2016-01-01",
    lifespan_years: 30,
    summary:
      "Architectural shingles in good condition, replaced in 2016 by Summit Roofing. No leaks on record.",
    facts: [
      { label: "Last inspected", value: "Apr 2024" },
      { label: "Leaks on record", value: "None", tone: "good" },
    ],
    knowledge: [],
  },
  {
    name: "Plumbing",
    category: "system",
    status: "good",
    installed_on: "2005-01-01",
    lifespan_years: 50,
    summary: "Copper supply lines, no leaks. Main shutoff tested and accessible in the basement.",
    facts: [{ label: "Main shutoff", value: "Tested Mar 2026", tone: "good" }],
    knowledge: ["Main water shutoff is in the basement utility closet, marked with a red tag."],
    room: "basement",
  },
  {
    name: "Electrical",
    category: "system",
    status: "good",
    installed_on: "2005-01-01",
    lifespan_years: 40,
    summary: "200-amp panel, breakers updated in 2023. Handles household load comfortably.",
    facts: [
      { label: "Breakers", value: "Updated 2023" },
      { label: "Household load", value: "Comfortable", tone: "good" },
    ],
    knowledge: ["Panel is labeled and accessible in the garage."],
    room: "garage",
  },
  {
    name: "Water Heater",
    category: "system",
    status: "watch",
    manufacturer: "AO Smith",
    model: "ProLine XE",
    serial: "AOS-4471-2015",
    installed_on: "2015-01-01",
    lifespan_years: 15,
    summary:
      "AO Smith 50-gallon gas water heater in the basement utility closet. Well maintained, but entering its final stretch.",
    facts: [
      { label: "Capacity", value: "50 gallons" },
      { label: "Fuel", value: "Natural gas" },
      { label: "Warranty", value: "Expired 2021" },
      { label: "Recommendation", value: "Budget replacement", tone: "attention" },
    ],
    knowledge: [
      "Doug's maintenance walkthrough video (4 min)",
      "Shutoff valve is behind the unit, easy to reach.",
    ],
    room: "basement",
  },
  {
    name: "Foundation",
    category: "system",
    status: "excellent",
    installed_on: "2005-01-01",
    lifespan_years: 100,
    summary: "Poured concrete, no settling or cracks noted at last inspection.",
    facts: [
      { label: "Last inspected", value: "Apr 2024" },
      { label: "Status", value: "Monitoring only", tone: "good" },
    ],
    knowledge: [],
  },
  {
    name: "Exterior",
    category: "system",
    status: "good",
    installed_on: "2016-01-01",
    lifespan_years: 30,
    summary: "Fiber-cement siding holding up well. Deck could use a reseal soon.",
    facts: [
      { label: "Siding", value: "Holding up well", tone: "good" },
      { label: "Deck last sealed", value: "Jun 2023" },
    ],
    knowledge: [],
  },
  {
    name: "Dishwasher",
    category: "appliance",
    status: "good",
    manufacturer: "Bosch",
    model: "800 Series",
    installed_on: "2025-01-01",
    lifespan_years: 10,
    summary: "Bosch 800 Series dishwasher installed during the 2025 kitchen refresh.",
    facts: [{ label: "Warranty", value: "Active through 2027", tone: "good" }],
    knowledge: [],
    room: "kitchen",
  },
  {
    name: "Refrigerator",
    category: "appliance",
    status: "good",
    manufacturer: "GE",
    model: "Profile",
    installed_on: "2025-01-01",
    lifespan_years: 12,
    summary: "GE Profile refrigerator installed during the 2025 kitchen refresh.",
    facts: [],
    knowledge: [],
    room: "kitchen",
  },
  {
    name: "Range",
    category: "appliance",
    status: "good",
    manufacturer: "KitchenAid",
    installed_on: "2025-01-01",
    lifespan_years: 15,
    summary: "KitchenAid gas range installed during the 2025 kitchen refresh.",
    facts: [{ label: "Fuel", value: "Gas" }],
    knowledge: [],
    room: "kitchen",
  },
  {
    name: "Kitchen Paint",
    category: "paint",
    status: null,
    manufacturer: "Sherwin-Williams",
    model: "SW 7036 Accessible Beige",
    installed_on: "2025-01-01",
    summary:
      "Accessible Beige (SW 7036), eggshell finish, used throughout the kitchen and breakfast nook.",
    facts: [{ label: "Finish", value: "Eggshell" }],
    knowledge: ["Trim throughout is SW Pure White."],
    room: "kitchen",
  },
]

async function seedItems(
  admin: Admin,
  homeId: string,
  roomId: Record<string, string>,
): Promise<Record<string, string>> {
  const { error } = await admin.from("items").insert(
    ITEM_DEFS.map((d) => ({
      home_id: homeId,
      room_id: d.room ? roomId[d.room] : null,
      name: d.name,
      category: d.category,
      status: d.status,
      manufacturer: d.manufacturer ?? null,
      model: d.model ?? null,
      serial: d.serial ?? null,
      installed_on: d.installed_on ?? null,
      lifespan_years: d.lifespan_years ?? null,
      summary: d.summary,
      facts: d.facts,
      knowledge: d.knowledge,
    })),
  )
  if (error) throw new Error(`insert items: ${error.message}`)
  const rows = must(
    await admin.from("items").select("id, name").eq("home_id", homeId),
    "select items",
  )
  return Object.fromEntries(rows.map((r) => [r.name, r.id]))
}

/* ---------------------------- care tasks + events ---------------------------- */

async function seedCare(admin: Admin, homeId: string, itemId: Record<string, string>) {
  const tasks = [
    // This week — open, source 'ai'.
    {
      title: "Replace the HVAC filter",
      detail:
        "It has been running hard through the summer heat. A fresh filter keeps the air clean and can trim up to 8% off this month's cooling bill.",
      priority: "highest",
      season: null,
      due_on: daysFromNow(3),
      status: "open",
      source: "ai",
      item_id: itemId["Furnace"],
    },
    {
      title: "Clear the gutters",
      detail:
        "Late-summer storms are common in your area. Clear gutters now so the first heavy rain drains away from the foundation instead of pooling.",
      priority: "normal",
      season: null,
      due_on: daysFromNow(6),
      status: "open",
      source: "ai",
      item_id: itemId["Exterior"],
    },
    {
      title: "Replace the kitchen fire extinguisher",
      detail:
        "Yours reaches its expiration next month. Swapping it early keeps your kitchen protected with zero gap in coverage.",
      priority: "normal",
      season: null,
      due_on: daysFromNow(12),
      status: "open",
      source: "ai",
      item_id: null,
    },
    // Seasonal care — current season is derived at seed time to match "now".
    {
      title: "Service the AC before peak heat",
      detail: "Comfort Air already handled this in the fall — you're covered.",
      priority: "normal",
      season: "summer",
      due_on: null,
      status: "done",
      completed_at: `${daysFromNow(-20)}T12:00:00Z`,
      source: "ai",
      item_id: itemId["Furnace"],
    },
    {
      title: "Reseal the deck",
      detail: "Protects the wood through winter's freeze-thaw cycles.",
      priority: "normal",
      season: "summer",
      due_on: daysFromNow(25),
      status: "open",
      source: "ai",
      item_id: itemId["Exterior"],
    },
    {
      title: "Check exterior caulking",
      detail: "Warm, dry days are ideal for sealing gaps and cracks.",
      priority: "normal",
      season: "summer",
      due_on: daysFromNow(15),
      status: "open",
      source: "ai",
      item_id: itemId["Exterior"],
    },
    {
      title: "Clean the dryer vent",
      detail: "Reduces fire risk and helps loads dry faster.",
      priority: "normal",
      season: "summer",
      due_on: daysFromNow(18),
      status: "open",
      source: "ai",
      item_id: null,
    },
  ] as const

  const { error: taskErr } = await admin.from("care_tasks").insert(
    tasks.map((t) => ({
      home_id: homeId,
      item_id: t.item_id,
      title: t.title,
      detail: t.detail,
      priority: t.priority,
      season: t.season,
      due_on: t.due_on,
      status: t.status,
      completed_at: "completed_at" in t ? t.completed_at : null,
      source: t.source,
    })),
  )
  if (taskErr) throw new Error(`insert care_tasks: ${taskErr.message}`)

  const events = [
    {
      title: "Flushed the water heater",
      note: "By John's Plumbing. Cleared sediment and tested the pressure valve — buys the tank more good years.",
      occurred_on: "2026-03-01",
      item_id: itemId["Water Heater"],
    },
    {
      title: "Furnace annual tune-up",
      note: "By Comfort Air. Kept efficiency high heading into winter and the warranty active.",
      occurred_on: "2025-11-01",
      item_id: itemId["Furnace"],
    },
    {
      title: "Tested all smoke & CO detectors",
      note: "By you. Every detector responded — your family is well protected.",
      occurred_on: "2025-10-01",
      item_id: null,
    },
    {
      title: "Roof inspection",
      note: "No leaks or damage found.",
      occurred_on: "2024-04-01",
      item_id: itemId["Roof"],
    },
    {
      title: "Main shutoff tested",
      note: "Confirmed accessible and working.",
      occurred_on: "2026-03-01",
      item_id: itemId["Plumbing"],
    },
    {
      title: "Breaker panel updated",
      note: "Modernized to handle household load.",
      occurred_on: "2023-09-01",
      item_id: itemId["Electrical"],
    },
    {
      title: "Foundation inspection",
      note: "No settling or cracks noted.",
      occurred_on: "2024-04-01",
      item_id: itemId["Foundation"],
    },
    {
      title: "Deck resealed",
      note: "Protects the wood through winter's freeze-thaw cycles.",
      occurred_on: "2023-06-01",
      item_id: itemId["Exterior"],
    },
  ]

  const { error: eventErr } = await admin.from("care_events").insert(
    events.map((e) => ({
      home_id: homeId,
      item_id: e.item_id,
      title: e.title,
      note: e.note,
      occurred_on: e.occurred_on,
    })),
  )
  if (eventErr) throw new Error(`insert care_events: ${eventErr.message}`)

  return { taskCount: tasks.length, eventCount: events.length }
}

/* ------------------------------- projects ------------------------------- */

type ProjectDef = {
  name: string
  kind: "active" | "idea" | "recommended" | "completed"
  status?: string
  progress?: number
  summary?: string
  budget?: number
  spent?: number
  cost?: number
  value_added?: number
  started_on?: string
  target_end?: string
  completed_year?: number
  metadata: Record<string, unknown>
}

const PROJECT_DEFS: ProjectDef[] = [
  // Active
  {
    name: "Basement Finish",
    kind: "active",
    status: "In progress",
    progress: 45,
    summary: "Turning the unfinished basement into a family room, guest suite, and storage.",
    budget: 38000,
    spent: 17100,
    started_on: "2026-05-01",
    target_end: "2026-09-30",
    metadata: {
      icon: "Layers",
      tone: "wood",
      nextMilestone: "Framing inspection",
      nextWhen: "Next week",
      image: "/projects/basement.png",
      imageAlt: "Basement mid-framing progress photo",
    },
  },
  {
    name: "Backyard Landscaping",
    kind: "active",
    status: "In progress",
    progress: 70,
    summary: "New native plantings, a stone path, and a level lawn for the kids.",
    budget: 12500,
    spent: 8750,
    started_on: "2026-04-01",
    target_end: "2026-07-31",
    metadata: {
      icon: "Trees",
      tone: "sage",
      nextMilestone: "Sod & final grading",
      nextWhen: "This weekend",
      image: "/projects/backyard.png",
      imageAlt: "Backyard landscaping progress photo",
    },
  },
  {
    name: "Primary Bath Refresh",
    kind: "active",
    status: "Planning",
    progress: 15,
    summary: "Updating fixtures, tile, and vanity while keeping the existing footprint.",
    budget: 9800,
    spent: 0,
    metadata: {
      icon: "Bath",
      tone: "navy",
      nextMilestone: "Finalize tile selection",
      nextWhen: "Aug 2026",
      startedLabel: "Quote stage",
      targetEndLabel: "Late 2026",
      image: "/projects/bathroom.png",
      imageAlt: "Bathroom tile inspiration",
    },
  },
  // Recommended
  {
    name: "Replace Water Heater",
    kind: "recommended",
    cost: 1600,
    summary: "Replace the water heater before it fails.",
    metadata: {
      icon: "Flame",
      cost: "$1,600 – $2,400",
      basis: "Based on system age",
      timing: "Best before winter 2027",
      whyNow:
        "Your water heater is entering the last quarter of its expected lifespan. Replacing it proactively greatly reduces the chance of an unexpected winter failure — and lets you do it calmly, on your own schedule.",
      benefits: [
        "Avoids an unexpected cold-water failure.",
        "Lets you schedule the work calmly, not urgently.",
        "Keeps a core system current for resale.",
      ],
      cta: "Start Planning",
    },
  },
  {
    name: "Upgrade Attic Insulation",
    kind: "recommended",
    cost: 2000,
    summary: "Top up attic insulation ahead of winter.",
    metadata: {
      icon: "Wind",
      cost: "$2,000 – $2,600",
      basis: "Based on your climate",
      timing: "Ideally before winter",
      whyNow:
        "Homes built around 2005 often have less attic insulation than today's standards, and Minnesota winters make that heat loss expensive. Topping it up now is one of the highest-return improvements you can make before the cold sets in.",
      benefits: [
        "Lower heating costs — an estimated ~$380/year.",
        "More even, comfortable temperatures upstairs.",
        "One of the highest-return improvements available to you.",
      ],
      cta: "Explore Project",
    },
  },
  {
    name: "Repaint Exterior Trim",
    kind: "recommended",
    cost: 4500,
    summary: "Refresh trim and protect the siding underneath.",
    metadata: {
      icon: "PaintRoller",
      cost: "$4,500 – $6,000",
      basis: "Based on maintenance history",
      timing: "Plan for 2028",
      whyNow:
        "It's been about eight years since your trim was last painted. There's no rush, but refreshing it in the next couple of years will protect the fiber-cement siding underneath and keep the exterior looking sharp.",
      benefits: ["Protects siding from moisture and wear.", "Noticeably improves curb appeal."],
      cta: "Save for Later",
    },
  },
  // Ideas
  {
    name: "Outdoor Lighting",
    kind: "idea",
    summary: "Path and facade lighting for the front walk.",
    budget: 1500,
    metadata: { icon: "Lightbulb", category: "Exterior", roughCost: "$1,500" },
  },
  {
    name: "Stone Patio",
    kind: "idea",
    summary: "Off the kitchen — pairs well with the backyard work.",
    budget: 8000,
    metadata: { icon: "Sun", category: "Outdoor living", roughCost: "$8,000" },
  },
  {
    name: "EV Charger",
    kind: "idea",
    summary: "Level 2 charger; panel already has capacity.",
    budget: 1200,
    metadata: { icon: "Plug", category: "Garage", roughCost: "$1,200" },
  },
  {
    name: "Mudroom Lockers",
    kind: "idea",
    summary: "Built-in cubbies by the side door.",
    budget: 2400,
    metadata: { icon: "Warehouse", category: "Entry", roughCost: "$2,400" },
  },
  {
    name: "Living Room Built-ins",
    kind: "idea",
    summary: "Shelving flanking the fireplace.",
    budget: 3600,
    metadata: { icon: "Armchair", category: "Interior", roughCost: "$3,600" },
  },
  {
    name: "Raised Garden Beds",
    kind: "idea",
    summary: "Cedar beds for vegetables and herbs.",
    budget: 900,
    metadata: { icon: "Sprout", category: "Backyard", roughCost: "$900" },
  },
  // Completed
  {
    name: "Kitchen Remodel",
    kind: "completed",
    summary: "A full transformation — Shaker cabinets, quartz counters, and new appliances.",
    cost: 41200,
    value_added: 52000,
    completed_year: 2025,
    metadata: {
      icon: "ChefHat",
      tone: "wood",
      records: 12,
      image: "/rooms/kitchen.png",
      imageAlt: "Remodeled kitchen with Shaker cabinets and quartz counters",
    },
  },
  {
    name: "Electrical Panel Update",
    kind: "completed",
    summary: "Modernized breakers to comfortably handle the household load.",
    cost: 3200,
    value_added: 4000,
    completed_year: 2023,
    metadata: {
      icon: "Zap",
      tone: "navy",
      records: 4,
      image: "/projects/electrical.png",
      imageAlt: "Modern labeled electrical breaker panel",
    },
  },
  {
    name: "HVAC Installation",
    kind: "completed",
    summary: "New Carrier furnace and AC, still under warranty through 2029.",
    cost: 8500,
    value_added: 9500,
    completed_year: 2019,
    metadata: {
      icon: "Wind",
      tone: "sage",
      records: 6,
      image: "/projects/hvac.png",
      imageAlt: "New high-efficiency furnace in a clean utility room",
    },
  },
  {
    name: "Roof Replacement",
    kind: "completed",
    summary: "Architectural shingles rated for 25–30 years. No leaks since.",
    cost: 13900,
    value_added: 15500,
    completed_year: 2016,
    metadata: {
      icon: "Home",
      tone: "wood",
      records: 5,
      image: "/projects/roof.png",
      imageAlt: "House with a newly replaced architectural shingle roof",
    },
  },
]

async function seedProjects(admin: Admin, homeId: string) {
  const { error } = await admin.from("projects").insert(
    PROJECT_DEFS.map((p) => ({
      home_id: homeId,
      name: p.name,
      kind: p.kind,
      status: p.status ?? null,
      progress: p.progress ?? null,
      summary: p.summary ?? null,
      budget: p.budget ?? null,
      spent: p.spent ?? null,
      cost: p.cost ?? null,
      value_added: p.value_added ?? null,
      started_on: p.started_on ?? null,
      target_end: p.target_end ?? null,
      completed_year: p.completed_year ?? null,
      metadata: p.metadata as Json,
    })),
  )
  if (error) throw new Error(`insert projects: ${error.message}`)
  return PROJECT_DEFS.length
}

/* ------------------------------- insights ------------------------------- */

type InsightDef = {
  category: string
  headline: string
  detail: string
  basis: string
  stat?: string
  action?: string
}

const CARE_INSIGHTS: InsightDef[] = [
  {
    category: "hvac",
    headline: "Your filters clog faster in July and August",
    detail:
      "The last two summers, your HVAC filter needed changing a month early. I'll remind you mid-summer so airflow never drops during the heat.",
    basis: "Based on 2 years of filter-change history",
    action: "Learn why",
  },
  {
    category: "maintenance",
    headline: "One visit could cover several plumbing items",
    detail:
      "John's Plumbing services your water heater, main shutoff, and supply lines. Bundling the next water-heater check with a whole-system look saves a trip fee.",
    basis: "Based on 3 past service records",
    action: "View service records",
  },
  {
    category: "warranty",
    headline: "Your furnace warranty is still working for you",
    detail:
      "Carrier covers parts through 2029 as long as annual servicing continues. Staying with Comfort Air keeps that protection intact — worth it while it lasts.",
    basis: "Based on your warranty certificate",
    action: "View warranty",
  },
]

// "Worth Knowing" facts — genuinely interesting, low-stakes observations.
const WORTH_KNOWING: InsightDef[] = [
  {
    category: "Wealth",
    stat: "$81K",
    headline: "You've added roughly $81K in equity",
    detail:
      "Between the new roof, the kitchen, and steady upkeep, your improvements have outpaced what you spent on them.",
    basis: "Based on your project history and local comparable sales.",
    action: "See your projects",
  },
  {
    category: "Longevity",
    stat: "Top 20%",
    headline: "Your roof has outperformed similar roofs",
    detail:
      "Nine years in with no leaks on record — architectural shingles in your area typically show wear by now.",
    basis: "Compared against roofs of the same age and material nearby.",
  },
  {
    category: "Spending",
    stat: "12% less",
    headline: "You've spent less than neighboring homes",
    detail:
      "Staying ahead of small maintenance has kept your yearly upkeep meaningfully below homes of a similar size and age.",
    basis: "Estimated from typical maintenance costs for homes like yours.",
  },
  {
    category: "Longevity",
    stat: "Top 15%",
    headline: "Your furnace is in the top 15% for lifespan",
    detail:
      "Regular fall servicing has it running like a unit years younger. At this rate it should comfortably pass its expected retirement.",
    basis: "Modeled from its service record and manufacturer data.",
  },
  {
    category: "Your Land",
    stat: "6+ hrs",
    headline: "Your backyard gets enough sun for a vegetable garden",
    detail:
      "The back of the house catches over six hours of direct summer sun — plenty for raised beds, solar path lighting, or a small panel.",
    basis: "Estimated from your orientation and roofline.",
    action: "Plan a project",
  },
  {
    category: "Your Land",
    stat: "3° slope",
    headline: "Your backyard has enough slope for drainage",
    detail:
      "The gentle grade away from the foundation means water naturally moves off — a quiet reason your basement stays dry.",
    basis: "Inferred from your lot grading and foundation notes.",
  },
  {
    category: "Good to Know",
    headline: "Your kitchen paint color is discontinued",
    detail:
      "The 2021 kitchen color has since been retired by the manufacturer. Worth saving the code on file before you need a touch-up.",
    basis: "Matched from your saved paint receipt.",
    action: "View the receipt",
  },
  {
    category: "Trends",
    stat: "38%",
    headline: "You've reduced maintenance by 38%",
    detail:
      "Compared to your first year here, you're spending far less time on reactive fixes — the home has settled into a rhythm.",
    basis: "Based on tasks logged over the last four years.",
    action: "See the trend",
  },
  {
    category: "Good to Know",
    stat: "~1 mo early",
    headline: "Your HVAC filter clogs earlier than most",
    detail:
      "Summer pollen in your area is heavier than average, so your filter loads up about a month sooner than the typical home. I nudge your reminders to match.",
    basis: "Compared against filter cycles for nearby homes.",
    action: "See it in Care",
  },
  {
    category: "Trends",
    headline: "Your water use dips every October",
    detail:
      "Like clockwork, usage drops once you shut down the irrigation for the season — a small sign your system is well timed.",
    basis: "Noticed across several years of seasonal patterns.",
  },
  {
    category: "Your Land",
    stat: "2 trees",
    headline: "Your shade trees are cutting cooling costs",
    detail:
      "The two maples on the west side block afternoon sun in summer, easing the load on your AC during the hottest hours.",
    basis: "Estimated from tree placement and sun exposure.",
  },
]

async function seedInsights(admin: Admin, homeId: string) {
  const all = [...CARE_INSIGHTS, ...WORTH_KNOWING]
  const { error } = await admin.from("insights").insert(
    all.map((i) => ({
      home_id: homeId,
      category: i.category,
      headline: i.headline,
      detail: i.detail,
      basis: i.basis,
      stat: i.stat ?? null,
      action: i.action ?? null,
      source: "seed",
    })),
  )
  if (error) throw new Error(`insert insights: ${error.message}`)
  return all.length
}

/* ----------------------------- timeline events ----------------------------- */

// Entries that duplicate a completed project (roof/hvac/electrical/kitchen) are
// skipped — buildProjectsView() merges the projects table's own completed
// entries into the timeline, so seeding both would double them up.
const TIMELINE_DEFS = [
  {
    year: 2005,
    title: "Home built",
    detail: "Willow Lane completed — poured foundation, 200-amp electrical.",
    kind: "built",
  },
  {
    year: 2015,
    title: "Water heater installed",
    detail: "AO Smith ProLine XE 50-gallon gas unit.",
    kind: "system",
  },
  {
    year: 2027,
    title: "Water heater replacement",
    detail: "Recommended — budget $1,600–$2,400.",
    kind: "future",
  },
  {
    year: 2028,
    title: "Exterior repaint",
    detail: "Recommended — refresh trim and protect siding.",
    kind: "future",
  },
]

async function seedTimeline(admin: Admin, homeId: string) {
  const { error } = await admin.from("timeline_events").insert(
    TIMELINE_DEFS.map((t) => ({
      home_id: homeId,
      year: t.year,
      title: t.title,
      detail: t.detail,
      kind: t.kind,
    })),
  )
  if (error) throw new Error(`insert timeline_events: ${error.message}`)
  return TIMELINE_DEFS.length
}

/* ---------------------------------- main ---------------------------------- */

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.email) {
    console.error("Usage: pnpm dlx tsx scripts/seed.ts --email <user-email> [--wipe]")
    process.exit(1)
  }

  const { url, serviceKey } = loadEnv()
  const admin = createClient<Database>(url, serviceKey, { auth: { persistSession: false } })

  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("id, email")
    .eq("email", args.email)
    .maybeSingle()
  if (profileErr) throw new Error(`find profile for ${args.email}: ${profileErr.message}`)
  if (!profile) throw new Error(`No profile found for ${args.email}. Has this user signed up?`)

  const { data: member, error: memberErr } = await admin
    .from("home_members")
    .select("home_id")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()
  if (memberErr) throw new Error(`find home for ${args.email}: ${memberErr.message}`)
  if (!member) throw new Error(`No home found for ${args.email}. Have them complete onboarding first.`)
  const homeId = member.home_id

  if (args.wipe) {
    console.log(`Wiping existing data for home ${homeId}...`)
    await wipeHome(admin, homeId)
  }

  const roomId = await seedRooms(admin, homeId)
  const itemId = await seedItems(admin, homeId, roomId)
  const { taskCount, eventCount } = await seedCare(admin, homeId, itemId)
  const projectCount = await seedProjects(admin, homeId)
  const insightCount = await seedInsights(admin, homeId)
  const timelineCount = await seedTimeline(admin, homeId)

  console.log("\nSeed complete for home", homeId)
  console.log("  rooms          ", Object.keys(roomId).length)
  console.log("  items          ", Object.keys(itemId).length)
  console.log("  care_tasks     ", taskCount)
  console.log("  care_events    ", eventCount)
  console.log("  projects       ", projectCount)
  console.log("  insights       ", insightCount)
  console.log("  timeline_events", timelineCount)
}

main().catch((err) => {
  console.error("Seed failed:", err.message ?? err)
  process.exit(1)
})
