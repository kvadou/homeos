import { createAdminClient } from '@/lib/supabase/admin'
import { autoApply } from '@/lib/ingest/pipeline'
import { checkCpscRecalls } from '@/lib/recalls'

/**
 * Scheduled intelligence jobs (gap-analysis §1.2). Cross-home sweeps run with
 * the service-role client OUTSIDE any RLS session — so every write is scoped by
 * the sweeping row's own home_id, never a home id we were handed. Called from
 * app/api/cron/daily under the CRON_SECRET gate; no user context.
 */

type Admin = ReturnType<typeof createAdminClient>

export type JobResult = { name: string; [key: string]: unknown }
export type Job = () => Promise<JobResult>

/** UTC date string (YYYY-MM-DD) `days` from now — matches the `date` columns. */
function dateOffset(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** "Aug 2026" from a YYYY-MM-DD date, in UTC so it never drifts a day. */
function monthYear(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * Roll warranty status forward as time passes (no upload required):
 *   active → expiring   when coverage ends within 60 days (but not yet lapsed)
 *   active|expiring → expired   once coverage has lapsed
 * Flipping to `expiring` mints a rule-based `protection` insight; lapsing
 * dismisses the now-false coverage insight (minted at ingest, `warranty:<file>`)
 * and its own `warranty-expiring:<id>` insight. Idempotent: the status guards
 * mean a second run re-selects nothing, and the insight applier updates in place.
 */
export async function refreshWarrantyStatus(): Promise<JobResult> {
  const db: Admin = createAdminClient()
  const today = dateOffset(0)
  const soon = dateOffset(60)

  // ponytail: bulk select + per-row update. Fine to low thousands of warranties;
  // if a daily sweep ever nears the 60s function budget, push these transitions
  // into a SQL function or shard by home_id.

  // (a) active coverage lapsing within 60 days → expiring (+ an alert insight).
  const { data: expiringRows } = await db
    .from('warranties')
    .select('id, home_id, provider, ends_on')
    .eq('status', 'active')
    .not('ends_on', 'is', null)
    .gt('ends_on', today)
    .lte('ends_on', soon)

  let expiring = 0
  for (const w of expiringRows ?? []) {
    await db.from('warranties').update({ status: 'expiring' }).eq('id', w.id)
    const provider = w.provider ? `${w.provider} ` : ''
    const headline = `Warranty expiring soon: ${provider}coverage ends ${monthYear(w.ends_on!)}`
    await autoApply(
      db,
      w.home_id,
      {
        target: 'insights',
        action: 'insert',
        payload: { category: 'protection', headline },
        dedupeKey: `warranty-expiring:${w.id}`,
        confidence: 1, // rule-based, not a model guess
        summary: headline,
      },
      { pipeline: 'refreshWarrantyStatus', model: 'none', depth: 1, warranty_id: w.id },
    )
    expiring++
  }

  // (b) coverage that has now lapsed → expired (+ dismiss its coverage insights).
  const { data: expiredRows } = await db
    .from('warranties')
    .select('id, home_id, file_id')
    .in('status', ['active', 'expiring'])
    .not('ends_on', 'is', null)
    .lte('ends_on', today)

  let expired = 0
  for (const w of expiredRows ?? []) {
    await db.from('warranties').update({ status: 'expired' }).eq('id', w.id)
    if (w.file_id) {
      await db
        .from('insights')
        .update({ status: 'dismissed' })
        .eq('home_id', w.home_id)
        .eq('dedupe_slug', `warranty:${w.file_id}`)
    }
    await db
      .from('insights')
      .update({ status: 'dismissed' })
      .eq('home_id', w.home_id)
      .eq('dedupe_slug', `warranty-expiring:${w.id}`)
    expired++
  }

  return { name: 'refreshWarrantyStatus', expiring, expired }
}

function shardFor(value: string): number {
  let hash = 0
  for (const character of value) hash = ((hash * 31) + character.charCodeAt(0)) >>> 0
  return hash % 3
}

/**
 * Check one third of fully identified items each day, so every model is checked
 * at least every three days without overwhelming CPSC or the cron time budget.
 * Only exact model-level candidates become alerts; manufacturer-only results
 * remain available through the item's manual "Check now" review flow.
 */
export async function monitorItemRecalls(): Promise<JobResult> {
  const db: Admin = createAdminClient()
  const dayShard = Math.floor(Date.now() / 86_400_000) % 3
  const { data: allItems, error } = await db
    .from('items')
    .select('id,home_id,name,manufacturer,model')
    .not('manufacturer', 'is', null)
    .not('model', 'is', null)
    .limit(300)
  if (error) throw error

  const items = (allItems ?? [])
    .filter((item) => item.model!.replace(/[^a-z0-9]/gi, '').length >= 4 && shardFor(item.id) === dayShard)
    .slice(0, 30)

  let checked = 0
  let alerts = 0
  let failures = 0

  // Three workers keep the sweep inside the function budget while remaining
  // courteous to the public CPSC endpoint.
  let cursor = 0
  async function worker() {
    while (cursor < items.length) {
      const item = items[cursor++]
      try {
        const matches = await checkCpscRecalls(item)
        checked++
        for (const match of matches.filter((candidate) => candidate.confidence === 'model')) {
          const headline = `Possible safety recall: ${item.name}`
          await autoApply(db, item.home_id, {
            target: 'insights',
            action: 'insert',
            payload: {
              category: 'protection',
              headline,
              detail: match.hazard ?? match.title,
              action: 'Verify your model and serial number on the official CPSC notice.',
              basis: `${item.manufacturer} ${item.model} matched CPSC recall ${match.id}.`,
              evidence: match.url ? [{ kind: 'url', url: match.url, label: match.title }] : [],
              status: 'active',
            },
            dedupeKey: `recall:${item.id}:${match.id}`,
            confidence: 0.95,
            summary: headline,
          }, { pipeline: 'monitorItemRecalls', model: 'none', depth: 1, item_id: item.id })
          alerts++
        }
      } catch (jobError) {
        failures++
        console.error(`[recalls] item ${item.id} failed:`, jobError)
      }
    }
  }
  await Promise.all([worker(), worker(), worker()])
  return { name: 'monitorItemRecalls', eligible: items.length, checked, alerts, failures, shard: dayShard }
}

/** The daily cron runs these in order. Add seasonal-task / insight-supersession jobs here. */
export const dailyJobs: Job[] = [refreshWarrantyStatus, monitorItemRecalls]
