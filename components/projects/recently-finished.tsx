import { Check, PartyPopper, Sparkles } from 'lucide-react'
import { recentlyFinished } from '@/lib/projects-data'
import { CareSection } from '@/components/care/care-section'

export function RecentlyFinished() {
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
          You&apos;ve completed <span className="font-semibold">four projects</span> worth an
          estimated <span className="font-semibold">$81K in added home value</span> — and three
          more milestones are within reach this season.
        </p>
      </div>

      {/* The wins — a rewarding checklist of momentum */}
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {recentlyFinished.map((w) => (
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
