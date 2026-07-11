import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import { livingObservations, tintClasses } from '@/lib/library-data'

export function LivingObservations() {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="size-4 text-sage-foreground" strokeWidth={2} />
        <h2 className="font-serif text-xl tracking-tight">Your Library is learning</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {livingObservations.map(({ id, icon: Icon, text, action, href, tint }) => (
          <Link
            key={id}
            href={href}
            className="group flex flex-col justify-between gap-4 rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sage/40 hover:shadow-md"
          >
            <span
              className={`flex size-10 items-center justify-center rounded-2xl ${tintClasses[tint]}`}
            >
              <Icon className="size-5" strokeWidth={1.75} />
            </span>
            <p className="text-pretty text-sm leading-relaxed text-foreground">{text}</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              {action}
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
