import Link from 'next/link'
import { ArrowLeft, Plus, ChevronRight, DoorOpen } from 'lucide-react'
import {
  items,
  rooms,
  collections,
  tintClasses,
  type CollectionKey,
} from '@/lib/library-data'

const categoryForKey: Partial<Record<CollectionKey, string>> = {
  appliances: 'Appliance',
  systems: 'System',
  paint: 'Paint',
}

export function CollectionView({ collectionKey }: { collectionKey: CollectionKey }) {
  const meta = collections.find((c) => c.key === collectionKey)!
  const category = categoryForKey[collectionKey]
  const matched = category
    ? Object.values(items).filter((i) => i.category === category)
    : []
  const showRooms = collectionKey === 'rooms'

  return (
    <div className="space-y-6">
      <Link
        href="/library"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={2} />
        Library
      </Link>

      <header className="flex items-center gap-4">
        <span
          className={`flex size-14 items-center justify-center rounded-3xl ${tintClasses[meta.tint]}`}
        >
          <meta.icon className="size-7" strokeWidth={1.5} />
        </span>
        <div>
          <h1 className="font-serif text-3xl tracking-tight">{meta.label}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{meta.count} items in this collection</p>
        </div>
      </header>

      {showRooms ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Object.values(rooms).map((room) => (
            <Link
              key={room.slug}
              href={`/library/room/${room.slug}`}
              className="group flex items-center gap-4 rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sage/40 hover:shadow-md"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-wood/20 text-wood-foreground">
                <DoorOpen className="size-6" strokeWidth={1.75} />
              </span>
              <div className="flex-1">
                <p className="font-medium">{room.name}</p>
                <p className="text-sm text-muted-foreground">
                  {room.groups.reduce((s, g) => s + g.items.length, 0)} things connected
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" strokeWidth={2} />
            </Link>
          ))}
        </div>
      ) : matched.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {matched.map((item) => (
            <Link
              key={item.id}
              href={`/library/item/${item.id}`}
              className="group flex items-center gap-4 rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sage/40 hover:shadow-md"
            >
              <span
                className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${tintClasses[item.tint]}`}
              >
                <item.icon className="size-6" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="truncate text-sm text-muted-foreground">{item.summary}</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border bg-secondary/30 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Your {meta.label.toLowerCase()} live here, organized automatically as you add them.
          </p>
          <Link
            href="/library/upload"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            Add to this collection
          </Link>
        </div>
      )}
    </div>
  )
}
