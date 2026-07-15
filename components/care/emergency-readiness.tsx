import Link from 'next/link'
import { LifeBuoy } from 'lucide-react'
import { CareSection } from './care-section'

export function EmergencyReadiness() {
  return (
    <CareSection
      icon={<LifeBuoy className="size-5" strokeWidth={1.75} />}
      title="Emergency Readiness"
      subtitle="Record the locations and test dates your household needs in an emergency"
      accessory={
        <span className="rounded-full border border-border/60 bg-secondary/40 px-3 py-1.5 text-sm font-medium text-muted-foreground">Not assessed</span>
      }
    >
      <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-6 text-center">
        <p className="text-sm font-medium">GatherRoot does not have enough information to assess emergency readiness.</p>
        <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">Add detector tests, shutoff locations, extinguisher dates, breaker-panel details, and emergency contacts as records in your Library.</p>
        <Link href="/library/item/new" className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">Add a safety record</Link>
      </div>
    </CareSection>
  )
}
