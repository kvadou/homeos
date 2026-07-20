import Anthropic from '@anthropic-ai/sdk'
import { after } from 'next/server'
import { getApiContext, type ApiContext } from '@/lib/supabase/api-auth'
import { logUsage } from '@/lib/usage'
import { rateLimited } from '@/lib/rate-limit'
import { textToBlocks, visibleAnswerText, parseCitations, usedCitations } from '@/lib/ask-data'
import { costRefFor } from '@/lib/cost-ref'
import { captureAskFacts } from '@/lib/ingest/reason'

export const runtime = 'nodejs'

const MODEL = 'claude-sonnet-5'

const SYSTEM_INTRO = `You are GatheredOS, a calm, knowledgeable assistant that helps a homeowner understand and care for their specific home.

You answer only from the home's own records, provided below as JSON. Ground every answer in those facts and cite them inline as you go, e.g. "Your water heater (a Rheem, installed 2019)...". When a fact isn't in the records, say so plainly rather than inventing it — never make up an appliance, date, brand, cost, or person that isn't in the context.

Be specific and concise. Lead with the direct answer, then the reasoning, then a recommended next action when there's an obvious one. Write in short plain-prose paragraphs separated by a blank line (no headings, no markdown bullets, no bold). The first paragraph is the headline answer; keep it to a sentence or two.

Citations. Every dollar figure, date, brand, model, person, or location in your answer must carry an inline marker like [c1], [c2], bound to a specific source object from the records below — OR the sentence must be explicitly hedged as general guidance. A factual claim with neither a marker nor a hedge is not allowed. General-knowledge claims (typical lifespans, how-to steps, rules of thumb) use a citation with type "general" and ref_id null, and should read as general ("In general…", "As a rule of thumb…") so the reader never mistakes a rule of thumb for a fact about their home.

Confidence, chosen per claim (one answer routinely mixes all three):
- known-from-records: grounded in a cited record — state it plainly. "Your furnace is a Carrier installed in 2011 [c1]."
- estimated-from-home-profile: derived from home attributes plus typical lifespan/cost, not directly logged — hedge it. "Based on that 2011 install and a typical 15-20 year furnace life, you likely have 4-9 years left [c1]."
- general-knowledge: not specific to this home — flag it. "In general, flushing a tank water heater once a year prevents sediment buildup."
When a record is missing, degrade honestly from known to estimated to general and say which, e.g. "I don't have your furnace's install date on file, so this is a general estimate."

Output protocol. Write the answer as plain prose with the inline [cN] markers. Then, after the final paragraph, emit one line that begins with exactly @@CITATIONS@@ followed by a single JSON array of citation objects, one per marker you used, shaped:
{"id":"c1","type":"item|file|care_event|care_task|project|contractor|timeline|home_fact|warranty|extraction|home_profile|general","ref_id":"<the row's id, or null for general/home_profile>","label":"short human label","detail":"optional extra detail","confidence":"known|estimated|general"}
Use the real id values from the records for ref_id. If you used no markers, still emit "@@CITATIONS@@ []". Never write the word @@CITATIONS@@ anywhere except that final line.`

