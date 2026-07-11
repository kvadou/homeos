import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { ItemDetail } from '@/components/library/item-detail'
import { requireHome } from '@/lib/supabase/home'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { itemToLibraryItem, type FileWithUrl } from '@/lib/library-data'

/** Batch signed URLs for private Storage objects, keyed by path. */
async function signedUrlMap(supabase: SupabaseClient, paths: string[]) {
  const map = new Map<string, string>()
  if (!paths.length) return map
  const { data } = await supabase.storage.from('home-files').createSignedUrls(paths, 3600)
  for (const row of data ?? []) if (row.signedUrl && row.path) map.set(row.path, row.signedUrl)
  return map
}

// Per-user data — runtime only, no static generation.
export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const home = await requireHome()
  const supabase = await createClient()

  const { data: item } = await supabase
    .from('items')
    .select('*')
    .eq('home_id', home.id)
    .eq('id', id)
    .maybeSingle()

  if (!item) notFound()

  const [filesRes, eventsRes, tasksRes, roomsRes] = await Promise.all([
    supabase.from('files').select('*').eq('home_id', home.id).eq('item_id', id).order('created_at', { ascending: false }),
    supabase.from('care_events').select('*').eq('home_id', home.id).eq('item_id', id).order('occurred_on', { ascending: false }),
    supabase.from('care_tasks').select('*').eq('home_id', home.id).eq('item_id', id),
    supabase.from('rooms').select('id, slug, name').eq('home_id', home.id).order('name'),
  ])

  const files = filesRes.data ?? []
  const urlByPath = await signedUrlMap(supabase, files.map((f) => f.storage_path))
  const filesWithUrls: FileWithUrl[] = files.map((f) => ({ file: f, url: urlByPath.get(f.storage_path) ?? null }))

  const rooms = roomsRes.data ?? []
  const room = item.room_id ? rooms.find((r) => r.id === item.room_id) : undefined

  const libraryItem = itemToLibraryItem(item, {
    files: filesWithUrls,
    events: eventsRes.data ?? [],
    tasks: tasksRes.data ?? [],
    room: room ? { slug: room.slug, name: room.name } : null,
  })

  const edit = {
    name: item.name,
    category: item.category,
    room_id: item.room_id,
    manufacturer: item.manufacturer,
    model: item.model,
    installed_on: item.installed_on ? item.installed_on.slice(0, 10) : null,
    summary: item.summary,
  }

  return (
    <AppShell>
      <ItemDetail item={libraryItem} edit={edit} rooms={rooms.map((r) => ({ id: r.id, name: r.name }))} />
    </AppShell>
  )
}
