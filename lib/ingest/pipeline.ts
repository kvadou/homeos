import { createAdminClient } from '@/lib/supabase/admin'
import { careTemplatesFor } from '@/lib/care-data'
import type { Database } from '@/lib/supabase/database.types'

/**
 * The intelligence engine's one shared pipeline (engine doc §1).
 * Runs inside `after()` with the service-role client — outside the request's
 * RLS session (constitution §3.6). Every query is scoped to the triggering
 * file's own home_id; it never trusts an id it wasn't handed.
 */

type FileRow = Database['public']['Tables']['files']['Row']
type Admin = ReturnType<typeof createAdminClient>

/** What extract() returns for every document type — one envelope shape. */
export type ExtractEnvelope = {
  docType: 'receipt' | 'manual' | 'warranty' | 'inspection' | 'photo' | 'other'
  rawText: string
  /** Overall extraction confidence 0-1. */
  confidence: number
  model: string
  /** Type-agnostic cascade writes; applyCascade walks these. */
  proposals: Proposal[]
}

export type Proposal = {
  target: 'items' | 'care_events' | 'care_tasks' | 'insights' | 'timeline_events' | 'contractors'
  action: 'insert' | 'update'
  /** Columns to write (home_id/provenance stamped by the applier). */
  payload: Record<string, unknown>
  /** Natural dedupe key per §3 — stable across re-runs of the same content. */
  dedupeKey: string
  confidence: number
  /** Human line for the review queue: "Add water heater (Rheem)?" */
  summary: string
  /** For action='update': the row to patch. */
  targetId?: string
}

/** Confidence gate (§2): auto ≥ 0.85, queue 0.50–0.85, drop < 0.50. */
const AUTO = 0.85
const QUEUE = 0.5

/** Cascade depth cap (§4): user trigger = 0, direct AI writes = 1, one reasoning pass = 2. */
const MAX_DEPTH = 2

export async function ingestFile(fileId: string): Promise<void> {
  const db = createAdminClient()
  try {
    const file = await loadFile(db, fileId)
    if (!file) return
    if (await alreadyProcessed(db, file)) {
      await stampFile(db, fileId, 'done')
      return
    }
    const ex = await startExtraction(db, file)
    const envelope = await extract(file)
    await finishExtraction(db, ex.id, envelope)
    await applyCascade(db, file, ex.id, envelope, 1)
    await stampFile(db, fileId, 'done')
  } catch (err) {
    // after() failures are invisible to the user — the status flag is the trail.
    console.error(`[ingest] file ${fileId} failed:`, err)
    await stampFile(db, fileId, 'failed').catch(() => {})
  }
}

async function loadFile(db: Admin, fileId: string): Promise<FileRow | null> {
  const { data } = await db.from('files').select('*').eq('id', fileId).maybeSingle()
  return data
}

/**
 * Layer-1 dedupe (§3): another *processed* file in the same home already has
 * this content hash → zero Claude calls, zero writes. The unique index catches
 * identical re-uploads at insert; this guards re-runs and races.
 */
async function alreadyProcessed(db: Admin, file: FileRow): Promise<boolean> {
  if (!file.content_hash) return false
  const { data } = await db
    .from('files')
    .select('id')
    .eq('home_id', file.home_id)
    .eq('content_hash', file.content_hash)
    .eq('extraction_status', 'done')
    .neq('id', file.id)
    .limit(1)
  return Boolean(data?.length)
}

async function startExtraction(db: Admin, file: FileRow) {
  const { data, error } = await db
    .from('extractions')
    .insert({ home_id: file.home_id, file_id: file.id, status: 'processing' })
    .select('id')
    .single()
  if (error || !data) throw error ?? new Error('extraction insert failed')
  return data
}

/**
 * ONE Claude vision call → structured envelope. STUBBED for the skeleton
 * phase: returns fixed receipt-shaped JSON so the cascade, gating, and dedupe
 * are provable with no Claude cost. Step 3 replaces the body with haiku vision.
 */
