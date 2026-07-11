import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { ArrowLeft, Plus, ChevronRight, DoorOpen } from 'lucide-react'
import { iconFor, tintClasses, type ItemCard, type RoomCard } from '@/lib/library-data'

type CollectionViewProps = {
  label: string
  icon: LucideIcon
  tint: string
  count: number
  items: ItemCard[]
  rooms?: RoomCard[]
  showRooms: boolean
  category?: string
}

export function CollectionView({ label, icon: Icon, tint, count, items, rooms, showRooms, category }: CollectionViewProps) {
  const addHref = category ? `/library/item/new?category=${category}` : '/library/item/new'

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
        <span className={`flex size-14 items-center justify-center rounded-3xl ${tintClasses[tint]}`}>
          <Icon className="size-7" strokeWidth={1.5} />
        </span>
        <div>
          <h1 className="font-serif text-3xl tracking-tight">{label}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{count} items in this collection</p>
        </div>
      </header>

      {showRooms ? (
        (rooms ?? []).length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(rooms ?? []).map((room) => (
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
                  <p className="text-sm text-muted-foreground">{room.count} things connected</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" strokeWidth={2} />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyCollection label={label} addHref={addHref} />
        )
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((item) => {
            const ItemIcon = iconFor(item.icon)
            return (
              <Link
                key={item.id}
                href={`/library/item/${item.id}`}
                className="group flex items-center gap-4 rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sage/40 hover:shadow-md"
              >
                <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${tintClasses[item.tint]}`}>
                  <ItemIcon className="size-6" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{item.summary}</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
              </Link>
            )
          })}
        </div>
      ) : (
        <EmptyCollection label={label} addHref={addHref} />
      )}
    </div>
  )
}

function EmptyCollection({ label, addHref }: { label: string; addHref: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-secondary/30 p-10 text-center">
      <p className="text-sm text-muted-foreground">
        Your {label.toLowerCase()} live here, organized automatically as you add them.
      </p>
      <Link
        href={addHref}
        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
      >
        <Plus className="size-4" strokeWidth={2.5} />
        Add to this collection
      </Link>
    </div>
  )
}
