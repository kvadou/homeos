'use client'

import { House, Check, Loader2 } from 'lucide-react'
import { useOnboarding } from './onboarding-provider'
import { STEP_COUNT, stepPhase } from '@/lib/onboarding'
import { cn } from '@/lib/utils'

export function OnboardingChrome() {
  const { step, saveState, finishing, finishError, finish } = useOnboarding()

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center gap-4 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <House className="size-4" strokeWidth={2.25} />
          </span>
          <span className="font-serif text-lg tracking-tight text-[#1F3D34]">GatheredOS</span>
        </div>

        {/* Segmented progress */}
        <div className="flex flex-1 items-center gap-1.5" aria-hidden="true">
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-2.5 flex-1 rounded-full transition-all duration-500',
                i < step ? 'bg-sage shadow-sm' : 'bg-border/80',
              )}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span
            className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"
            aria-live="polite"
          >
            {saveState === 'saving' ? (
              <>
                <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
                Saving
              </>
            ) : saveState === 'saved' ? (
              <>
                <Check className="size-3.5 text-sage-foreground" strokeWidth={2.5} />
                Saved
              </>
            ) : null}
          </span>
        </div>
      </div>

      <div className="mx-auto flex max-w-2xl items-center justify-between px-5 pb-3 sm:px-8">
        <p className="flex items-baseline gap-2">
          <span
            key={step}
            className="ob-fade-in text-sm font-medium text-foreground"
          >
            {stepPhase[step]}
          </span>
          <span className="text-xs text-muted-foreground">
            {step} / {STEP_COUNT}
          </span>
        </p>
        <button
          type="button"
          disabled={finishing !== null}
          onClick={() => void finish('home')}
          className="min-h-11 rounded-xl px-2 text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline disabled:opacity-60"
        >
          {finishing === 'home' ? 'Opening your home…' : 'Skip setup'}
        </button>
      </div>
      {finishError && (
        <p role="alert" className="mx-auto max-w-2xl px-5 pb-3 text-right text-xs text-destructive sm:px-8">
          {finishError}
        </p>
      )}
    </header>
  )
}
