import { Hammer, Sparkles, Loader, CheckCircle2, TrendingUp } from 'lucide-react'
import { compact, type HeroSummary } from '@/lib/projects-data'

export function ProjectsHeader({ summary }: { summary: HeroSummary }) {
  const { active, completed, invested, aiSummary } = summary

  const stats = [
    { icon: Loader, label: 'Active Projects', value: String(active), tint: 'sage' as const },
    { icon: CheckCircle2, label: 'Completed', value: String(completed), tint: 'sage' as const },
    {
      icon: TrendingUp,
      label: 'Total Invested',
      value: compact(invested),
      tint: 'wood' as const,
    },
  ]

  return (
    <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
      <div className="px-6 py-6 sm:px-8 sm:py-7">
        {/* Identity */}
        <div className="flex items-center gap-3.5">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-wood/25 text-wood-foreground">
            <Hammer className="size-6" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Projects
            </p>
            <h1 className="font-serif text-2xl leading-tight tracking-tight sm:text-3xl">
              How your home is evolving
            </h1>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
          {stats.map(({ icon: Icon, label, value, tint }) => (
            <div
              key={label}
              className="flex items-center gap-3.5 rounded-2xl border border-border/60 bg-secondary/30 px-4 py-3.5"
            >
              <span
                className={
                  tint === 'wood'
                    ? 'flex size-10 shrink-0 items-center justify-center rounded-xl bg-wood/25 text-wood-foreground'
                    : 'flex size-10 shrink-0 items-center justify-center rounded-xl bg-sage/15 text-sage-foreground'
                }
              >
                <Icon className="size-5" strokeWidth={2} />
              </span>
              <div>
                <p className="font-serif text-2xl leading-none tracking-tight tabular-nums">
                  {value}
                </p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI summary strip */}
      <div className="flex items-start gap-3 border-t border-border/60 bg-sage/[0.06] px-6 py-4 sm:px-8">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-sage-foreground" strokeWidth={2} />
        <p className="text-pretty text-sm leading-relaxed text-foreground">{aiSummary}</p>
      </div>
    </section>
  )
}
