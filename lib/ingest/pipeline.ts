import { createAdminClient } from '@/lib/supabase/admin'
import { careTemplatesFor } from '@/lib/care-data'
import { extract } from '@/lib/ingest/extract'
import { forecastForItem, inspectionSummary } from '@/lib/ingest/reason'
import type { Database } from '@/lib/supabase/database.types'

/**
 * The intelligence engine's one shared pipeline (engine doc §1).
 * Runs inside `after()` with the service-role client — outside the request's
 * RLS session (constitution §3.6). Every query is scoped to the triggering
 * file's own home_id; it never trusts an id it wasn't handed.
 */

type FileRow = Database['public']['Tables']['files']['Row']
type Admin = ReturnType<typeof createAdminClient>

/** One flagged inspection finding (extract.ts), carried through for the §7.4 summary. */
export type Finding = { system: string; condition: string; severity: string | null; recommendation: string | null }

/** What extract() returns for every document type — one envelope shape. */
export type ExtractEnvelope = {
  docType: 'receipt' | 'manual' | 'warranty' | 'inspection' | 'insurance' | 'photo' | 'other'
  rawText: string
  /** Overall extraction confidence 0-1. */
  confidence: number
  model: string
  /** Type-agnostic cascade writes; applyCascade walks these. */
  proposals: Proposal[]
  /** Inspection findings, passed to the reasoning pass (lossy to re-derive from proposals). */
  findings?: Finding[]
}

export type Proposal = {
  target: 'items' | 'care_events' | 'care_tasks' | 'insights' | 'timeline_events' | 'contractors' | 'warranties' | 'home_facts' | 'projects' | 'files'
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
    const envelope = await extract(db, file)
    await finishExtraction(db, ex.id, envelope)
    await applyCascade(db, file, ex.id, envelope, 1)
    // One depth-2 reasoning pass, at most (§1 budget): inspection summary XOR
    // a replacement forecast for whichever item this document touched.
    const updated = envelope.proposals.find((p) => p.target === 'items' && p.action === 'update' && p.targetId)
    const forecastItemId = updated?.targetId ?? file.item_id
    if (envelope.docType === 'inspection' && envelope.findings?.length) {
      await inspectionSummary(db, file.home_id, file.id, ex.id, envelope.findings)
    } else if (forecastItemId) {
      await forecastForItem(db, file.home_id, forecastItemId)
    }
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

/** New entities are never silently created — queued for review even at auto confidence. */
function isNewEntity(p: Proposal): boolean {
  return p.action === 'insert' && (p.target === 'items' || p.target === 'contractors' || p.target === 'projects')
}

/**
 * Confidence-gated, dedupe-keyed writes (§2, §3). Type-agnostic: walks
 * proposals; each applier owns its table's dedupe semantics. AI writes never
 * re-enter the pipeline (§4) — nothing here fires another cascade.
 *
 * Policy (§2): new entities (items/contractors/projects inserts) always land in
 * the review queue regardless of confidence; everything else follows the gate
 * (auto ≥ 0.85, queue 0.50–0.85, drop < 0.50).
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
    // New entities go to the queue even at auto confidence — user confirms creation.
    if (isNewEntity(p) || p.confidence < AUTO) {
      await queueSuggestion(db, file.home_id, p, provenance)
      continue
    }
    await autoApply(db, file.home_id, p, { ...provenance, confidence: p.confidence })
  }
}

export async function queueSuggestion(
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
 * can't be inferred through PostgREST upserts. Exported for acceptSuggestion,
 * which applies a user-confirmed proposal through the same path.
 */
export async function autoApply(
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
    case 'warranties': {
      // keyed by file_id: re-extraction corrects the warranty, never stacks
      const fileId = (p.payload as { file_id?: string }).file_id ?? String(provenance.file_id)
      const { data: existing } = await db
        .from('warranties')
        .select('id')
        .eq('home_id', homeId)
        .eq('file_id', fileId)
        .maybeSingle()
      const row = {
        ...(p.payload as object),
        home_id: homeId,
        extraction_id: provenance.extraction_id as string,
        source_kind: 'extraction',
        confidence: p.confidence,
      }
      if (existing) {
        await db.from('warranties').update(row as never).eq('id', existing.id)
      } else {
        await db.from('warranties').insert(row as never)
      }
      return
    }
    case 'home_facts': {
      // Pattern A (object-model §2.14): wholly-AI row with a supersession lifecycle.
      const payload = p.payload as {
        statement: string
        predicate?: string | null
        object_value?: string | null
        category?: string | null
        subject_table?: string | null
        subject_id?: string | null
      }
      const row = {
        statement: payload.statement,
        predicate: payload.predicate ?? null,
        object_value: payload.object_value ?? null,
        category: payload.category ?? null,
        subject_table: payload.subject_table ?? null,
        subject_id: payload.subject_id ?? null,
        home_id: homeId,
        source_kind: 'extraction',
        source_extraction_id: (provenance.extraction_id as string) ?? null,
        confidence: p.confidence,
        evidence: [{ kind: 'file', id: provenance.file_id }],
        // embedding left null — fill deferred by design (object-model §2.14).
      }
      // (a) structured slot: newest value for (subject, predicate) supersedes the prior one.
      if (payload.predicate && payload.subject_id) {
        const { data: prior } = await db
          .from('home_facts')
          .select('id, statement')
          .eq('home_id', homeId)
          .eq('subject_table', payload.subject_table ?? 'items')
          .eq('subject_id', payload.subject_id)
          .eq('predicate', payload.predicate)
          .eq('is_current', true)
          .limit(1)
          .maybeSingle()
        if (prior) {
          if (prior.statement === payload.statement) return // identical slot value — no-op
          const { data: inserted } = await db.from('home_facts').insert(row as never).select('id').single()
          if (inserted) {
            await db.from('home_facts').update({ is_current: false, superseded_by: inserted.id }).eq('id', prior.id)
          }
          return
        }
        await db.from('home_facts').insert(row as never)
        return
      }
      // (b) freeform: exact-statement dedupe among current facts.
      const { data: dup } = await db
        .from('home_facts')
        .select('id')
        .eq('home_id', homeId)
        .eq('statement', payload.statement)
        .eq('is_current', true)
        .limit(1)
        .maybeSingle()
      if (dup) return
      await db.from('home_facts').insert(row as never)
      return
    }
    case 'items': {
      if (p.action === 'update' && p.targetId) {
        await fillItemFields(db, homeId, p, provenance)
        return
      }
      // applyCascade queues new-entity inserts (isNewEntity) and acceptSuggestion
      // owns the items special-case (provenance + care seeding). This plain insert
      // is a defensive floor for an items-insert that reaches autoApply directly.
      await db.from('items').insert({ ...(p.payload as object), home_id: homeId } as never)
      return
    }
    case 'contractors': {
      // Real insert (bug fix): acceptSuggestion routes confirmed contractors here.
      // Dedupe on a case-insensitive name match within the home.
      const name = (p.payload as { name?: string }).name ?? ''
      if (name) {
        const { data: existing } = await db
          .from('contractors')
          .select('id')
          .eq('home_id', homeId)
          .ilike('name', name)
          .limit(1)
          .maybeSingle()
        if (existing) return
      }
      await db.from('contractors').insert({ ...(p.payload as object), home_id: homeId } as never)
      return
    }
    case 'projects': {
      // Dedupe on (home_id, name, kind) — same recommendation never stacks.
      const payload = p.payload as { name?: string; kind?: string }
      const { data: existing } = await db
        .from('projects')
        .select('id')
        .eq('home_id', homeId)
        .eq('name', payload.name ?? '')
        .eq('kind', payload.kind ?? 'idea')
        .maybeSingle()
      if (existing) return
      await db.from('projects').insert({ ...(p.payload as object), home_id: homeId } as never)
      return
    }
    case 'files': {
      // Link a file to the item it depicts. Never overwrite an existing link.
      if (!p.targetId) return
      const itemId = (p.payload as { item_id?: string }).item_id
      if (!itemId) return
      const { data: existing } = await db
        .from('files')
        .select('item_id')
        .eq('id', p.targetId)
        .eq('home_id', homeId)
        .maybeSingle()
      if (!existing || existing.item_id) return
      await db.from('files').update({ item_id: itemId } as never).eq('id', p.targetId).eq('home_id', homeId)
      return
    }
  }
}

