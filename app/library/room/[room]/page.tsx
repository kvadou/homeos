import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { RoomView } from '@/components/library/room-view'
import { requireHome } from '@/lib/supabase/home'
import { createClient } from '@/lib/supabase/server'
import { itemsToRoom } from '@/lib/library-data'

// Per-home data — runtime only, no static generation.
export default async function RoomPage({ params }: { params: Promise<{ room: string }> }) {
  const { room: slug } = await params
  const home = await requireHome()
  const supabase = await createClient()

  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('home_id', home.id)
    .eq('slug', slug)
    .maybeSingle()

  if (!room) notFound()

  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('home_id', home.id)
    .eq('room_id', room.id)
    .order('name')

  return (
    <AppShell>
      <RoomView room={itemsToRoom(room, items ?? [])} />
    </AppShell>
  )
}
