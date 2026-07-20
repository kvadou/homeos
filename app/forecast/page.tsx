import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarRange, ChevronRight, CircleDollarSign, Info, PiggyBank } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { requireHome } from '@/lib/supabase/home'
import { createClient } from '@/lib/supabase/server'
import { buildForecast } from '@/lib/forecast'

export const metadata: Metadata = { title: 'Home forecast · GatheredOS', description: 'An explainable replacement and project spending outlook.' }
const money = (n: number) => n ? `$${Math.round(n).toLocaleString()}` : 'Not estimated'
const range = (x: { low: number; high: number }) => !x.high ? 'Not estimated' : x.low === x.high ? money(x.low) : `${money(x.low)}–${money(x.high)}`

export default async function ForecastPage() {
  const home = await requireHome()
  const supabase = await createClient()
  const [items, projects] = await Promise.all([
    supabase.from('items').select('*').eq('home_id', home.id),
    supabase.from('projects').select('*').eq('home_id', home.id),
  ])
  const forecast = buildForecast(home, items.data ?? [], projects.data ?? [])
  const horizons = [
    { label: 'Next 12 months', value: range(forecast.totals.one) },
    { label: 'Next 5 years', value: range(forecast.totals.five) },
    { label: 'Next 10 years', value: range(forecast.totals.ten) },
  ]
  return <AppShell><div className="space-y-6">
    <header><p className="text-xs font-medium uppercase tracking-[0.18em] text-sage-foreground">Planning outlook</p><h1 className="mt-2 font-serif text-4xl tracking-tight">What your home may need next</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Replacement timing comes from your recorded installation dates and expected lifespans. Costs use regional 2026 benchmarks and are estimates, not quotes.</p></header>
    <div className="grid gap-3 sm:grid-cols-3">{horizons.map((h) => <div key={h.label} className="rounded-3xl border border-border bg-card p-5 shadow-sm"><CalendarRange className="size-5 text-muted-foreground" /><p className="mt-4 font-serif text-2xl tracking-tight">{h.value}</p><p className="mt-1 text-xs text-muted-foreground">{h.label}</p></div>)}</div>
    <section className="flex items-start gap-4 rounded-3xl border border-sage/25 bg-sage/[0.07] p-5 sm:p-6"><PiggyBank className="mt-1 size-6 text-sage-foreground" /><div><p className="text-sm font-medium">Suggested five-year reserve</p><p className="mt-1 font-serif text-3xl">{forecast.monthlyReserve ? `${money(forecast.monthlyReserve)}/month` : 'More information needed'}</p><p className="mt-2 text-xs text-muted-foreground">Uses the high end of estimated five-year costs divided across 60 months. Adjust this to your actual savings plan.</p></div></section>
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7"><div className="flex items-center gap-2"><CircleDollarSign className="size-5 text-wood-foreground" /><h2 className="font-serif text-2xl">Expected expenses</h2></div>{forecast.entries.length ? <div className="mt-5 divide-y divide-border/60">{forecast.entries.map((entry) => <Link key={`${entry.kind}-${entry.id}`} href={entry.href} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium">{entry.title}</p><span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{entry.kind}</span></div><p className="mt-1 text-xs text-muted-foreground">{entry.basis}</p></div><div className="text-right"><p className="text-sm font-medium tabular-nums">{entry.low ? range(entry) : 'Timing only'}</p><p className="text-xs text-muted-foreground">{entry.window}</p></div><ChevronRight className="mt-1 size-4 text-muted-foreground" /></Link>)}</div> : <p className="mt-5 rounded-2xl bg-secondary/30 p-4 text-sm text-muted-foreground">Add installation dates and item details to create a forecast.</p>}</section>
    {forecast.missingCount > 0 && <section className="flex gap-3 rounded-2xl border border-border bg-card p-4"><Info className="mt-0.5 size-4 text-muted-foreground" /><p className="text-sm text-muted-foreground">{forecast.missingCount} item{forecast.missingCount === 1 ? '' : 's'} could not be forecast because an installation date or lifespan is missing. Scan its label or edit the item to improve this outlook.</p></section>}
  </div></AppShell>
}
