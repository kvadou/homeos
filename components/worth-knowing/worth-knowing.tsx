'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, ArrowRight, Lightbulb, RefreshCw } from 'lucide-react'
import { factToneStyles, factIcon, type Fact } from '@/lib/worth-knowing-data'
import { AiBadge } from '@/components/ai-badge'
import { cn } from '@/lib/utils'

export function WorthKnowing({ facts }: { facts: Fact[] }) {
  /* A rotating spotlight — press "Show me another" to shuffle the hero fact,
     so the page feels alive and rewards coming back. */
  const [spotlight, setSpotlight] = useState(0)

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      {/* Editorial masthead — reads like the cover of a little magazine about
          your home, not a dashboard header. */}
      <header className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
          <Lightbulb className="size-3.5 text-sage-foreground" strokeWidth={2} />
          Worth Knowing
        </span>
        <h1 className="mx-auto mt-4 max-w-2xl text-balance font-serif text-4xl leading-[1.1] tracking-tight sm:text-5xl">
          The little things that make your home yours.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
          Not tasks. Not to-dos. Just the quietly interesting things HomeOS has
          pieced together about your home over the years.
        </p>
      </header>

      {facts.length === 0 ? (
        <section className="rounded-3xl border border-border/70 bg-card p-10 text-center">
          <Lightbulb className="mx-auto size-7 text-sage-foreground" strokeWidth={1.5} />
          <p className="mx-auto mt-4 max-w-md text-pretty font-serif text-2xl leading-snug tracking-tight">
            Nothing worth knowing just yet.
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            As HomeOS learns your home — its systems, history, and rhythms — the
            interesting patterns it notices will collect here.
          </p>
        </section>
      ) : (
        <WorthKnowingBody facts={facts} spotlight={spotlight % facts.length} onNext={() => setSpotlight((s) => s + 1)} />
      )}

      {/* Gentle handoff to the conversational surface */}
      <section className="rounded-3xl border border-border/70 bg-secondary/30 p-7 text-center">
        <Sparkles className="mx-auto size-6 text-sage-foreground" strokeWidth={1.75} />
        <p className="mx-auto mt-3 max-w-md text-pretty font-serif text-xl leading-snug tracking-tight">
          Curious about something else?
        </p>
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
          Ask HomeOS about the records you have saved. If the answer is not documented, it will say so.
        </p>
        <Link
          href="/ask"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          Ask HomeOS
          <ArrowRight className="size-4" strokeWidth={2.25} />
        </Link>
      </section>
    </div>
  )
}

function WorthKnowingBody({
  facts,
  spotlight,
  onNext,
}: {
  facts: Fact[]
  spotlight: number
  onNext: () => void
}) {
  const hero = facts[spotlight]
  const rest = facts.filter((_, i) => i !== spotlight)
  const heroTone = factToneStyles[hero.tone]
  const HeroIcon = factIcon(hero.icon)

  return (
    <>
      {/* Fact of the day — the spotlight */}
      <section
        className={cn(
          'relative overflow-hidden rounded-3xl border p-7 sm:p-10',
          hero.tone === 'sage' && 'border-sage/25 bg-sage/[0.07]',
          hero.tone === 'wood' && 'border-wood/30 bg-wood/[0.09]',
          hero.tone === 'navy' && 'border-border/70 bg-card',
        )}
      >
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <span
            className={cn(
              'flex size-16 shrink-0 items-center justify-center rounded-2xl',
              heroTone.icon,
            )}
          >
            <HeroIcon className="size-8" strokeWidth={1.5} />
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <AiBadge verb="interesting" />
              <span className="text-xs font-medium text-muted-foreground">· {hero.category}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              {hero.stat && (
                <span
                  className={cn(
                    'font-serif text-5xl leading-none tracking-tight tabular-nums',
                    heroTone.stat,
                  )}
                >
                  {hero.stat}
                </span>
              )}
              <h2 className="text-balance font-serif text-2xl leading-tight tracking-tight sm:text-3xl">
                {hero.headline}
              </h2>
            </div>
            <p className="mt-3 max-w-2xl text-pretty text-[15px] leading-relaxed text-foreground/90">
              {hero.detail}
            </p>
            <p className="mt-3 text-xs italic leading-relaxed text-muted-foreground">
              {hero.basis}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {facts.length > 1 && (
            <button
              type="button"
              onClick={onNext}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RefreshCw className="size-4 text-sage-foreground" strokeWidth={2} />
              Show me another
            </button>
          )}
          <Link
            href={hero.action?.href ?? '/ask'}
            className="inline-flex min-h-10 items-center gap-1.5 px-2 py-2 text-sm font-medium text-primary transition-opacity hover:opacity-80"
          >
            {hero.action?.label ?? 'Ask me about this'}
            <ArrowRight className="size-4" strokeWidth={2.25} />
          </Link>
        </div>
      </section>

      {/* The rest — a light, browsable collection */}
      {rest.length > 0 && (
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            More about your home
          </h2>
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
            {rest.map((f) => {
              const tone = factToneStyles[f.tone]
              const Icon = factIcon(f.icon)
              return (
                <article
                  key={f.id}
                  className="flex break-inside-avoid flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sage/40 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'flex size-10 items-center justify-center rounded-xl',
                        tone.icon,
                      )}
                    >
                      <Icon className="size-5" strokeWidth={1.75} />
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[11px] font-medium',
                        tone.badge,
                      )}
                    >
                      {f.category}
                    </span>
                  </div>
                  {f.stat && (
                    <p
                      className={cn(
                        'mt-4 font-serif text-3xl leading-none tracking-tight tabular-nums',
                        tone.stat,
                      )}
                    >
                      {f.stat}
                    </p>
                  )}
                  <h3 className="mt-3 text-pretty font-serif text-lg leading-snug tracking-tight">
                    {f.headline}
                  </h3>
                  <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                    {f.detail}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/50 pt-3">
                    <p className="text-xs italic leading-relaxed text-muted-foreground/80">
                      {f.basis}
                    </p>
                    <Link
                      href={f.action?.href ?? '/ask'}
                      className="-mx-2 -my-3 inline-flex shrink-0 items-center gap-1 whitespace-nowrap px-2 py-3 text-[11px] font-medium text-primary transition-opacity hover:opacity-80"
                    >
                      {f.action?.label ?? 'Ask about this'}
                      <ArrowRight className="size-3" strokeWidth={2.5} />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}
    </>
  )
}
