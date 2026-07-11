import { Activity as ActivityIcon } from 'lucide-react'
import { activityFeed } from '@/lib/care-data'
import { cn } from '@/lib/utils'

/* A quiet ticker of what HomeOS has done on its own since the last visit.
   Deliberately understated so the home feels alive without nagging. */
export function CareActivity() {
  return (
    <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
      <div className="flex items-center gap-2.5">
        <span className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-sage/15 text-sage-foreground">
          <ActivityIcon className="size-5" strokeWidth={1.75} />
          <span className="absolute -right-0.5 -top-0.5 flex size-2.5">
            <span className="ob-pulse-soft absolute inline-flex size-full rounded-full bg-sage/60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-sage" />
          </span>
        </span>
        <div>
          <h2 className="font-serif text-xl tracking-tight">Since your last visit</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Quiet things HomeOS handled while you were away
          </p>
        </div>
      </div>

      <ul className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {activityFeed.map((a) => (
          <li
            key={a.id}
            className="flex items-start gap-3 rounded-2xl border border-border/60 bg-secondary/30 p-3.5"
          >
            <span
              className={cn(
                'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-card shadow-sm',
                a.tone === 'wood' ? 'text-wood-foreground' : 'text-sage-foreground',
              )}
            >
              <a.icon className="size-4" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="text-sm leading-relaxed text-pretty">{a.text}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{a.when}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
