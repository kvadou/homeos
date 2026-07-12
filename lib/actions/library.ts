'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireHome } from '@/lib/supabase/home'
import { logUsage } from '@/lib/usage'
import { categoryMeta, fileTypeMeta } from '@/lib/library-data'
import { ingestFile, seedCareTasksForItem } from '@/lib/ingest/pipeline'

/** File types that route through the extraction pipeline (photos/videos skip in Phase 2). */
const EXTRACTABLE_TYPES = new Set(['receipt', 'manual', 'warranty', 'document'])

/** Trim to a value or null (empty strings become null in the DB). */
function orNull(v: FormDataEntryValue | null): string | null {
  const s = typeof v === 'string' ? v.trim() : ''
  return s.length ? s : null
}

type ItemResult = { error?: string }

/** null | valid room id for this home | Error result. Foreign room ids rejected. */
async function resolveRoomId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  homeId: string,
  raw: FormDataEntryValue | null,
): Promise<{ roomId: string | null } | { error: string }> {
  const roomId = orNull(raw)
  if (!roomId) return { roomId: null }
  const { data: room } = await supabase
    .from('rooms')
    .select('id')
    .eq('id', roomId)
    .eq('home_id', homeId)
    .maybeSingle()
  return room ? { roomId } : { error: 'Room not found.' }
}

/**
 * Create an item from the add-item form, then redirect to its profile.
 * Throws the Next redirect on success (never returns in that case).
 */
export async function createItem(formData: FormData): Promise<ItemResult> {
  const name = orNull(formData.get('name'))
  const category = orNull(formData.get('category'))
  if (!name) return { error: 'Give this item a name.' }
  if (!category || !categoryMeta[category]) return { error: 'Pick a category.' }

  const home = await requireHome()
  const supabase = await createClient()
  const room = await resolveRoomId(supabase, home.id, formData.get('room_id'))
  if ('error' in room) return room
  const { data, error } = await supabase
    .from('items')
    .insert({
      home_id: home.id,
      name,
      category,
      room_id: room.roomId,
      manufacturer: orNull(formData.get('manufacturer')),
      model: orNull(formData.get('model')),
      installed_on: orNull(formData.get('installed_on')),
      summary: orNull(formData.get('summary')),
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Could not save this item.' }

  // Rule-based cascade (§7.6): seed the maintenance schedule after the response.
  const itemId = data.id
  after(() => seedCareTasksForItem({ homeId: home.id, itemId, name, category }))

  await logUsage('item_created', { category }, home.id)
  revalidatePath('/library')
  revalidatePath('/care')
  redirect(`/library/item/${data.id}`)
}

/** Update an existing item's editable fields. Redirects back to its profile. */
export async function updateItem(id: string, formData: FormData): Promise<ItemResult> {
  const name = orNull(formData.get('name'))
  const category = orNull(formData.get('category'))
  if (!name) return { error: 'Give this item a name.' }
  if (!category || !categoryMeta[category]) return { error: 'Pick a category.' }

  const home = await requireHome()
  const supabase = await createClient()
  const room = await resolveRoomId(supabase, home.id, formData.get('room_id'))
  if ('error' in room) return room
  const { data, error } = await supabase
    .from('items')
    .update({
      name,
      category,
      room_id: room.roomId,
      manufacturer: orNull(formData.get('manufacturer')),
      model: orNull(formData.get('model')),
      installed_on: orNull(formData.get('installed_on')),
      summary: orNull(formData.get('summary')),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('home_id', home.id)
    .select('id')

  if (error) return { error: error.message }
  if (!data?.length) return { error: 'Item not found.' }

  await logUsage('item_updated', { id }, home.id)
  revalidatePath('/library')
  revalidatePath(`/library/item/${id}`)
  redirect(`/library/item/${id}`)
}

/** Delete an item. RLS enforces membership; home_id filter makes it explicit. */
export async function deleteItem(id: string): Promise<ItemResult> {
  const home = await requireHome()
  const supabase = await createClient()
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id)
    .eq('home_id', home.id)
  if (error) return { error: error.message }

  await logUsage('item_deleted', { id }, home.id)
  revalidatePath('/library')
  redirect('/library')
}

/**
 * Insert a files row after the browser has uploaded the object to Storage.
 * The upload itself happens client-side (Storage has body limits server-side).
 */
export async function recordUpload(input: {
  name: string
  type: string
  storagePath: string
  itemId?: string | null
  /** SHA-256 of the file bytes, computed client-side — byte-level dedupe (§3). */
  contentHash?: string | null
}): Promise<{ error?: string; duplicate?: boolean }> {
  const name = input.name?.trim()
  if (!name || !input.storagePath || !input.type) return { error: 'Missing file details.' }
  if (!fileTypeMeta[input.type]) return { error: 'Unknown file type.' }

  const home = await requireHome()
  const supabase = await createClient()

  // Storage objects live under {homeId}/... — reject foreign or traversal paths.
  if (!input.storagePath.startsWith(`${home.id}/`) || input.storagePath.includes('..')) {
    return { error: 'Invalid storage path.' }
  }

  // item_id must belong to this home — RLS checks the file's home_id but not the link.
  if (input.itemId) {
    const { data: item } = await supabase
      .from('items')
      .select('id')
      .eq('id', input.itemId)
      .eq('home_id', home.id)
      .maybeSingle()
    if (!item) return { error: 'Item not found.' }
  }

  const extractable = EXTRACTABLE_TYPES.has(input.type)
  const { data, error } = await supabase
    .from('files')
    .insert({
      home_id: home.id,
      item_id: input.itemId || null,
      type: input.type,
      name,
      storage_path: input.storagePath,
      content_hash: input.contentHash || null,
      extraction_status: extractable ? 'pending' : 'none',
    })
    .select('id')
    .single()

  if (error) {
    // unique (home_id, content_hash): identical bytes already in the library.
    if (error.code === '23505') return { duplicate: true }
    return { error: error.message }
  }

  if (extractable && data) {
    const fileId = data.id
    after(() => ingestFile(fileId))
  }

  await logUsage('file_uploaded', { type: input.type, linked: Boolean(input.itemId) }, home.id)
  revalidatePath('/library')
  if (input.itemId) revalidatePath(`/library/item/${input.itemId}`)
  return {}
}
