import { TrendingUp, PiggyBank, MapPin } from 'lucide-react'
import { lookingAhead, savingsSuggestion, healthDot } from '@/lib/care-data'
import { CareSection } from './care-section'
import { cn } from '@/lib/utils'

export function CareOutlook() {
  const total = lookingAhead.reduce(
    (sum, i) => sum + Number(i.cost.replace(/[^0-9]/g, '')),
    0,
  )

  return (
    <CareSection
      icon={<TrendingUp className="size-5" strokeWidth={1.75} />}
      title="Looking Ahead"
      subtitle="What your home will likely need over the next five years"
      collapsible
      defaultOpen={false}
      accessory={
        <span className="rounded-full border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs font-medium text-muted-foreground tabular-nums">
          ~${total.toLocaleString()} over 5 yrs
        </span>
      }
    >
      {/* Headline — the one-sentence case for planning ahead */}
      <p className="mb-5 text-pretty text-[15px] leading-relaxed text-foreground">
        HomeOS estimates{' '}
        <span className="font-semibold">~${total.toLocaleString()} over the next five years</span>.
        Setting aside{' '}
        <span className="font-semibold">≈${savingsSuggestion.monthly}/month</span> keeps you ahead
        of every surprise expense.
      </p>

      {/* Roadmap */}
      <div className="relative">
        {/* Continuous rail */}
        <span className="absolute left-[3.25rem] top-2 bottom-2 w-px bg-border sm:left-[4.25rem]" aria-hidden />

        {/* Today marker */}
        <div className="relative flex items-center gap-4 pb-5">
          <span className="w-12 shrink-0 text-right text-xs font-semibold text-sage-foreground sm:w-16">
            Today
          </span>
          <span className="relative z-10 flex size-3 shrink-0 items-center justify-center">
            <MapPin className="size-4 text-sage-foreground" strokeWidth={2.25} />
          </span>
          <span className="text-xs text-muted-foreground">You&apos;re here — everything current is handled</span>
        </div>

        <ol className="space-y-3">
          {lookingAhead.map((item) => (
            <li key={item.title} className="relative flex items-stretch gap-4">
              <span className="w-12 shrink-0 pt-3 text-right font-serif text-lg tracking-tight tabular-nums text-muted-foreground sm:w-16">
                {item.year}
              </span>
              <span className="relative z-10 flex shrink-0 items-start pt-4">
                <span className={cn('size-3 rounded-full ring-4 ring-card', healthDot[item.health])} />
              </span>
              <div className="flex-1 rounded-2xl border border-border/60 bg-secondary/30 p-4">
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <span className="shrink-0 font-serif text-lg tracking-tight tabular-nums">
                    {item.cost}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Savings suggestion */}
      <div className="mt-5 rounded-2xl border border-sage/25 bg-sage/[0.07] p-5">
        <div className="flex items-center gap-2">
          <PiggyBank className="size-4 text-sage-foreground" strokeWidth={2} />
          <p className="text-sm font-medium text-sage-foreground">A calm way to stay ahead</p>
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-2">
          <div>
            <p className="font-serif text-3xl tracking-tight tabular-nums">
              ${savingsSuggestion.monthly}
              <span className="text-base font-normal text-muted-foreground">/mo</span>
            </p>
            <p className="text-xs text-muted-foreground">Suggested set-aside</p>
          </div>
          <div>
            <p className="font-serif text-3xl tracking-tight tabular-nums">
              ${savingsSuggestion.fiveYear.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Covers the full 5 years</p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{savingsSuggestion.note}</p>
      </div>
    </CareSection>
  )
}
