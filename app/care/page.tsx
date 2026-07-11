import type { Metadata } from 'next'
import { HousePlug } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { SystemsOverview } from '@/components/care/systems-overview'
import { HouseDiagram } from '@/components/care/house-diagram'
import { CareSection } from '@/components/care/care-section'
import { CareActivity } from '@/components/care/care-activity'
import { ThisWeek } from '@/components/care/this-week'
import { EmergencyReadiness } from '@/components/care/emergency-readiness'
import { CareInsights } from '@/components/care/care-insights'
import { CareOutlook } from '@/components/care/care-outlook'
import { RecentlyCompleted } from '@/components/care/recently-completed'

export const metadata: Metadata = {
  title: 'Care · HomeOS',
  description:
    'The health of your home at a glance — what needs attention now, what to plan for, and everything you\u2019ve already handled.',
}

export default function CarePage() {
  return (
    <AppShell>
      {/* Care reads like a health report: a vitals panel up top, then tighter,
          clinical sections below (space-y-8) rather than Projects' airy feel. */}
      <div className="space-y-8">
        {/* Vitals — overall health ring, green/amber/red split, systems list,
            and the signature Care insight, all in one Apple Health-style panel */}
        <SystemsOverview />

        {/* A scannable cutaway of the house — every system where it lives */}
        <CareSection
          icon={<HousePlug className="size-5" strokeWidth={1.75} />}
          title="Your home, system by system"
          subtitle="Hover any part of the house to check on it"
        >
          <HouseDiagram />
        </CareSection>

        {/* "What should I do?" — prioritized, in order */}
        <ThisWeek />

        {/* Something people immediately care about — kept high */}
        <EmergencyReadiness />

        {/* A quiet signal the house is being watched between visits */}
        <CareActivity />

        {/* Deeper patterns HomeOS has noticed */}
        <CareInsights />

        {/* Progressive disclosure below: reference material, collapsed */}
        <CareOutlook />
        <RecentlyCompleted />
      </div>
    </AppShell>
  )
}
