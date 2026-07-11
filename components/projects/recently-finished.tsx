import { Check, PartyPopper, Sparkles } from 'lucide-react'
import type { RecentWin } from '@/lib/projects-data'
import { CareSection } from '@/components/care/care-section'

export function RecentlyFinished({
  wins,
  completedCount,
  valueAddedShort,
}: {
  wins: RecentWin[]
  completedCount: number
  valueAddedShort: string
}) {
  if (wins.length === 0) return null

  return (
    <CareSection
      icon={<PartyPopper className="size-5" strokeWidth={1.75} />}
      iconTint="wood"
      title="Take a moment — you finished something."
      subtitle="A few things worth being proud of lately"
    >
      {/* Signature Projects insight — progress framed as value created */}
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-sage/25 bg-sage/[0.06] p-4">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-sage-foreground" strokeWidth={2} />
        <p className="text-pretty text-sm leading-relaxed text-foreground">
          You&apos;ve completed{' '}
          <span className="font-semibold">
            {completedCount} project{completedCount === 1 ? '' : 's'}
          </span>{' '}
          worth an estimated{' '}
          <span className="font-semibold">{valueAddedShort} in added home value</span> — with more
          milestones within reach this season.
        </p>
      </div>

      {/* The wins — a rewarding checklist of momentum */}
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {wins.map((w) => (
          <li
            key={w.id}
            className="flex items-center gap-3 rounded-2xl border border-border/60 bg-secondary/25 p-4"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sage text-primary-foreground">
              <Check className="size-4.5" strokeWidth={3} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight text-balance">{w.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {w.project} · {w.when}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </CareSection>
  )
}
