import Anthropic from '@anthropic-ai/sdk'
import type { Database } from '@/lib/supabase/database.types'
import type { createAdminClient } from '@/lib/supabase/admin'
import type { ExtractEnvelope, Proposal } from '@/lib/ingest/pipeline'

/**
 * ONE Claude vision call per document (engine doc §5): claude-haiku-4-5,
 * structured extraction is not a reasoning task. Receipt is the fully-mapped
 * doc type (step 3); other types still classify + transcribe (feeds FTS) and
 * yield whatever cross-cutting fields they contain (model plates, warranty terms).
 */

const MODEL = 'claude-haiku-4-5'

type FileRow = Database['public']['Tables']['files']['Row']
type Admin = ReturnType<typeof createAdminClient>

const MEDIA_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  pdf: 'application/pdf',
}

/**
 * ponytail: plain JSON prompting, not output_config structured outputs —
 * haiku's grammar compilation rejected/timed out on this schema twice
 * ("Schema is too complex", "Grammar compilation timed out"). The shape is
 * described in the prompt and validated in code; malformed JSON lands the
 * extraction in status='failed', which is retryable. Revisit if haiku's
 * schema compiler improves.
 */
const JSON_SHAPE = `{
  "doc_type": "receipt" | "manual" | "warranty" | "inspection" | "insurance" | "other",
  "raw_text": "transcription of the legible text, condensed, max ~2000 chars",
  "confidence": 0.0-1.0 overall extraction confidence,
  "vendor": string | null,
  "purchase_date": "YYYY-MM-DD" | null,
  "total": number | null (grand total paid, if a purchase document),
  "line_items": ["one entry per purchased line, e.g. Grill cover — $89.99"] | null,
  "item_name": "the appliance/system this document is about, e.g. Water heater" | null,
  "item_category": "system" | "appliance" | "paint" | "exterior" | "yard" | "measurement" | null,
  "manufacturer": string | null,
  "model": string | null,
  "serial": string | null,
  "warranty_provider": string | null,
  "warranty_term_months": number | null,
  "warranty_kind": "manufacturer" | "extended" | "home-warranty" | "labor" | null
}`

const CATEGORIES = new Set(['system', 'appliance', 'paint', 'exterior', 'yard', 'measurement'])
const WARRANTY_KINDS = new Set(['manufacturer', 'extended', 'home-warranty', 'labor'])

type Extracted = {
  doc_type: 'receipt' | 'manual' | 'warranty' | 'inspection' | 'insurance' | 'other'
  raw_text: string
  confidence: number
  vendor: string | null
  purchase_date: string | null
  total: number | null
  line_items: string[] | null
  item_name: string | null
  item_category: string | null
  manufacturer: string | null
  model: string | null
  serial: string | null
  warranty_provider: string | null
  warranty_term_months: number | null
  warranty_kind: string | null
}

export async function extract(db: Admin, file: FileRow): Promise<ExtractEnvelope> {
  const ext = (file.storage_path.split('.').pop() ?? '').toLowerCase()
  const mediaType = MEDIA_TYPES[ext]
  if (!mediaType) {
    // ponytail: docx/txt/etc. not parseable via vision yet — classify-only envelope
    return { docType: 'other', rawText: '', confidence: 0, model: 'none', proposals: [] }
  }

  const { data: blob, error } = await db.storage.from('home-files').download(file.storage_path)
  if (error || !blob) throw error ?? new Error(`storage download failed: ${file.storage_path}`)
  const b64 = Buffer.from(await blob.arrayBuffer()).toString('base64')

  const client = new Anthropic()
  const source = { type: 'base64' as const, media_type: mediaType, data: b64 }
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          mediaType === 'application/pdf'
            ? { type: 'document' as const, source: { ...source, media_type: 'application/pdf' as const } }
            : { type: 'image' as const, source: source as { type: 'base64'; media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'; data: string } },
          {
            type: 'text',
            text: `This document was uploaded to a homeowner's records app (user tagged it "${file.type}", name "${file.name}"). Classify it and extract every field you can read. Only report values actually visible in the document — use null for anything absent or illegible, and reflect real uncertainty in the confidence value.

Respond with ONLY a single JSON object (no markdown fences, no prose) exactly matching this shape:
${JSON_SHAPE}`,
          },
        ],
      },
    ],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') throw new Error('extraction returned no text block')
  const data = parseJson(textBlock.text)
  // enum-ish fields are free text in the flat schema — validate here
  if (data.item_category && !CATEGORIES.has(data.item_category)) data.item_category = null
  if (data.warranty_kind && !WARRANTY_KINDS.has(data.warranty_kind)) data.warranty_kind = null

  return {
    docType: data.doc_type,
    rawText: data.raw_text,
    confidence: data.confidence,
    model: MODEL,
    proposals: await buildProposals(db, file, data),
  }
}

/**
 * Deterministic field → proposal mapping (§7.1). The model reports what it
 * saw; this code decides what gets written, with stable dedupe keys.
 */
