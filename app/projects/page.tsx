import { AppShell } from '@/components/app-shell'
import { ProjectsHeader } from '@/components/projects/projects-header'
import { ActiveProjects } from '@/components/projects/active-projects'
import { RecommendedProjects } from '@/components/projects/recommended-projects'
import { InvestmentOutlook } from '@/components/projects/investment-outlook'
import { HomeTimeline } from '@/components/projects/home-timeline'
import { ProjectIdeas } from '@/components/projects/project-ideas'
import { RecentlyFinished } from '@/components/projects/recently-finished'
import { CompletedProjects } from '@/components/projects/completed-projects'

export default function ProjectsPage() {
  return (
    <AppShell>
      {/* Generous spacing so each section reads as its own chapter — the airy,
          editorial rhythm that sets Projects apart from Care's tighter feel. */}
      <div className="space-y-16">
        {/* Overview — how is my home evolving? */}
        <ProjectsHeader />

        {/* The primary focus: what am I building right now? */}
        <ActiveProjects />

        {/* One of the strongest differentiators — you're building wealth, not
            just spending. Surfaced high, right after what you're building. */}
        <InvestmentOutlook />

        {/* Where HomeOS gets proactive — personalized next investments */}
        <RecommendedProjects />

        {/* The story of the house, past into future */}
        <HomeTimeline />

        {/* Future inspiration, not yet projects */}
        <ProjectIdeas />

        {/* Fresh momentum — recent wins, just above the lifetime archive */}
        <RecentlyFinished />

        {/* The archive — permanent memories of finished work */}
        <CompletedProjects />
      </div>
    </AppShell>
  )
}
