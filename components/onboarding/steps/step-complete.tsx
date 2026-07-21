'use client'

import {
  ArrowRight,
  Camera,
  CheckCircle2,
  FileSearch,
  FileText,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { useOnboarding } from '../onboarding-provider'
import { homeShortName, type OnboardingDestination } from '@/lib/onboarding'
import { cn } from '@/lib/utils'

const firstActions: Array<{
  destination: OnboardingDestination
  title: string
  detail: string
  icon: typeof FileText
  recommended?: boolean
}> = [
  {
    destination: 'inspection',
    title: 'Upload an inspection report',
    detail: 'Find systems, flagged issues, dates, and useful next steps.',
    icon: FileSearch,
    recommended: true,
  },
  {
    destination: 'document',
    title: 'Upload a document',
    detail: 'Try a receipt, warranty, manual, invoice, or closing record.',
    icon: FileText,
  },
  {
    destination: 'photo',
    title: 'Take a photo of an appliance',
    detail: 'A model label or clear product photo is enough to start.',
    icon: Camera,
  },
]

export function StepComplete() {
  const { data, finishing, finish } = useOnboarding()
  const shortName = homeShortName(data.home.street)
  const availableNow = [
    data.home.street ? 'Local weather and seasonal timing' : null,
    data.home.yearBuilt ? 'Age-based home recommendations' : null,
    data.home.sqft ? 'More relevant project and cost ranges' : null,
    data.goals.length ? `Priorities shaped around ${data.goals.length} goal${data.goals.length === 1 ? '' : 's'}` : null,
  ].filter((value): value is string => Boolean(value))

  return (
    <main className="mx-auto min-h-[calc(100svh-8.5rem)] max-w-2xl px-5 pb-14 pt-8 sm:px-8 sm:pt-12">
      <header className="max-w-xl">
        <p className="flex items-center gap-2 text-sm font-medium text-sage-foreground">
          <Sparkles className="size-4" strokeWidth={2} aria-hidden />
          Your first AI moment
        </p>
        <h1 className="mt-3 text-balance font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
          Make {shortName} smarter in seconds.
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
          Choose one real input. GatheredOS will show what it finds, connect every finding to its source, and leave uncertain details for your review.
        </p>
      </header>

      {availableNow.length > 0 && (
        <section className="mt-7 rounded-2xl bg-secondary/45 p-5" aria-labelledby="available-now-heading">
          <h2 id="available-now-heading" className="text-sm font-semibold">Already useful</h2>
          <ul className="mt-3 space-y-2">
            {availableNow.map((capability) => (
              <li key={capability} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sage-foreground" strokeWidth={2} aria-hidden />
                {capability}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-7" aria-labelledby="first-input-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="first-input-heading" className="text-lg font-semibold">Choose your first input</h2>
            <p className="mt-1 text-sm text-muted-foreground">Each option takes about a minute.</p>
          </div>
          <span className="text-xs text-muted-foreground">Optional</span>
        </div>

        <div className="mt-4 divide-y divide-border/70 border-y border-border/70">
          {firstActions.map((action) => {
            const Icon = action.icon
            const isFinishing = finishing === action.destination
            return (
              <button
                key={action.destination}
                type="button"
                onClick={() => void finish(action.destination)}
                disabled={finishing !== null}
                className={cn(
                  'flex min-h-20 w-full items-center gap-4 px-1 py-4 text-left transition-colors hover:bg-accent/30 disabled:opacity-60 sm:px-3',
                  action.recommended && 'bg-sage/[0.06]',
                )}
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  {isFinishing
                    ? <Loader2 className="size-5 animate-spin" aria-hidden />
                    : <Icon className="size-5" strokeWidth={1.75} aria-hidden />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold sm:text-base">{action.title}</span>
                    {action.recommended && (
                      <span className="rounded-full bg-sage/20 px-2 py-0.5 text-[11px] font-medium text-sage-foreground">Recommended</span>
                    )}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{action.detail}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            )
          })}
        </div>
      </section>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => void finish('home')}
          disabled={finishing !== null}
          className="min-h-11 rounded-xl px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-60"
        >
          {finishing === 'home' ? 'Opening your dashboard…' : 'Skip for now and open my dashboard'}
        </button>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Your full Library, Projects, Care, and Ask tools remain available.</p>
      </div>
    </main>
  )
}
