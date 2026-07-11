import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { CollectionView } from '@/components/library/collection-view'
import { requireHome } from '@/lib/supabase/home'
import { createClient } from '@/lib/supabase/server'
import {
  collectionMeta,
  collectionCategory,
  iconFor,
  rowToItemCard,
  type CollectionKey,
} from '@/lib/library-data'

// Per-user, per-home data — runtime only, no static generation.
export default async function CollectionPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  if (!(key in collectionMeta)) notFound()
  const ck = key as CollectionKey
  const meta = collectionMeta[ck]

  const home = await requireHome()
  const supabase = await createClient()

  if (ck === 'rooms') {
    const [roomsRes, itemsRes] = await Promise.all([
      supabase.from('rooms').select('*').eq('home_id', home.id).order('name'),
      supabase.from('items').select('id, room_id').eq('home_id', home.id),
    ])
    const counts = new Map<string, number>()
    for (const it of itemsRes.data ?? []) {
      if (it.room_id) counts.set(it.room_id, (counts.get(it.room_id) ?? 0) + 1)
    }
    const rooms = (roomsRes.data ?? []).map((r) => ({ slug: r.slug, name: r.name, count: counts.get(r.id) ?? 0 }))
    return (
      <AppShell>
        <CollectionView label={meta.label} icon={iconFor(meta.icon)} tint={meta.tint} count={rooms.length} items={[]} rooms={rooms} showRooms />
      </AppShell>
    )
  }

  const category = collectionCategory[ck]
  let items: ReturnType<typeof rowToItemCard>[] = []
  if (category) {
    const { data } = await supabase.from('items').select('*').eq('home_id', home.id).eq('category', category).order('name')
    items = (data ?? []).map(rowToItemCard)
  }

  return (
    <AppShell>
      <CollectionView
        label={meta.label}
        icon={iconFor(meta.icon)}
        tint={meta.tint}
        count={items.length}
        items={items}
        showRooms={false}
        category={category}
      />
    </AppShell>
  )
}
