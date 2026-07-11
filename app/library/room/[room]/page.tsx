import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { RoomView } from '@/components/library/room-view'
import { rooms } from '@/lib/library-data'

export function generateStaticParams() {
  return Object.keys(rooms).map((room) => ({ room }))
}

export default async function RoomPage({ params }: { params: Promise<{ room: string }> }) {
  const { room } = await params
  const data = rooms[room]

  if (!data) notFound()

  return (
    <AppShell>
      <RoomView room={data} />
    </AppShell>
  )
}
