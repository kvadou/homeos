'use client'

import { useState, useTransition } from 'react'
import { Sparkles, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { acceptSuggestion, rejectSuggestion } from '@/lib/actions/suggestions'

export type SuggestionCard = {
  id: string
  summary: string
  target: string
  confidence: number
}

const targetLabel: Record<string, string> = {
  items: 'New item',
  care_tasks: 'Maintenance',
  care_events: 'Service history',
  insights: 'Insight',
  timeline_events: 'Timeline',
  contractors: 'Contractor',
  warranties: 'Warranty',
}

/**
 * The one human-confirm surface (engine doc §2): every queued AI proposal
 * renders here as a card with Accept / Dismiss. No modals, ever.
 */
export function ReviewQueue({ suggestions }: { suggestions: SuggestionCard[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const visible = suggestions.filter((s) => !dismissed.has(s.id))
  if (!visible.length) return null

  function act(id: string, fn: typeof acceptSuggestion) {
    setBusy(id)
    setError(null)
    startTransition(async () => {
      const res = await fn(id)
      setBusy(null)
      if (res.error) {
        setError(res.error)
        return
      }
      setDismissed((prev) => new Set(prev).add(id))
    })
  }

  return (
    <section
      aria-label="HomeOS suggestions"
      className="rounded-3xl border border-sage/30 bg-accent/30 p-5 sm:p-6"
    >
      <header className="mb-4 flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-xl bg-sage/20 text-sage-foreground">
          <Sparkles className="size-4" strokeWidth={2} />
        </span>
        <div>
          <h2 className="text-sm font-semibold">HomeOS found something</h2>
          <p className="text-xs text-muted-foreground">
            From your documents — confirm what looks right.
          </p>
        </div>
      </header>

      <ul className="space-y-3">
        {visible.map((s) => (
          <li
            key={s.id}
            className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <span className="mb-1 inline-block rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {targetLabel[s.target] ?? s.target}
              </span>
              <p className="text-sm leading-snug">{s.summary}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                disabled={busy === s.id}
                onClick={() => act(s.id, rejectSuggestion)}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-60"
              >
                <X className="size-4" strokeWidth={2} />
                Dismiss
              </button>
              <button
                type="button"
                disabled={busy === s.id}
                onClick={() => act(s.id, acceptSuggestion)}
                className={cn(
                  'inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60',
                )}
              >
                {busy === s.id ? (
                  <Loader2 className="size-4 animate-spin" strokeWidth={2} />
                ) : (
                  <Check className="size-4" strokeWidth={2.25} />
                )}
                Accept
              </button>
            </div>
          </li>
        ))}
      </ul>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </section>
  )
}
