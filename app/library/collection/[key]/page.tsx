import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { CollectionView } from '@/components/library/collection-view'
import { collections, type CollectionKey } from '@/lib/library-data'

export function generateStaticParams() {
  return collections.map((c) => ({ key: c.key }))
}

export default async function CollectionPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  const exists = collections.some((c) => c.key === key)

  if (!exists) notFound()

  return (
    <AppShell>
      <CollectionView collectionKey={key as CollectionKey} />
    </AppShell>
  )
}