/**
 * Pattern-B fill (§2): AI may only fill fields that are currently empty or
 * that it already owns (a field_provenance row exists). A user-authored field
 * — no provenance row — is frozen; AI never overwrites it.
 */
async function fillItemFields(
  db: Admin,
  homeId: string,
  p: Proposal,
  provenance: Record<string, unknown>,
) {
  const itemId = p.targetId!
  const { data: item } = await db.from('items').select('*').eq('id', itemId).eq('home_id', homeId).maybeSingle()
  if (!item) return
  const { data: owned } = await db
    .from('field_provenance')
    .select('field')
    .eq('entity_table', 'items')
    .eq('entity_id', itemId)
  const aiOwned = new Set((owned ?? []).map((r) => r.field))

  const updates: Record<string, unknown> = {}
  for (const [field, value] of Object.entries(p.payload)) {
    if (value == null) continue
    const current = (item as Record<string, unknown>)[field]
    if (current == null || current === '' || aiOwned.has(field)) updates[field] = value
  }
  if (!Object.keys(updates).length) return

  await db.from('items').update({ ...updates, updated_at: new Date().toISOString() } as never).eq('id', itemId)
  for (const field of Object.keys(updates)) {
    await db.from('field_provenance').upsert(
      {
        home_id: homeId,
        entity_table: 'items',
        entity_id: itemId,
        field,
        source_kind: 'extraction',
        extraction_id: (provenance.extraction_id as string) ?? null,
        confidence: p.confidence,
        model: (provenance.model as string) ?? null,
      },
      { onConflict: 'entity_table,entity_id,field' },
    )
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