async function extract(file: FileRow): Promise<ExtractEnvelope> {
  // ponytail: stub — step 3 wires claude-haiku-4-5 vision here, branching on file.type
  return {
    docType: file.type === 'receipt' ? 'receipt' : 'other',
    rawText: `[stub extraction of ${file.name}]`,
    confidence: 0.9,
    model: 'stub',
    proposals: [
      {
        target: 'care_events',
        action: 'insert',
        payload: {
          title: `Purchase — ${file.name}`,
          cost: 100,
          occurred_on: new Date().toISOString().slice(0, 10),
          item_id: file.item_id,
        },
        dedupeKey: `file:${file.id}`,
        confidence: 0.92,
        summary: `Record $100 purchase from ${file.name}?`,
      },
      {
        target: 'items',
        action: 'insert',
        payload: { name: 'Detected appliance (stub)', category: 'appliance', status: 'good' },
        dedupeKey: 'item:appliance:stub-mfr:stub-model',
        confidence: 0.7, // exercises the QUEUE path
        summary: 'Add "Detected appliance (stub)" to your Library?',
      },
      {
        target: 'timeline_events',
        action: 'insert',
        payload: {
          year: new Date().getFullYear(),
          title: `Purchased — ${file.name}`,
          kind: 'system',
        },
        dedupeKey: `timeline:${new Date().getFullYear()}:${file.name}`,
        confidence: 0.9,
        summary: 'Add purchase to your home timeline?',
      },
      {
        target: 'insights',
        action: 'insert',
        payload: {
          category: 'spend',
          headline: 'Stub insight (should be dropped)',
          detail: '',
          basis: 'stub',
        },
        dedupeKey: 'insight:stub-dropped',
        confidence: 0.3, // exercises the DROP path
        summary: 'never shown',
      },
    ],
  }
}

async function finishExtraction(db: Admin, extractionId: string, env: ExtractEnvelope) {
  await db
    .from('extractions')
    .update({
      status: 'done',
      doc_type: env.docType,
      raw_text: env.rawText,
      data: { proposals: env.proposals } as never,
      confidence: env.confidence,
      model: env.model,
      updated_at: new Date().toISOString(),
    })
    .eq('id', extractionId)
}

async function stampFile(db: Admin, fileId: string, status: 'pending' | 'done' | 'failed') {
  await db.from('files').update({ extraction_status: status }).eq('id', fileId)
}

/**
 * Confidence-gated, dedupe-keyed writes (§2, §3). Type-agnostic: walks
 * proposals; each applier owns its table's dedupe semantics. AI writes never
 * re-enter the pipeline (§4) — nothing here fires another cascade.
 */
export async function applyCascade(
  db: Admin,
  file: FileRow,
  extractionId: string,
  env: ExtractEnvelope,
  depth: number,
): Promise<void> {
  if (depth >= MAX_DEPTH) {
    // Structurally unreachable (§4) — if it trips, that is a bug, logged loudly.
    console.error(`[ingest] depth cap hit (${depth}) for file ${file.id} — refusing cascade`)
    return
  }
  const provenance = {
    pipeline: 'ingestFile',
    model: env.model,
    file_id: file.id,
    extraction_id: extractionId,
    depth,
  }

  for (const p of env.proposals) {
    if (p.confidence < QUEUE) {
      await db.from('usage_events').insert({
        user_id: null as never,
        home_id: file.home_id,
        event: 'ai_low_confidence',
        props: { target: p.target, dedupeKey: p.dedupeKey, confidence: p.confidence } as never,
      })
      continue
    }
    if (p.confidence < AUTO) {
      await queueSuggestion(db, file.home_id, p, provenance)
      continue
    }
    await autoApply(db, file.home_id, p, { ...provenance, confidence: p.confidence })
  }
}

async function queueSuggestion(
  db: Admin,
  homeId: string,
  p: Proposal,
  provenance: Record<string, unknown>,
) {
  // unique (home_id, target, dedupe_key) — no duplicate pending cards, ever.
  await db.from('suggestions').upsert(
    {
      home_id: homeId,
      target: p.target,
      action: p.action,
      target_id: p.targetId ?? null,
      payload: p.payload as never,
      summary: p.summary,
      confidence: p.confidence,
      provenance: provenance as never,
      dedupe_key: p.dedupeKey,
    },
    { onConflict: 'home_id,target,dedupe_key', ignoreDuplicates: true },
  )
}

/**
 * Write straight to the target table with provenance stamped. Each target's
 * dedupe key is match-or-write in app code (§3) — partial unique indexes
 * can't be inferred through PostgREST upserts.
 */
