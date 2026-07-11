import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { ItemDetail } from '@/components/library/item-detail'
import { items } from '@/lib/library-data'

export function generateStaticParams() {
  return Object.keys(items).map((id) => ({ id }))
}

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = items[id]

  if (!item) notFound()

  return (
    <AppShell>
      <ItemDetail item={item} />
    </AppShell>
  )
}
