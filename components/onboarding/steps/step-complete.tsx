'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, FileText, House, ScanLine, ShieldCheck, Wind } from 'lucide-react'
import { useOnboarding } from '../onboarding-provider'
import { clearOnboarding, homeShortName, majorSystems } from '@/lib/onboarding'
import { completeOnboarding } from '@/lib/actions/onboarding'

export function StepComplete() {
  const { data, goTo } = useOnboarding()
  const router = useRouter()
  const [saving, setSaving] = useState<'scan' | 'home' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const shortName = homeShortName(data.home.street)
  const systemLabels = data.systems
    .map((system) => majorSystems.find((candidate) => candidate.key === system.key)?.label ?? system.key)
    .slice(0, 4)
  const knownFacts = [
    data.home.yearBuilt ? `Built in ${data.home.yearBuilt}` : null,
    data.home.sqft ? `${data.home.sqft} sq ft` : null,
    data.home.city && data.home.state ? `${data.home.city}, ${data.home.state}` : null,
  ].filter((value): value is string => Boolean(value))

  async function finish(destination: 'scan' | 'home') {
    setSaving(destination)
    setError(null)
    const result = await completeOnboarding(data)
    if (result?.error) {
      setError(result.error)
      setSaving(null)
      return
    }
    clearOnboarding()
    router.push(destination === 'scan' ? '/library/upload?type=photo' : '/')
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center px-5 py-12 sm:px-8">
      <div className="text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-md">
          <House className="size-8" strokeWidth={1.75} />
        </span>
        <p className="mt-5 text-sm font-medium text-sage-foreground">Ready for your first useful result</p>
        <h1 className="mt-2 text-balance font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
          Give {shortName} its first memory.
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-pretty text-base leading-relaxed text-muted-foreground">
          Scan one appliance label, receipt, warranty, or manual. GatherRoot will extract only what
          it can support and ask you to confirm anything uncertain.
        </p>
      </div>

      <section className="mt-8 overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-sage/15 text-sage-foreground">
            <House className="size-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{data.home.street}</p>
            <p className="text-xs text-muted-foreground">This is what you have confirmed so far.</p>
          </div>
        </div>
        <div className="space-y-5 p-5">
          {knownFacts.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Home facts</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {knownFacts.map((fact) => <span key={fact} className="rounded-xl bg-secondary/60 px-3 py-2 text-sm">{fact}</span>)}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Systems</p>
            {systemLabels.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {systemLabels.map((label) => (
                  <span key={label} className="inline-flex items-center gap-1.5 rounded-xl bg-secondary/60 px-3 py-2 text-sm">
                    <Wind className="size-3.5 text-sage-foreground" />{label}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">None added yet—that is okay.</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-3xl border border-sage/30 bg-accent/40 p-5">
        <p className="flex items-center gap-2 text-sm font-medium text-sage-foreground">
          <ShieldCheck className="size-4" strokeWidth={2} /> What happens after the scan
        </p>
        <ul className="mt-3 space-y-2 text-sm text-foreground/85">
          <li className="flex gap-2"><FileText className="mt-0.5 size-4 shrink-0" />The original file stays attached as evidence.</li>
          <li className="flex gap-2"><ScanLine className="mt-0.5 size-4 shrink-0" />Extracted model, warranty, cost, or maintenance details remain traceable to it.</li>
          <li className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0" />Low-confidence details wait for your review instead of becoming facts.</li>
        </ul>
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => finish('scan')}
          disabled={saving !== null}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-base font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-70"
        >
          {saving === 'scan' ? 'Creating your home…' : 'Scan My First Item'}
          {!saving && <ArrowRight className="size-4.5" strokeWidth={2.25} />}
        </button>
        <button
          type="button"
          onClick={() => finish('home')}
          disabled={saving !== null}
          className="rounded-2xl border border-border bg-card px-6 py-3.5 text-base font-medium shadow-sm hover:bg-accent/40 disabled:opacity-70"
        >
          {saving === 'home' ? 'Creating your home…' : 'Explore My Home'}
        </button>
      </div>

      <button type="button" onClick={() => goTo(2)} disabled={saving !== null} className="mx-auto mt-4 text-sm font-medium text-muted-foreground hover:text-foreground">
        Review home details
      </button>
      {error && <p role="alert" className="mt-4 text-center text-sm text-destructive">{error}</p>}
    </main>
  )
}
