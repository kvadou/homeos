import { MapPinned, MapPin, ArrowUpRight, Check } from 'lucide-react'
import { homeTimeline, timelineKindStyle } from '@/lib/projects-data'
import { CareSection } from '@/components/care/care-section'
import { cn } from '@/lib/utils'

export function HomeTimeline() {
  return (
    <CareSection
      icon={<MapPinned className="size-5" strokeWidth={1.75} />}
      iconTint="wood"
      title="Twenty years of memories — and still growing."
      subtitle="Every chapter of your home, from the foundation to what comes next"
    >
      {/* Narrative lead-in — sets the timeline up as a story, not a log */}
      <p className="mb-6 max-w-2xl text-pretty text-[15px] leading-relaxed text-foreground">
        Built in <span className="font-semibold">2005</span>, your home has grown alongside you for
        two decades — a new roof, a warmer heart in the kitchen, and now a basement taking shape.
        Here&apos;s how far it&apos;s come, and where it&apos;s headed next.
      </p>

      <div className="relative">
        {/* Continuous rail */}
        <span
          className="absolute left-[3.25rem] top-2 bottom-2 w-px bg-border sm:left-[4.25rem]"
          aria-hidden
        />

        <ol className="space-y-3">
          {homeTimeline.map((entry, i) => {
            const prev = homeTimeline[i - 1]
            const showToday = entry.kind === 'future' && (!prev || prev.kind !== 'future')

            return (
              <li key={entry.id}>
                {/* Today marker injected where past meets future */}
                {showToday && (
                  <div className="relative mb-3 flex items-center gap-4">
                    <span className="w-12 shrink-0 text-right text-xs font-semibold text-sage-foreground sm:w-16">
                      Today
                    </span>
                    <span className="relative z-10 flex size-6 shrink-0 items-center justify-center">
                      <MapPin className="size-5 text-sage-foreground" strokeWidth={2.25} />
                    </span>
                    <span className="text-xs text-muted-foreground">
                      You&apos;re here — everything below is what comes next
                    </span>
                  </div>
                )}

                <div className="relative flex items-stretch gap-4">
                  <span
                    className={cn(
                      'w-12 shrink-0 pt-2 text-right font-serif text-lg tracking-tight tabular-nums sm:w-16',
                      entry.kind === 'future' ? 'text-muted-foreground' : 'text-foreground',
                    )}
                  >
                    {entry.year}
                  </span>
                  <span className="relative z-10 flex shrink-0 items-start pt-1.5">
                    <span
                      className={cn(
                        'flex size-9 items-center justify-center rounded-full ring-4 ring-card',
                        timelineKindStyle[entry.kind],
                      )}
                    >
                      <entry.icon className="size-4.5" strokeWidth={2} />
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label={`Open ${entry.title}`}
                    className={cn(
                      'group/card flex-1 rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      entry.kind === 'future'
                        ? 'border-dashed border-border bg-transparent hover:border-wood/40 hover:bg-secondary/20'
                        : 'border-border/60 bg-secondary/30 hover:border-wood/40 hover:bg-card',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        {entry.kind !== 'future' && (
                          <Check
                            className="size-4 shrink-0 text-sage-foreground"
                            strokeWidth={2.75}
                          />
                        )}
                        <p className="text-sm font-medium">{entry.title}</p>
                        {entry.kind === 'major' && (
                          <span className="rounded-full bg-sage/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sage-foreground">
                            Complete
                          </span>
                        )}
                        {entry.kind === 'future' && (
                          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Recommended
                          </span>
                        )}
                      </div>
                      <ArrowUpRight
                        className="size-4 shrink-0 text-muted-foreground/40 transition-all duration-200 group-hover/card:-translate-y-0.5 group-hover/card:translate-x-0.5 group-hover/card:text-wood-foreground"
                        strokeWidth={2}
                      />
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {entry.detail}
                    </p>
                  </button>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </CareSection>
  )
}
