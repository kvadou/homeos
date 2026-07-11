import { PartyPopper, Check } from 'lucide-react'
import { recentlyCompleted, careWins } from '@/lib/care-data'
import { CareSection } from './care-section'

export function RecentlyCompleted() {
  return (
    <CareSection
      icon={<PartyPopper className="size-5" strokeWidth={1.75} />}
      title="Recently Completed"
      subtitle="Worth a moment of credit"
      collapsible
      defaultOpen={false}
      accessory={
        <span className="rounded-full bg-sage/[0.12] px-3 py-1.5 text-xs font-medium text-sage-foreground tabular-nums">
          {careWins.count} done this year
        </span>
      }
    >
      <div className="rounded-2xl bg-sage/[0.08] px-4 py-4">
        <p className="font-serif text-3xl tracking-tight tabular-nums text-sage-foreground">
          {careWins.count} done
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          In {careWins.window}. {careWins.note}
        </p>
      </div>

      <ul className="mt-4 flex flex-col gap-2.5">
        {recentlyCompleted.map((c) => (
          <li
            key={c.id}
            className="flex items-start gap-3 rounded-2xl border border-border/60 bg-secondary/30 p-4"
          >
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-sage text-primary-foreground">
              <Check className="size-3.5" strokeWidth={3} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <p className="text-sm font-medium">{c.title}</p>
                <span className="text-xs text-muted-foreground">
                  {c.when} · {c.by}
                </span>
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{c.note}</p>
            </div>
          </li>
        ))}
      </ul>
    </CareSection>
  )
}
