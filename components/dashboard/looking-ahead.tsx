import { CalendarClock } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  {
    title: 'Replace water heater',
    when: 'Est. this fall',
    detail: 'Approaching end of its typical 12-year lifespan.',
    cost: '$2,100',
    tone: 'attention' as const,
  },
  {
    title: 'Seal the driveway',
    when: 'Next spring',
    detail: 'Protects against cracking through next winter.',
    cost: '$400',
    tone: 'plan' as const,
  },
  {
    title: 'Service the furnace',
    when: 'Early next winter',
    detail: 'Annual tune-up keeps it efficient and under warranty.',
    cost: '$180',
    tone: 'plan' as const,
  },
  {
    title: 'Roof inspection',
    when: 'Recommended in 2028',
    detail: 'Inspected last year — good condition, no action needed now.',
    cost: null,
    tone: 'good' as const,
  },
]

const toneStyles = {
  attention: 'bg-wood/20 text-wood-foreground',
  plan: 'bg-sage/15 text-sage-foreground',
  good: 'bg-muted text-muted-foreground',
}

export function LookingAhead() {
  return (
    <section className="flex h-full flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-sage/15 text-sage-foreground">
          <CalendarClock className="size-5" strokeWidth={1.75} />
        </span>
        <div>
          <h2 className="font-serif text-xl tracking-tight">Looking Ahead</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Your next 12 months</p>
        </div>
      </div>

      <ul className="mt-5 flex flex-1 flex-col gap-2.5">
        {items.map((item) => (
          <li
            key={item.title}
            className="rounded-2xl border border-border/60 bg-secondary/30 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
              </div>
              {item.cost && (
                <span className="shrink-0 text-sm font-semibold tabular-nums">{item.cost}</span>
              )}
            </div>
            <span
              className={cn(
                'mt-2.5 inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium',
                toneStyles[item.tone],
              )}
            >
              {item.when}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-primary/5 px-4 py-3.5">
        <div>
          <p className="text-sm font-medium">Plan ahead, not scramble</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Estimated over the next 12 months</p>
        </div>
        <span className="font-serif text-2xl tracking-tight tabular-nums">~$2,700</span>
      </div>
    </section>
  )
}
