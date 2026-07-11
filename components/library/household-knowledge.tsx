import { Plus } from 'lucide-react'
import { householdKnowledge, tintClasses } from '@/lib/library-data'

export function HouseholdKnowledge() {
  return (
    <section>
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="font-serif text-xl tracking-tight">What Your Home Remembers</h2>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-opacity hover:opacity-80"
        >
          <Plus className="size-4" strokeWidth={2.5} />
          Add knowledge
        </button>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        The details that usually live only in someone&apos;s memory
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {householdKnowledge.map(({ id, title, meta, icon: Icon, tint }) => (
          <button
            key={id}
            type="button"
            className="group flex items-center gap-3.5 rounded-3xl border border-border/70 bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-sage/40 hover:shadow-md"
          >
            <span
              className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${tintClasses[tint]}`}
            >
              <Icon className="size-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug text-pretty">{title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
