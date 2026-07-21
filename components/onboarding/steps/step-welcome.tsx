'use client'

import {
  ArrowRight,
  CheckCircle2,
  FolderUp,
  House,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useOnboarding } from '../onboarding-provider'

const promises = [
  'Skip any question and change it later',
  'Use every feature as soon as your home is created',
  'Keep AI findings connected to their source',
]

export function StepWelcome() {
  const { next, finishing, finish } = useOnboarding()

  return (
    <main className="mx-auto flex min-h-[calc(100svh-8.5rem)] max-w-2xl flex-col justify-center px-5 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto w-full max-w-xl text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <House className="size-7" strokeWidth={1.75} aria-hidden />
        </span>
        <p className="mt-5 text-sm font-medium text-sage-foreground">Welcome to GatheredOS</p>
        <h1 className="mt-2 text-balance font-serif text-4xl leading-[1.08] tracking-tight sm:text-5xl">
          Your home&rsquo;s memory starts here.
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-pretty text-base leading-relaxed text-muted-foreground">
          Give us almost nothing. GatheredOS will create a useful starting point and become smarter through the photos, documents, and decisions you add over time.
        </p>
      </div>

      <div className="mx-auto mt-9 w-full max-w-lg space-y-3">
        <button
          type="button"
          onClick={next}
          disabled={finishing !== null}
          className="flex min-h-16 w-full items-center gap-4 rounded-2xl bg-primary px-5 py-4 text-left text-primary-foreground transition-opacity hover:opacity-92 disabled:opacity-60"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Sparkles className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold">Get Started</span>
            <span className="mt-0.5 block text-sm text-primary-foreground/80">Recommended · about 3 minutes</span>
          </span>
          <ArrowRight className="size-5 shrink-0" aria-hidden />
        </button>

        <button
          type="button"
          onClick={() => void finish('bulk')}
          disabled={finishing !== null}
          className="flex min-h-16 w-full items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 text-left transition-colors hover:bg-accent/40 disabled:opacity-60"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            {finishing === 'bulk'
              ? <Loader2 className="size-5 animate-spin" aria-hidden />
              : <FolderUp className="size-5" strokeWidth={1.75} aria-hidden />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold">Import Everything</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">Start with your documents and photos</span>
          </span>
          <ArrowRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </div>

      <div className="mx-auto mt-7 w-full max-w-lg border-t border-border/70 pt-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-sage-foreground" strokeWidth={1.75} aria-hidden />
          <div>
            <p className="text-sm font-medium">Nothing is locked behind setup.</p>
            <ul className="mt-2 space-y-2">
              {promises.map((promise) => (
                <li key={promise} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sage-foreground" strokeWidth={2} aria-hidden />
                  {promise}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}
