import Anthropic from '@anthropic-ai/sdk'
import { requireUser, requireHome } from '@/lib/supabase/home'
import { logUsage } from '@/lib/usage'
import { textToBlocks } from '@/lib/ask-data'

export const runtime = 'nodejs'

const MODEL = 'claude-sonnet-5'

const SYSTEM_INTRO = `You are HomeOS, a calm, knowledgeable assistant that helps a homeowner understand and care for their specific home.

You answer only from the home's own records, provided below as JSON. Ground every answer in those facts and cite them inline as you go, e.g. "Your water heater (a Rheem, installed 2019)...". When a fact isn't in the records, say so plainly rather than inventing it — never make up an appliance, date, brand, cost, or person that isn't in the context.

Be specific and concise. Lead with the direct answer, then the reasoning, then a recommended next action when there's an obvious one. Write in short plain-prose paragraphs separated by a blank line (no headings, no markdown bullets, no bold). The first paragraph is the headline answer; keep it to a sentence or two.`

/** Compact, size-capped snapshot of the home for grounding the answer. */
async function buildHomeContext(
  supabase: Awaited<ReturnType<typeof requireUser>>['supabase'],
  homeId: string,
) {
  const [itemsRes, tasksRes, eventsRes, projectsRes, insightsRes] = await Promise.all([
    supabase
      .from('items')
      .select('name, category, manufacturer, model, installed_on, lifespan_years, status, summary')
      .eq('home_id', homeId)
      .order('created_at', { ascending: true })
      .limit(50),
    supabase
      .from('care_tasks')
      .select('title, detail, due_on, priority, season')
      .eq('home_id', homeId)
      .eq('status', 'open')
      .order('due_on', { ascending: true, nullsFirst: false })
      .limit(25),
    supabase
      .from('care_events')
      .select('title, occurred_on, cost, note')
      .eq('home_id', homeId)
      .order('occurred_on', { ascending: false })
      .limit(12),
    supabase
      .from('projects')
      .select('name, status, kind, summary, budget, spent, progress, value_added')
      .eq('home_id', homeId)
      .order('updated_at', { ascending: false })
      .limit(20),
    supabase
      .from('insights')
      .select('headline, detail, category, stat, action')
      .eq('home_id', homeId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(12),
  ])

  return {
    items: itemsRes.data ?? [],
    open_care_tasks: tasksRes.data ?? [],
    recent_care_events: eventsRes.data ?? [],
    projects: projectsRes.data ?? [],
    active_insights: insightsRes.data ?? [],
  }
}

export async function POST(req: Request) {
  const { supabase, user } = await requireUser()
  const home = await requireHome()

  let body: { conversationId?: string; question?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const question = body.question?.trim()
  if (!question) {
    return Response.json({ success: false, error: 'A question is required' }, { status: 400 })
  }

  // Reuse the conversation if the client passed one it owns; otherwise start one.
  let conversationId = body.conversationId ?? null
  if (conversationId) {
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('home_id', home.id)
      .maybeSingle()
    if (!existing) conversationId = null
  }
  if (!conversationId) {
    const { data: created, error } = await supabase
      .from('conversations')
      .insert({ home_id: home.id, user_id: user.id, question })
      .select('id')
      .single()
    if (error || !created) {
      return Response.json({ success: false, error: 'Could not start conversation' }, { status: 500 })
    }
    conversationId = created.id
  }

  const convId = conversationId
  await supabase
    .from('messages')
    .insert({ conversation_id: convId, role: 'user', content: { text: question } })

  const context = await buildHomeContext(supabase, home.id)
  const system = `${SYSTEM_INTRO}

Home profile:
${JSON.stringify({
    name: home.name,
    property_type: home.property_type,
    year_built: home.year_built,
    beds: home.beds,
    baths: home.baths,
    sqft: home.sqft,
    location: [home.city, home.state].filter(Boolean).join(', ') || null,
  })}

Home records (the only facts you may use):
${JSON.stringify(context)}`

  void logUsage('question_asked', {}, home.id)

  const anthropic = new Anthropic()
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = ''
      try {
        const claude = anthropic.messages.stream({
          model: MODEL,
          max_tokens: 1024,
          thinking: { type: 'disabled' },
          output_config: { effort: 'low' },
          system,
          messages: [{ role: 'user', content: question }],
        })
        claude.on('text', (delta) => {
          full += delta
          controller.enqueue(encoder.encode(delta))
        })
        await claude.finalMessage()
      } catch {
        if (!full) {
          const msg = 'I hit a snag reaching my reasoning engine. Please try that question again in a moment.'
          full = msg
          controller.enqueue(encoder.encode(msg))
        }
      } finally {
        // Persist the assistant turn in the same block shape the client renders.
        await supabase
          .from('messages')
          // textToBlocks yields only serializable lead/text blocks; the AnswerBlock
          // union nominally includes an icon component, so cast to satisfy Json.
          .insert({ conversation_id: convId, role: 'assistant', content: { blocks: textToBlocks(full) } as never })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'x-conversation-id': convId,
    },
  })
}
