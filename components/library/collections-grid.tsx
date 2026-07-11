import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { collections, tintClasses } from '@/lib/library-data'

export function CollectionsGrid() {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-serif text-xl tracking-tight">Explore your home</h2>
        <p className="text-sm text-muted-foreground">Organized automatically</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {collections.map(({ key, label, icon: Icon, count, tint, preview }) => (
          <Link
            key={key}
            href={`/library/collection/${key}`}
            className="group flex flex-col rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sage/40 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <span
                className={`flex size-11 items-center justify-center rounded-2xl ${tintClasses[tint]}`}
              >
                <Icon className="size-5.5" strokeWidth={1.75} />
              </span>
              <ArrowUpRight
                className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                strokeWidth={2}
              />
            </div>
            <div className="mt-4 flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{count}</span>
            </div>
            <ul className="mt-2 flex flex-col gap-1">
              {preview.map((p) => (
                <li key={p} className="truncate text-xs text-muted-foreground">
                  {p}
                </li>
              ))}
            </ul>
          </Link>
        ))}
      </div>
    </section>
  )
}
