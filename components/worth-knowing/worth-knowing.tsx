'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Database, ShieldCheck } from 'lucide-react'
import { factToneStyles, factIcon, type Fact, type FactGroup } from '@/lib/worth-knowing-data'
import type { HomeIntelligenceProfile } from '@/lib/home-intelligence'
import { cn } from '@/lib/utils'

const groups: Array<'All' | FactGroup> = [
  'All',
  'Care & timing',
  'Money & savings',
  'Documents',
  'Home history',
]

const groupPriority: Record<FactGroup, number> = {
  'Care & timing': 0,
  Documents: 1,
  'Money & savings': 2,
  'Home history': 3,
}

function evidenceLabel(fact: Fact): string {
  const evidence = fact.evidenceCount > 0
    ? `${fact.evidenceCount} evidence source${fact.evidenceCount === 1 ? '' : 's'}`
    : fact.source
  if (fact.confidence == null) return evidence
  return `${evidence} · ${Math.round(fact.confidence * 100)}% confidence`
}

function IntelligenceSummary({ intelligence }: { intelligence: HomeIntelligenceProfile }) {
  const progress = Math.round((intelligence.verified / intelligence.total) * 100)

  return (
    <aside className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold">Intelligence coverage</h2>
          <span className="text-sm font-semibold tabular-nums text-sage-foreground">
            {intelligence.verified} of {intelligence.total}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Verified home intelligence signals"
          aria-valuemin={0}
          aria-valuemax={intelligence.total}
          aria-valuenow={intelligence.verified}
          className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full rounded-full bg-sage" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-4 text-base font-medium">{intelligence.stage} intelligence</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{intelligence.stageDetail}</p>

        <ul className="mt-5 space-y-3 border-t border-border/70 pt-5">
          {intelligence.checks.filter((check) => check.complete).slice(-3).map((check) => (
            <li key={check.id} className="flex items-start gap-2 text-sm leading-relaxed">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sage-foreground" strokeWidth={2} aria-hidden />
              <span><span className="font-medium">{check.label}</span><span className="text-muted-foreground"> · {check.capability}</span></span>
            </li>
          ))}
        </ul>

        {intelligence.nextStep && (
          <div className="mt-5 border-t border-border/70 pt-5">
            <p className="text-sm font-semibold">Improve the next insight</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {intelligence.nextStep.title}. {intelligence.nextStep.detail}
            </p>
            <Link
              href={intelligence.nextStep.href}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {intelligence.nextStep.action}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border/70 bg-secondary/30 p-6">
        <ShieldCheck className="size-5 text-sage-foreground" strokeWidth={1.75} aria-hidden />
        <h2 className="mt-3 text-base font-semibold">Every conclusion shows its work</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          GatheredOS keeps the source, evidence, and confidence beside each observation. Missing information stays visible instead of being guessed.
        </p>
      </section>
    </aside>
  )
}

export function WorthKnowing({ facts, intelligence }: { facts: Fact[]; intelligence: HomeIntelligenceProfile }) {
  const [activeGroup, setActiveGroup] = useState<'All' | FactGroup>('All')
  const sortedFacts = [...facts].sort((a, b) => {
    const groupDifference = groupPriority[a.group] - groupPriority[b.group]
    if (groupDifference !== 0) return groupDifference
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
  const visibleFacts = activeGroup === 'All'
    ? sortedFacts
    : sortedFacts.filter((fact) => fact.group === activeGroup)

  return (
    <div className="space-y-12">
      <header className="max-w-3xl">
        <p className="text-sm font-medium text-sage-foreground">Home Intelligence</p>
        <h1 className="mt-2 text-balance font-serif text-4xl leading-tight tracking-tight">
          What GatheredOS understands about your home.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Personal observations ordered by usefulness, with the records and reasoning behind each one.
        </p>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <main className="min-w-0">
          <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Intelligence ledger</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {facts.length} active observation{facts.length === 1 ? '' : 's'} based on your home record.
              </p>
            </div>
            <div className="flex flex-wrap gap-2" aria-label="Filter home intelligence">
              {groups.map((group) => (
                <button
                  key={group}
                  type="button"
                  aria-pressed={activeGroup === group}
                  onClick={() => setActiveGroup(group)}
                  className={cn(
                    'min-h-11 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                    activeGroup === group ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent',
                  )}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>

          {visibleFacts.length === 0 ? (
            <section className="py-12 text-center">
              <Database className="mx-auto size-8 text-sage-foreground" strokeWidth={1.75} aria-hidden />
              <h2 className="mt-4 font-serif text-2xl tracking-tight">
                {facts.length === 0 ? 'Your intelligence ledger is taking shape.' : `No ${activeGroup.toLowerCase()} observations yet.`}
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-base leading-relaxed text-muted-foreground">
                GatheredOS only adds an observation when your records support something personal, timely, or actionable.
              </p>
              {intelligence.nextStep && (
                <Link href={intelligence.nextStep.href} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
                  {intelligence.nextStep.action}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              )}
            </section>
          ) : (
            <ol className="divide-y divide-border/70">
              {visibleFacts.map((fact) => {
                const Icon = factIcon(fact.icon)
                const tone = factToneStyles[fact.tone]
                return (
                  <li key={fact.id}>
                    <article className="py-6">
                      <div className="flex gap-4">
                        <span className={cn('mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl', tone.icon)}>
                          <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 max-w-2xl">
                              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">{fact.group}</span>
                                <span aria-hidden>·</span>
                                <span>{fact.category}</span>
                              </div>
                              <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                {fact.stat && <span className={cn('text-xl font-semibold tabular-nums', tone.stat)}>{fact.stat}</span>}
                                <h3 className="text-pretty font-serif text-xl leading-snug tracking-tight">{fact.headline}</h3>
                              </div>
                              {fact.detail && <p className="mt-2 max-w-[65ch] text-base leading-relaxed text-foreground/90">{fact.detail}</p>}
                              <div className="mt-4 rounded-xl bg-secondary/40 p-4">
                                <p className="flex items-start gap-2 text-sm font-medium">
                                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-sage-foreground" strokeWidth={2} aria-hidden />
                                  Why you&apos;re seeing this
                                </p>
                                <p className="mt-1.5 max-w-[65ch] text-sm leading-relaxed text-muted-foreground">{fact.basis || 'Based on a verified record saved for your home.'}</p>
                                <p className="mt-2 text-sm text-muted-foreground">{evidenceLabel(fact)}</p>
                              </div>
                            </div>
                            <Link
                              href={fact.action?.href ?? '/ask'}
                              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                            >
                              {fact.action?.label ?? 'Ask about this'}
                              <ArrowRight className="size-4" aria-hidden />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  </li>
                )
              })}
            </ol>
          )}
        </main>

        <IntelligenceSummary intelligence={intelligence} />
      </div>
    </div>
  )
}
