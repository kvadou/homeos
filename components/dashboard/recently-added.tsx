import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { iconFor } from '@/lib/library-data'

/* Icon arrives as a Lucide export NAME (RSC-safe) and is resolved via iconFor. */
export type RecentAdd = { id: string; icon: string; name: string; when: string }

export function RecentlyAdded({ items }: { items: RecentAdd[] }) {
  return (
    <section className="flex h-full flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl tracking-tight">Recently Added</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Your home&apos;s growing memory</p>
        </div>
        <Link
          href="/library"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-opacity hover:opacity-80"
        >
          Open Library
          <ArrowRight className="size-4" strokeWidth={2.25} />
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="mt-5 flex flex-1 items-center text-sm text-muted-foreground">
          Nothing added yet — items and files you save will show up here.
        </p>
      ) : (
        <ul className="mt-5 flex flex-1 flex-col gap-2.5">
          {items.slice(0, 3).map(({ id, icon, name, when }) => {
            const Icon = iconFor(icon)
            return (
              <li key={id}>
                <Link
                  href={`/library/item/${id}`}
                  className="flex w-full items-center gap-3.5 rounded-2xl border border-border/60 bg-secondary/30 px-4 py-3 text-left transition-colors hover:border-sage/40 hover:bg-accent/40"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sage/15 text-sage-foreground">
                    <Icon className="size-5" strokeWidth={2} />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{name}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{when}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
