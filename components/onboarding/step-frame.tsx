'use client'

import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useOnboarding } from './onboarding-provider'
import { stepMeta } from '@/lib/onboarding'
import { cn } from '@/lib/utils'

type StepFrameProps = {
  eyebrow?: string
  title: string
  description?: ReactNode
  children: ReactNode
  primaryLabel?: string
  onPrimary?: () => void
  primaryDisabled?: boolean
  /** Hide the standard footer entirely (for custom screens like Welcome/Complete) */
  hideFooter?: boolean
  /** Center the header text and constrain body width */
  centered?: boolean
}

export function StepFrame({
  eyebrow,
  title,
  description,
  children,
  primaryLabel = 'Continue',
  onPrimary,
  primaryDisabled = false,
  hideFooter = false,
  centered = false,
}: StepFrameProps) {
  const { step, next, back } = useOnboarding()
  const meta = stepMeta.find((m) => m.id === step)
  const optional = meta?.optional

  return (
    <div className="mx-auto flex min-h-[calc(100svh-8.5rem)] max-w-2xl flex-col px-5 pb-28 pt-8 sm:px-8 sm:pt-12">
      <div
        key={step}
        className={cn(
          'ob-step-enter flex-1',
          centered && 'flex flex-col items-center text-center',
        )}
      >
        <header className={cn('max-w-xl', centered && 'mx-auto')}>
          {eyebrow && (
            <p className="mb-3 text-sm font-medium text-sage-foreground">{eyebrow}</p>
          )}
          <h1 className="text-balance font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </header>

        <div className={cn('mt-10 sm:mt-12', centered && 'w-full')}>{children}</div>
      </div>

      {!hideFooter && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-background/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
            <button
              type="button"
              onClick={back}
              disabled={step === 1}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors',
                step === 1
                  ? 'invisible'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              <ArrowLeft className="size-4" strokeWidth={2.25} />
              Back
            </button>

            <div className="flex items-center gap-2">
              {optional && (
                <button
                  type="button"
                  onClick={next}
                  className="rounded-2xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  Skip
                </button>
              )}
              <button
                type="button"
                onClick={onPrimary ?? next}
                disabled={primaryDisabled}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {primaryLabel}
                <ArrowRight className="size-4" strokeWidth={2.25} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
