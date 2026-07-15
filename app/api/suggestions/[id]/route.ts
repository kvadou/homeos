import { after } from 'next/server'
import { getApiContext } from '@/lib/supabase/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { seedCareTasksForItem } from '@/lib/ingest/pipeline'
import { forecastForItem } from '@/lib/ingest/reason'
import { logUsage } from '@/lib/usage'

export const runtime = 'nodejs'

/** Confirm an item identified by iOS. Other suggestion types keep using the web review queue. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const ctx = await getApiContext(request)
  if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await context.params
  const { data: suggestion } = await ctx.supabase.from('suggestions')
    .select('*').eq('id', id).eq('home_id', ctx.home.id).eq('status', 'pending').maybeSingle()
  if (!suggestion || suggestion.target !== 'items' || suggestion.action !== 'insert') {
    return Response.json({ error: 'Item suggestion not found.' }, { status: 404 })
  }

  const db = createAdminClient()
  const payload = suggestion.payload as Record<string, unknown>
  const provenance = (suggestion.provenance ?? {}) as Record<string, unknown>
  const { data: item, error } = await db.from('items')
    .insert({ ...(payload as object), home_id: ctx.home.id } as never)
    .select('id,name,category').single()
  if (error || !item) return Response.json({ error: 'Could not add this item.' }, { status: 500 })

  for (const field of Object.keys(payload)) {
    if (['name', 'category', 'status'].includes(field) || payload[field] == null) continue
    await db.from('field_provenance').upsert({
      home_id: ctx.home.id, entity_table: 'items', entity_id: item.id, field,
      source_kind: 'extraction', extraction_id: (provenance.extraction_id as string) ?? null,
      confidence: suggestion.confidence, model: (provenance.model as string) ?? null,
    }, { onConflict: 'entity_table,entity_id,field' })
  }
  const fileId = provenance.file_id as string | undefined
  if (fileId) await db.from('files').update({ item_id: item.id }).eq('id', fileId).eq('home_id', ctx.home.id)
  await db.from('suggestions').update({ status: 'accepted' }).eq('id', suggestion.id)
  if (item.category !== 'other') {
    await seedCareTasksForItem({ homeId: ctx.home.id, itemId: item.id, name: item.name, category: item.category })
    after(() => forecastForItem(createAdminClient(), ctx.home.id, item.id))
  }
  void logUsage('suggestion_accepted', { target: 'items', surface: 'ios_capture' }, ctx.home.id)
  return Response.json({ item: { id: item.id, name: item.name } })
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const ctx = await getApiContext(request)
  if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await context.params
  const { data: suggestion } = await ctx.supabase.from('suggestions')
    .select('id,provenance').eq('id', id).eq('home_id', ctx.home.id)
    .eq('target', 'items').eq('status', 'pending').maybeSingle()
  if (!suggestion) return Response.json({ error: 'Item suggestion not found.' }, { status: 404 })
  const { data, error } = await ctx.supabase.from('suggestions').update({ status: 'rejected' })
    .eq('id', id).eq('home_id', ctx.home.id).eq('target', 'items').eq('status', 'pending').select('id')
  if (error || !data?.length) return Response.json({ error: 'Item suggestion not found.' }, { status: 404 })
  const removeEvidence = new URL(request.url).searchParams.get('removeEvidence') === '1'
  if (removeEvidence) {
    const provenance = (suggestion.provenance ?? {}) as Record<string, unknown>
    const fileId = typeof provenance.file_id === 'string' ? provenance.file_id : null
    if (fileId) {
      const db = createAdminClient()
      const { data: file } = await db.from('files').select('storage_path').eq('id', fileId).eq('home_id', ctx.home.id).maybeSingle()
      if (file?.storage_path) await db.storage.from('home-files').remove([file.storage_path])
      await db.from('files').delete().eq('id', fileId).eq('home_id', ctx.home.id)
    }
  }
  void logUsage('suggestion_rejected', { target: 'items', surface: 'ios_capture' }, ctx.home.id)
  return Response.json({ success: true })
}
