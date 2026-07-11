import { MapPin, Check } from 'lucide-react'
import { currentSeason, seasonMeta, type Season, type SeasonalTask } from '@/lib/care-data'
import { CareSection } from './care-section'
import { cn } from '@/lib/utils'

// Not mounted on /care in the current design. Prop-driven and ready: map DB
// care_tasks with a season via toSeasonalTask() and pass them in when mounted.
export function SeasonalCare({
  season = currentSeason(),
  tasks,
}: {
  season?: Season
  tasks: SeasonalTask[]
}) {
  const meta = seasonMeta[season]
  const SeasonIcon = meta.icon

  return (
    <CareSection
      icon={<SeasonIcon className="size-5" strokeWidth={1.75} />}
      iconTint="wood"
      title="Seasonal Care"
      subtitle={meta.blurb}
      collapsible
      defaultOpen={false}
      accessory={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <MapPin className="size-3.5" strokeWidth={2} />
          {meta.label} · Minneapolis, MN
        </span>
      }
    >
      <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {tasks.map((t) => (
          <li
            key={t.title}
            className={cn(
              'flex items-start gap-3 rounded-2xl border p-4',
              t.done ? 'border-transparent bg-muted/50' : 'border-border/60 bg-secondary/30',
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full',
                t.done ? 'bg-sage text-primary-foreground' : 'border-2 border-border bg-card',
              )}
            >
              {t.done && <Check className="size-3" strokeWidth={3} />}
            </span>
            <span>
              <span className={cn('block text-sm font-medium', t.done && 'text-muted-foreground')}>
                {t.title}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                {t.detail}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        These update automatically as the seasons turn and adapt to your local climate — so you
        always see what matters now, not a generic checklist.
      </p>
    </CareSection>
  )
}
