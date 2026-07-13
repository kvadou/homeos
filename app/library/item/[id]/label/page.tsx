import { notFound } from 'next/navigation'
import { requireHome } from '@/lib/supabase/home'
import { createClient } from '@/lib/supabase/server'
import { QrLabelSheet } from '@/components/library/qr-label-sheet'

export default async function ItemLabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const home = await requireHome()
  const supabase = await createClient()
  const { data: item } = await supabase.from('items')
    .select('id,name,manufacturer,model,room_id').eq('id', id).eq('home_id', home.id).maybeSingle()
  if (!item) notFound()
  const { data: room } = item.room_id
    ? await supabase.from('rooms').select('name').eq('id', item.room_id).eq('home_id', home.id).maybeSingle()
    : { data: null }

  return <QrLabelSheet item={item} roomName={room?.name ?? null} />
}