/** Compact, size-capped snapshot of the home for grounding the answer. */
async function buildHomeContext(
  supabase: ApiContext['supabase'],
  homeId: string,
) {
  const [
    itemsRes,
    tasksRes,
    eventsRes,
    projectsRes,
    insightsRes,
    contractorsRes,
    filesRes,
    timelineRes,
    roomsRes,
    warrantiesRes,
    factsRes,
  ] = await Promise.all([
    supabase
      .from('items')
      .select('id, name, category, manufacturer, model, installed_on, lifespan_years, status, summary')
      .eq('home_id', homeId)
      .order('created_at', { ascending: true })
      .limit(50),
    supabase
      .from('care_tasks')
      .select('id, title, detail, due_on, priority, season')
      .eq('home_id', homeId)
      .eq('status', 'open')
      .order('due_on', { ascending: true, nullsFirst: false })
      .limit(25),
    supabase
      .from('care_events')
      .select('id, title, occurred_on, cost, note')
      .eq('home_id', homeId)
      .order('occurred_on', { ascending: false })
      .limit(12),
    supabase
      .from('projects')
      .select('id, name, status, kind, summary, budget, spent, progress, value_added')
      .eq('home_id', homeId)
      .order('updated_at', { ascending: false })
      .limit(20),
    supabase
      .from('insights')
      .select('id, headline, detail, category, stat, action')
      .eq('home_id', homeId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('contractors')
      .select('id, name, company, phone, email, notes')
      .eq('home_id', homeId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('files')
      .select('id, name, type, item_id, project_id, created_at')
      .eq('home_id', homeId)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('timeline_events')
      .select('id, year, title, detail, kind')
      .eq('home_id', homeId)
      .order('year', { ascending: false })
      .limit(30),
    supabase
      .from('rooms')
      .select('id, slug, name, summary')
      .eq('home_id', homeId)
      .order('created_at', { ascending: true })
      .limit(20),
    supabase
      .from('warranties')
      .select('id, provider, kind, coverage, starts_on, ends_on, status, item_id')
      .eq('home_id', homeId)
      .order('ends_on', { ascending: true, nullsFirst: false })
      .limit(20),
    supabase
      .from('home_facts')
      .select('id, statement, predicate, object_value, category, subject_table, subject_id, confidence')
      .eq('home_id', homeId)
      .eq('is_current', true)
      .order('created_at', { ascending: false })
      .limit(40),
  ])

  return {
    items: itemsRes.data ?? [],
    open_care_tasks: tasksRes.data ?? [],
    recent_care_events: eventsRes.data ?? [],
    projects: projectsRes.data ?? [],
    active_insights: insightsRes.data ?? [],
    contractors: contractorsRes.data ?? [],
    files: filesRes.data ?? [],
    timeline_events: timelineRes.data ?? [],
    rooms: roomsRes.data ?? [],
    warranties: warrantiesRes.data ?? [],
    home_facts: factsRes.data ?? [],
  }
}

export async function POST(req: Request) {
  const ctx = await getApiContext(req)
  if (!ctx) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { supabase, user, home } = ctx

  if (await rateLimited({ event: 'question_asked', userId: user.id, homeId: home.id, limit: 30, windowMinutes: 60 })) {
    return Response.json(
      { success: false, error: 'Rate limit reached. Try again soon.' },
      { status: 429, headers: { 'Retry-After': '3600' } },
    )
  }

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

Home profile (cite as type "home_profile", ref_id null):
${JSON.stringify({
    name: home.name,
    property_type: home.property_type,
    year_built: home.year_built,
    beds: home.beds,
    baths: home.baths,
    sqft: home.sqft,
    location: [home.city, home.state].filter(Boolean).join(', ') || null,
    features: home.features,
    goals: home.goals,
  })}

Home records (the only facts you may use):
${JSON.stringify(context)}

Cost reference (national benchmark data adjusted for the home's state — NOT this home's records; cite as type "general", ref_id null, confidence "estimated", and phrase as an estimate):
${JSON.stringify(costRefFor({ state: home.state }))}`

  void logUsage('question_asked', {}, home.id)

  // §7.13: if the question STATED a durable fact about the home, queue it for
  // review (never a silent write). Off the response path — runs after streaming.
  after(() => captureAskFacts(home.id, user.id, question))

  const anthropic = new Anthropic()
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = ''
      try {
        const claude = anthropic.messages.stream({
          model: MODEL,
          max_tokens: 1536,
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
        // Split the citation tail off the prose, then keep only citations the
        // answer actually referenced with a [cN] marker.
        const answerText = visibleAnswerText(full)
        const citations = usedCitations(answerText, parseCitations(full))
        // Persist the assistant turn in the same block shape the client renders.
        await supabase
          .from('messages')
          // textToBlocks yields only serializable lead/text blocks; the AnswerBlock
          // union nominally includes an icon component, so cast to satisfy Json.
          .insert({
            conversation_id: convId,
            role: 'assistant',
            content: { blocks: textToBlocks(answerText), citations } as never,
          })
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