async function autoApply(
  db: Admin,
  homeId: string,
  p: Proposal,
  provenance: Record<string, unknown>,
) {
  switch (p.target) {
    case 'care_events': {
      // keyed by file_id: re-extraction corrects cost, never double-counts
      const { data: existing } = await db
        .from('care_events')
        .select('id')
        .eq('home_id', homeId)
        .eq('provenance->>file_id', String(provenance.file_id))
        .maybeSingle()
      if (existing) {
        await db.from('care_events').update({ ...(p.payload as object), provenance: provenance as never }).eq('id', existing.id)
      } else {
        await db.from('care_events').insert({ ...(p.payload as object), home_id: homeId, provenance: provenance as never } as never)
      }
      // spend rollup is recomputed, never incremented — idempotent by construction
      const projectId = (p.payload as { project_id?: string }).project_id
      if (projectId) await recomputeProjectSpend(db, homeId, projectId)
      return
    }
    case 'care_tasks': {
      const slug = (p.payload as { template_slug?: string }).template_slug ?? p.dedupeKey
      const itemId = (p.payload as { item_id?: string | null }).item_id ?? null
      let match = db.from('care_tasks').select('id').eq('home_id', homeId).eq('template_slug', slug)
      match = itemId ? match.eq('item_id', itemId) : match.is('item_id', null)
      const { data: existing } = await match.maybeSingle()
      if (existing) return // do nothing on conflict
      await db.from('care_tasks').insert({
        ...(p.payload as object),
        home_id: homeId,
        template_slug: slug,
        source: 'ai',
        provenance: provenance as never,
      } as never)
      return
    }
    case 'insights': {
      const payload = p.payload as { category?: string }
      const { data: existing } = await db
        .from('insights')
        .select('id')
        .eq('home_id', homeId)
        .eq('category', payload.category ?? 'general')
        .eq('dedupe_slug', p.dedupeKey)
        .maybeSingle()
      const row = {
        ...(p.payload as object),
        home_id: homeId,
        source: 'ai',
        confidence: p.confidence,
        dedupe_slug: p.dedupeKey,
        source_extraction_id: provenance.extraction_id as string,
      }
      if (existing) {
        await db.from('insights').update(row as never).eq('id', existing.id) // update in place
      } else {
        await db.from('insights').insert(row as never)
      }
      return
    }
    case 'timeline_events': {
      const payload = p.payload as { year: number; title: string }
      const { data: existing } = await db
        .from('timeline_events')
        .select('id')
        .eq('home_id', homeId)
        .eq('year', payload.year)
        .eq('title', payload.title)
        .maybeSingle()
      if (existing) return
      await db.from('timeline_events').insert({ ...(p.payload as object), home_id: homeId, provenance: provenance as never } as never)
      return
    }
    case 'items':
    case 'contractors':
      // New entities are never silently inserted regardless of confidence —
      // match-or-create requires user confirmation until step 3's fuzzy matcher.
      await queueSuggestion(db, homeId, p, provenance)
      return
  }
}

async function recomputeProjectSpend(db: Admin, homeId: string, projectId: string) {
  const { data } = await db
    .from('care_events')
    .select('cost')
    .eq('home_id', homeId)
    .eq('project_id', projectId)
  const spent = (data ?? []).reduce((sum, e) => sum + (Number(e.cost) || 0), 0)
  await db.from('projects').update({ spent }).eq('id', projectId).eq('home_id', homeId)
}

/**
 * Rule-based maintenance seeding for a new item (§7.6) — no Claude call.
 * Runs in after() from createItem; same cascade machinery, template map data.
 */
export async function seedCareTasksForItem(input: {
  homeId: string
  itemId: string
  name: string
  category: string
}): Promise<void> {
  const db = createAdminClient()
  const templates = careTemplatesFor(input.category, input.name)
  const provenance = { pipeline: 'seedCareTasks', model: 'none', item_id: input.itemId, depth: 1 }
  for (const t of templates) {
    await autoApply(
      db,
      input.homeId,
      {
        target: 'care_tasks',
        action: 'insert',
        payload: {
          item_id: input.itemId,
          title: t.title,
          detail: t.detail,
          priority: t.priority,
          season: t.season ?? null,
          recurrence: t.recurrence,
          template_slug: t.slug,
        },
        dedupeKey: t.slug,
        confidence: 1, // rule-based, not a model guess
        summary: t.title,
      },
      provenance,
    )
  }
}
