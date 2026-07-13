import { AppShell } from '@/components/app-shell'
import { LibraryHome } from '@/components/library/library-home'
import { requireHome } from '@/lib/supabase/home'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  buildCollections,
  fileRowToLibraryFile,
  recentItemsToObservations,
  rowToItemCard,
  understandingPct,
} from '@/lib/library-data'

/** Batch signed URLs for private Storage objects, keyed by path. */
async function signedUrlMap(supabase: SupabaseClient, paths: string[]) {
  const map = new Map<string, string>()
  if (!paths.length) return map
  const { data } = await supabase.storage.from('home-files').createSignedUrls(paths, 3600)
  for (const row of data ?? []) if (row.signedUrl && row.path) map.set(row.path, row.signedUrl)
  return map
}

export default async function LibraryPage() {
  const home = await requireHome()
  const supabase = await createClient()

  const [itemsRes, filesRes, roomsRes, writerRes] = await Promise.all([
    supabase.from('items').select('*').eq('home_id', home.id).order('updated_at', { ascending: false }),
    supabase.from('files').select('*').eq('home_id', home.id).order('created_at', { ascending: false }),
    supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('home_id', home.id),
    supabase.rpc('is_home_writer', { home: home.id }),
  ])

  const items = itemsRes.data ?? []
  const files = filesRes.data ?? []

  const photoPaths = files.filter((f) => f.type === 'photo').map((f) => f.storage_path)
  const urlByPath = await signedUrlMap(supabase, photoPaths)
  const itemName = new Map(items.map((i) => [i.id, i.name]))

  const collections = buildCollections(items, roomsRes.count ?? 0)
  const libraryFiles = files.map((f) =>
    fileRowToLibraryFile(f, {
      url: urlByPath.get(f.storage_path) ?? null,
      itemName: f.item_id ? itemName.get(f.item_id) : null,
    }),
  )
  const objects = items.map(rowToItemCard)
  const discoveries = recentItemsToObservations(items.slice(0, 6))
  const understanding = understandingPct(items.length, files.length)

  return (
    <AppShell showSearch={false}>
      <LibraryHome
        collections={collections}
        files={libraryFiles}
        objects={objects}
        discoveries={discoveries}
        understanding={understanding}
        canWrite={Boolean(writerRes.data)}
      />
    </AppShell>
  )
}
