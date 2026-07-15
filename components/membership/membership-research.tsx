'use client'

import { useState, useTransition } from 'react'
import { Check, ShieldCheck } from 'lucide-react'
import { submitMonetizationResponse } from '@/lib/actions/monetization'
import { FREE_PROMISES, PLUS_BENEFITS, PLUS_PRICE_HYPOTHESES, type BillingPeriod, type MonetizationResponse } from '@/lib/monetization'
import { cn } from '@/lib/utils'

export function MembershipResearch({ activated, priorResponse }: { activated: boolean; priorResponse: string | null }) {
  const [period, setPeriod] = useState<BillingPeriod>('year')
  const [saved, setSaved] = useState(priorResponse)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const price = PLUS_PRICE_HYPOTHESES[period]

  function respond(response: MonetizationResponse) {
    setError(null)
    const form = new FormData()
    form.set('response', response)
    form.set('billingPeriod', period)
    startTransition(async () => {
      const result = await submitMonetizationResponse(form)
      if ('error' in result) setError(result.error ?? 'Please try again.')
      else setSaved(response)
    })
  }

  return (
    <div className="space-y-6">
      {!activated && (
        <div className="rounded-2xl border border-sage/30 bg-sage/[0.08] p-4 text-sm leading-relaxed text-muted-foreground">
          You are included in the beta. GatherRoot will focus on helping you build a useful home record before asking you to make an upgrade decision.
        </div>
      )}

      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sage-foreground">Price research</p>
            <h2 className="mt-2 font-serif text-3xl tracking-tight">GatherRoot Plus</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">For households that want GatherRoot to keep reasoning, coordinating, and preparing the home—not merely store its records.</p>
          </div>
          <ShieldCheck className="size-7 shrink-0 text-sage-foreground" strokeWidth={1.7} />
        </div>

        <div className="mt-6 inline-flex rounded-xl bg-secondary p-1" aria-label="Billing period">
          {(['year', 'month'] as const).map((choice) => (
            <button key={choice} type="button" onClick={() => setPeriod(choice)} className={cn('rounded-lg px-3 py-2 text-sm font-medium transition-colors', period === choice ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
              {choice === 'year' ? 'Annual' : 'Monthly'}
            </button>
          ))}
        </div>
        <p className="mt-4 font-serif text-3xl tracking-tight">{price.label}</p>
        {price.equivalent && <p className="text-sm text-muted-foreground">Equivalent to {price.equivalent}</p>}

        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {PLUS_BENEFITS.map((benefit) => <li key={benefit} className="flex gap-2 text-sm leading-relaxed"><Check className="mt-0.5 size-4 shrink-0 text-sage-foreground" />{benefit}</li>)}
        </ul>

        <div className="mt-7 border-t border-border pt-5">
          <p className="text-sm font-medium">If this were available at {price.label}, what would you do?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button disabled={pending} onClick={() => respond('early_access')} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">Request early access</button>
            <button disabled={pending} onClick={() => respond('likely')} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent/40 disabled:opacity-50">Likely subscribe</button>
            <button disabled={pending} onClick={() => respond('maybe')} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent/40 disabled:opacity-50">Maybe</button>
            <button disabled={pending} onClick={() => respond('not_now')} className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/40 disabled:opacity-50">Not now</button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">This records your preference only. You will not be charged, and no trial begins.</p>
          {saved && <p className="mt-3 text-sm text-sage-foreground">Thanks—your preference is saved. You can change it at any time.</p>}
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>
      </section>

      <section className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6">
        <h2 className="font-serif text-xl tracking-tight">Free stays useful</h2>
        <ul className="mt-4 space-y-3">{FREE_PROMISES.map((promise) => <li key={promise} className="flex gap-2 text-sm text-muted-foreground"><Check className="mt-0.5 size-4 shrink-0" />{promise}</li>)}</ul>
      </section>
    </div>
  )
}

