'use client'

import { useState, useTransition } from 'react'
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react'
import { iconFor, type RecommendedProject } from '@/lib/projects-data'
import { CareSection } from '@/components/care/care-section'
import { createProject } from '@/lib/actions/projects'

export function RecommendedProjects({ projects }: { projects: RecommendedProject[] }) {
  if (projects.length === 0) {
    return (
      <CareSection
        icon={<Sparkles className="size-5" strokeWidth={1.75} />}
        title="Recommended for Your Home"
        subtitle="Personalized to your home's age, systems, and history"
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          No recommendations yet. As GatherRoot learns your home’s systems and history, tailored next
          steps will appear here.
        </p>
      </CareSection>
    )
  }

  return (
    <CareSection
      icon={<Sparkles className="size-5" strokeWidth={1.75} />}
      title="Recommended for Your Home"
      subtitle="Personalized to your home's age, systems, and history"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {projects.map((r) => {
          const Icon = iconFor(r.icon)
          return (
          <div
            key={r.id}
            className="group flex flex-col rounded-2xl border border-border/60 bg-secondary/20 p-5"
          >
            {/* Icon + trust-based basis */}
            <div className="flex items-center justify-between gap-2">
              <span className="flex size-10 items-center justify-center rounded-xl bg-sage/15 text-sage-foreground">
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-sage/30 bg-sage/[0.08] px-2.5 py-1 text-[11px] font-medium text-sage-foreground">
                <ShieldCheck className="size-3" strokeWidth={2.25} />
                {r.basis}
              </span>
            </div>

            {/* Name — clear primary */}
            <h3 className="mt-4 font-serif text-lg leading-tight tracking-tight">{r.name}</h3>

            {/* Cost — the dominant figure */}
            <p className="mt-2 font-serif text-2xl tracking-tight tabular-nums">
              {r.cost}
              <span className="ml-1.5 font-sans text-[11px] font-normal uppercase tracking-wide text-muted-foreground">
                est · {r.timing}
              </span>
            </p>

            {/* A single conversational line — no bullet lists */}
            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{r.whyNow}</p>

            <RecommendationAction project={r} />
          </div>
          )
        })}
      </div>
    </CareSection>
  )
}

function RecommendationAction({ project }: { project: RecommendedProject }) {
  const [state, setState] = useState<'idle' | 'saved' | 'error'>('idle')
  const [pending, startTransition] = useTransition()
  function save() {
    startTransition(async () => {
      const result = await createProject({
        name: project.name,
        kind: project.cta === 'Start Planning' ? 'active' : 'idea',
        status: project.cta === 'Start Planning' ? 'Planning' : null,
        summary: project.whyNow,
        metadata: { source: 'recommendation', basis: project.basis, timing: project.timing },
      })
      setState(result.error ? 'error' : 'saved')
    })
  }
  return <div className="mt-5">
    <button type="button" onClick={save} disabled={pending || state === 'saved'} className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-card px-3 py-2.5 text-sm font-medium transition-colors hover:border-wood/50 hover:bg-wood/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-65">
      {pending ? 'Saving…' : state === 'saved' ? 'Saved to projects' : project.cta}
      {state === 'idle' && <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.25} />}
    </button>
    {state === 'error' && <p className="mt-2 text-xs text-destructive" role="alert">Could not save this project. Please try again.</p>}
  </div>
}
