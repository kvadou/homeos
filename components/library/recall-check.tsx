'use client'

import { useState } from 'react'
import { ExternalLink, Loader2, ShieldCheck, TriangleAlert } from 'lucide-react'

type Match = { id: string; title: string; date: string | null; url: string | null; hazard: string | null; remedy: string | null; confidence: string }

export function RecallCheck({ itemId, canCheck }: { itemId: string; canCheck: boolean }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [matches, setMatches] = useState<Match[] | null>(null)

  async function check() {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/items/${itemId}/recalls`)
      const body = await res.json() as { error?: string; matches?: Match[] }
      if (!res.ok) throw new Error(body.error ?? 'Could not check recalls.')
      setMatches(body.matches ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not check recalls.')
    } finally { setLoading(false) }
  }

  return (
    <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sage/15 text-sage-foreground"><ShieldCheck className="size-5" /></span>
        <div className="flex-1">
          <h2 className="font-serif text-xl tracking-tight">Safety & recalls</h2>
          <p className="mt-1 text-sm text-muted-foreground">Check this item against the official U.S. Consumer Product Safety Commission feed.</p>
        </div>
        <button type="button" onClick={check} disabled={loading || !canCheck} className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50">
          {loading && <Loader2 className="size-3.5 animate-spin" />}{matches === null ? 'Check now' : 'Check again'}
        </button>
      </div>
      {!canCheck && <p className="mt-4 rounded-xl bg-secondary/50 px-3.5 py-2.5 text-sm text-muted-foreground">Add the manufacturer or model number to enable a reliable check.</p>}
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      {matches?.length === 0 && <p className="mt-4 rounded-xl bg-sage/10 px-3.5 py-2.5 text-sm">No matching CPSC recalls were found. This is not a guarantee that the product is recall-free.</p>}
      {matches && matches.length > 0 && <div className="mt-4 space-y-3">{matches.map((m) => (
        <article key={m.id} className="rounded-2xl border border-wood/30 bg-wood/10 p-4">
          <div className="flex gap-2"><TriangleAlert className="mt-0.5 size-4 shrink-0 text-wood-foreground" /><div><p className="text-sm font-medium">{m.title}</p>{m.hazard && <p className="mt-1 text-sm text-muted-foreground">{m.hazard}</p>}{m.remedy && <p className="mt-2 text-xs"><span className="font-medium">Remedy:</span> {m.remedy}</p>}{m.url && <a href={m.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">Verify on CPSC.gov <ExternalLink className="size-3" /></a>}</div></div>
        </article>
      ))}</div>}
    </section>
  )
}

