'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireHome } from '@/lib/supabase/home'
import { logUsage } from '@/lib/usage'
import { autoApply, seedCareTasksForItem, type Proposal } from '@/lib/ingest/pipeline'
import { forecastForItem } from '@/lib/ingest/reason'

type Result = { error?: string }

const REVALIDATE = ['/', '/library', '/care', '/worth-knowing']

/**
 * Apply a queued AI proposal to its target table (engine doc §2). The user's
 * confirmation is the trust upgrade — writes still carry the original
 * extraction provenance. Service-role client after an explicit home check,
 * same discipline as the pipeline.
 */
export async function acceptSuggestion(id: string): Promise<Result> {
  const home = await requireHome()
  const supabase = await createClient()
  const { data: s } = await supabase
    .from('suggestions')
    .select('*')
    .eq('id', id)
    .eq('home_id', home.id)
    .eq('status', 'pending')
    .maybeSingle()
  if (!s) return { error: 'Suggestion not found.' }

  const db = createAdminClient()
  const provenance = (s.provenance ?? {}) as Record<string, unknown>
  const payload = s.payload as Record<string, unknown>

  try {
    if (s.target === 'items' && s.action === 'insert') {
      // Confirmed new item: insert, stamp per-field provenance, seed care schedule.
      const { data: item, error } = await db
        .from('items')
        .insert({ ...(payload as object), home_id: home.id } as never)
        .select('id, name, category')
        .single()
      if (error || !item) throw error ?? new Error('item insert failed')
      for (const field of Object.keys(payload)) {
        if (['name', 'category', 'status'].includes(field) || payload[field] == null) continue
        await db.from('field_provenance').upsert(
          {
            home_id: home.id,
            entity_table: 'items',
            entity_id: item.id,
            field,
            source_kind: 'extraction',
            extraction_id: (provenance.extraction_id as string) ?? null,
            confidence: s.confidence,
            model: (provenance.model as string) ?? null,
          },
          { onConflict: 'entity_table,entity_id,field' },
        )
      }
      if (item.category !== 'other') {
        await seedCareTasksForItem({
          homeId: home.id,
          itemId: item.id,
          name: item.name,
          category: item.category,
        })
        // Depth-2 replacement forecast, off the response path (it bails if no install date).
        after(() => forecastForItem(createAdminClient(), home.id, item.id))
      }
    } else {
      await autoApply(
        db,
        home.id,
        {
          target: s.target,
          action: s.action,
          targetId: s.target_id ?? undefined,
          payload,
          dedupeKey: s.dedupe_key,
          confidence: s.confidence,
          summary: s.summary,
        } as Proposal,
        provenance,
      )
    }
  } catch (err) {
    console.error('[suggestions] accept failed:', err)
    return { error: 'Could not apply this suggestion.' }
  }

  await db.from('suggestions').update({ status: 'accepted' }).eq('id', s.id)
  await logUsage('suggestion_accepted', { target: s.target }, home.id)
  REVALIDATE.forEach((p) => revalidatePath(p))
  return {}
}

/** Dismiss a queued proposal. It never comes back (dedupe key stays taken). */
export async function rejectSuggestion(id: string): Promise<Result> {
  const home = await requireHome()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('suggestions')
    .update({ status: 'rejected' })
    .eq('id', id)
    .eq('home_id', home.id)
    .eq('status', 'pending')
    .select('id, target')
  if (error) return { error: error.message }
  if (!data?.length) return { error: 'Suggestion not found.' }

  await logUsage('suggestion_rejected', { target: data[0].target }, home.id)
  REVALIDATE.forEach((p) => revalidatePath(p))
  return {}
}