async function buildProposals(db: Admin, file: FileRow, d: Extracted): Promise<Proposal[]> {
  const proposals: Proposal[] = []
  const conf = () => d.confidence

  // Spend: one care_event keyed by file_id — re-extraction corrects, never doubles
  if (d.doc_type === 'receipt' && d.total != null && d.total > 0) {
    proposals.push({
      target: 'care_events',
      action: 'insert',
      payload: {
        title: `Purchase — ${d.vendor ?? file.name}`,
        note: d.line_items?.slice(0, 5).join('; ') ?? null,
        cost: d.total,
        occurred_on: d.purchase_date ?? file.created_at.slice(0, 10),
        item_id: file.item_id,
      },
      dedupeKey: `file:${file.id}`,
      confidence: conf(),
      summary: `Record $${d.total.toFixed(2)} purchase from ${d.vendor ?? file.name}?`,
    })
  }

  // Item: match (category, manufacturer, model) in home → fill missing fields; else propose create
  if (d.manufacturer || d.model || d.item_name) {
    const match = await matchItem(db, file, d)
    const fields: Record<string, unknown> = {}
    if (d.manufacturer) fields.manufacturer = d.manufacturer
    if (d.model) fields.model = d.model
    if (d.serial) fields.serial = d.serial
    if (d.purchase_date && d.doc_type === 'receipt') fields.installed_on = d.purchase_date

    if (match) {
      proposals.push({
        target: 'items',
        action: 'update',
        targetId: match.id,
        payload: fields,
        dedupeKey: `item-fill:${match.id}:${file.id}`,
        confidence: conf(),
        summary: `Fill in ${match.name} details from ${file.name}?`,
      })
    } else {
      proposals.push({
        target: 'items',
        action: 'insert',
        payload: {
          name: d.item_name ?? [d.manufacturer, d.model].filter(Boolean).join(' '),
          category: d.item_category ?? 'appliance',
          status: 'good',
          ...fields,
        },
        dedupeKey: `item:${(d.item_category ?? 'appliance').toLowerCase()}:${(d.manufacturer ?? '?').toLowerCase()}:${(d.model ?? d.item_name ?? '?').toLowerCase()}`,
        confidence: conf(),
        summary: `Add "${d.item_name ?? d.manufacturer + ' ' + d.model}" to your Library?`,
      })
    }
  }

  // Warranty: first-class row regardless of the file's tagged type (§7.3)
  if (d.warranty_term_months != null || (d.doc_type === 'warranty' && d.warranty_provider)) {
    const starts = d.purchase_date
    const ends =
      starts && d.warranty_term_months != null
        ? addMonths(starts, d.warranty_term_months)
        : null
    proposals.push({
      target: 'warranties',
      action: 'insert',
      payload: {
        provider: d.warranty_provider ?? d.manufacturer ?? d.vendor,
        kind: d.warranty_kind ?? 'manufacturer',
        term_months: d.warranty_term_months,
        starts_on: starts,
        ends_on: ends,
        item_id: file.item_id,
        file_id: file.id,
      },
      dedupeKey: `warranty:${file.id}`,
      confidence: conf(),
      summary: `Save the ${d.warranty_provider ?? d.manufacturer ?? ''} warranty${d.warranty_term_months ? ` (${Math.round(d.warranty_term_months / 12)} yr)` : ''}?`,
    })
  }

  // Timeline: purchase year entry
  if (d.doc_type === 'receipt' && d.purchase_date && (d.item_name || d.total != null)) {
    const year = Number(d.purchase_date.slice(0, 4))
    if (Number.isFinite(year)) {
      proposals.push({
        target: 'timeline_events',
        action: 'insert',
        payload: {
          year,
          title: `Purchased ${d.item_name ?? `from ${d.vendor ?? 'a vendor'}`}`,
          detail: d.total != null ? `$${d.total.toFixed(2)}${d.vendor ? ` at ${d.vendor}` : ''}` : null,
          kind: 'system',
        },
        dedupeKey: `timeline:${year}:${d.item_name ?? file.name}`,
        confidence: conf(),
        summary: `Add "${d.item_name ?? file.name}" purchase to your home timeline?`,
      })
    }
  }

  return proposals
}

/** Fuzzy item match within the home: model, else manufacturer + name word. */
async function matchItem(db: Admin, file: FileRow, d: Extracted): Promise<{ id: string; name: string } | null> {
  if (file.item_id) {
    const { data } = await db.from('items').select('id, name').eq('id', file.item_id).eq('home_id', file.home_id).maybeSingle()
    if (data) return data
  }
  if (d.model) {
    const { data } = await db
      .from('items')
      .select('id, name')
      .eq('home_id', file.home_id)
      .ilike('model', d.model)
      .limit(1)
      .maybeSingle()
    if (data) return data
  }
  if (d.manufacturer && d.item_name) {
    const firstWord = d.item_name.split(/\s+/)[0]
    const { data } = await db
      .from('items')
      .select('id, name')
      .eq('home_id', file.home_id)
      .ilike('manufacturer', d.manufacturer)
      .ilike('name', `%${firstWord}%`)
      .limit(1)
      .maybeSingle()
    if (data) return data
  }
  return null
}

/** Parse the model's JSON, tolerating markdown fences or stray prose. */
function parseJson(text: string): Extracted {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
  try {
    return JSON.parse(trimmed) as Extracted
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start === -1 || end <= start) throw new Error('extraction output was not JSON')
    return JSON.parse(trimmed.slice(start, end + 1)) as Extracted
  }
}

function addMonths(isoDate: string, months: number): string {
  const dt = new Date(`${isoDate}T00:00:00Z`)
  dt.setUTCMonth(dt.getUTCMonth() + months)
  return dt.toISOString().slice(0, 10)
}
