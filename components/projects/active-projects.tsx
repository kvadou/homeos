'use client'

import { useEffect, useState } from 'react'
import { Loader, ArrowUpRight, Flag, HardHat, CalendarClock } from 'lucide-react'
import { toneCover, statusStyle, iconFor, type ActiveProject } from '@/lib/projects-data'
import { CareSection } from '@/components/care/care-section'
import { cn } from '@/lib/utils'

export function ActiveProjects({ projects }: { projects: ActiveProject[] }) {
  return (
    <CareSection
      icon={<Loader className="size-5" strokeWidth={1.75} />}
      iconTint="wood"
      title="Active Projects"
      subtitle="What you're building right now"
      accessory={
        <span className="hidden items-center gap-1.5 rounded-full border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs font-medium text-muted-foreground sm:inline-flex">
          {projects.length} in progress · swipe to browse
        </span>
      }
    >
      {projects.length === 0 ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Nothing under way right now. Convert an idea or start a new project to see it here.
        </p>
      ) : (
        /* Horizontal, swipeable rail — feels more like flipping through
           projects than scrolling a long feed. Bleeds to the section edges. */
        <div
          className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-3 sm:-mx-7 sm:px-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Active projects, scroll horizontally"
        >
          {projects.map((p) => (
            <div key={p.id} className="w-[85%] shrink-0 snap-start sm:w-[22rem]">
              <ProjectCard p={p} />
            </div>
          ))}
        </div>
      )}
    </CareSection>
  )
}

// Reusable animated progress bar (0 → target on mount).
function useProgress(target: number) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(target), 120)
    return () => clearTimeout(t)
  }, [target])
  return width
}

/* Uniform active-project card for the swipeable rail. */
function ProjectCard({ p }: { p: ActiveProject }) {
  const width = useProgress(p.progress)
  const Icon = iconFor(p.icon)

  return (
    <button
      type="button"
      aria-label={`Open ${p.name} workspace`}
      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-wood/50 hover:shadow-lg hover:shadow-wood/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Photograph */}
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {p.image ? (
          <img
            src={p.image || '/placeholder.svg'}
            alt={p.imageAlt ?? ''}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span className={cn('flex size-full items-center justify-center', toneCover[p.tone])}>
            <Icon className="size-10" strokeWidth={1.5} />
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
          <h3 className="font-serif text-xl leading-tight tracking-tight text-white text-balance">
            {p.name}
          </h3>
          <ArrowUpRight
            className="size-4 shrink-0 text-white/70 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
            strokeWidth={2}
          />
        </div>
        <span
          className={cn(
            'absolute left-4 top-4 inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold',
            statusStyle[p.status],
          )}
        >
          {p.status}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">{p.summary}</p>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Progress</span>
            <span className="font-semibold tabular-nums">{p.progress}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-wood-foreground transition-[width] duration-700 ease-out"
              style={{ width: `${width}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
            <span>{p.spent} spent</span>
            <span>{p.budget} budget</span>
          </div>
        </div>

        {/* Next milestone — elevated */}
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-wood/30 bg-wood/[0.1] p-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-wood/25 text-wood-foreground">
            <Flag className="size-4.5" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-wood-foreground">
              Next milestone
            </p>
            <p className="mt-0.5 text-sm font-medium leading-tight">
              {p.nextMilestone}
              <span className="font-normal text-muted-foreground"> · {p.nextWhen}</span>
            </p>
          </div>
        </div>

        {/* Secondary meta */}
        <dl className="mt-3 space-y-2 text-xs">
          <div className="flex items-center gap-2.5">
            <HardHat className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
            <dt className="sr-only">Contractor</dt>
            <dd className="flex-1 text-muted-foreground">{p.contractor ?? 'No contractor yet'}</dd>
          </div>
          <div className="flex items-center gap-2.5">
            <CalendarClock className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
            <dt className="sr-only">Timeline</dt>
            <dd className="flex-1 text-muted-foreground tabular-nums">
              {p.started} → {p.targetEnd}
            </dd>
          </div>
        </dl>
      </div>
    </button>
  )
}
