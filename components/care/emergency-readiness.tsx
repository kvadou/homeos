import { LifeBuoy, Check, Clock } from 'lucide-react'
import { emergencyItems } from '@/lib/care-data'
import { CareSection } from './care-section'
import { cn } from '@/lib/utils'

export function EmergencyReadiness() {
  const ready = emergencyItems.filter((i) => i.status === 'ready').length

  return (
    <CareSection
      icon={<LifeBuoy className="size-5" strokeWidth={1.75} />}
      title="Emergency Readiness"
      subtitle="If something ever goes wrong, you're prepared"
      accessory={
        <span className="rounded-full border border-border/60 bg-secondary/40 px-3 py-1.5 text-sm font-medium text-muted-foreground tabular-nums">
          {ready}/{emergencyItems.length} ready
        </span>
      }
    >
      <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {emergencyItems.map((item) => {
          const isReady = item.status === 'ready'
          return (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-secondary/30 p-3.5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card text-sage-foreground shadow-sm">
                <item.icon className="size-4.5" strokeWidth={1.75} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium',
                  isReady ? 'bg-sage/15 text-sage-foreground' : 'bg-wood/20 text-wood-foreground',
                )}
              >
                {isReady ? (
                  <Check className="size-3" strokeWidth={3} />
                ) : (
                  <Clock className="size-3" strokeWidth={2.5} />
                )}
                {isReady ? 'Ready' : 'Soon'}
              </span>
            </li>
          )
        })}
      </ul>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        You&apos;re prepared for the essentials. One extinguisher is nearing its date — HomeOS will
        remind you before it lapses.
      </p>
    </CareSection>
  )
}
