import type { LucideIcon } from 'lucide-react'
import { Flame, Droplet, Snowflake, Wind, Palette, TrendingUp } from 'lucide-react'

/* Photo hotspot annotation — AI pointing at exactly what it's talking about. */
export type Hotspot = { x: number; y: number; label: string; tone?: 'sage' | 'wood' | 'navy' }

/* Rich answer blocks. Real answers today are just `lead` + `text` (see
   textToBlocks); the richer variants stay in the type system and in
   AnswerBlockView so we can render them once the model synthesizes them. */
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

/* What HomeOS stores as an assistant message's content, and what the client
   renders. Kept in sync with the /api/ask route handler. */
export type AnswerContent = { blocks: AnswerBlock[] }

/* Starter chips on the empty Ask page. Double as the pool for follow-up chips. */
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

/* Split a plain-text answer into a lead paragraph + trailing text paragraphs.
   Shared by the /api/ask route (persistence) and the client (progressive
   render) so both derive the same block shape. */
export function textToBlocks(text: string): AnswerBlock[] {
  const paras = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (paras.length === 0) return []
  const [lead, ...rest] = paras
  return [
    { type: 'lead', text: lead },
    ...rest.map((t): AnswerBlock => ({ type: 'text', text: t })),
  ]
}
