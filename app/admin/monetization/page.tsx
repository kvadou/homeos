import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin-auth'

export const metadata: Metadata = { title: 'Monetization research · GatherRoot Admin' }
export const dynamic = 'force-dynamic'

type ResponseRow = {
  id: string
  user_id: string
  response: string
  price_cents: number
  billing_period: string
  activated: boolean
  surface: string
  created_at: string
}

export default async function MonetizationAdminPage() {
  const { admin } = await requireAdmin()
  const { data } = await admin.from('monetization_research_responses' as never)
    .select('id,user_id,response,price_cents,billing_period,activated,surface,created_at')
    .order('created_at', { ascending: false }) as unknown as { data: ResponseRow[] | null }
  const rows = data ?? []
  const activated = rows.filter((row) => row.activated)
  const positive = activated.filter((row) => row.response === 'likely' || row.response === 'early_access')
  const uniqueActivated = new Set(activated.map((row) => row.user_id)).size
  const uniquePositive = new Set(positive.map((row) => row.user_id)).size
  const positiveRate = uniqueActivated ? Math.round((uniquePositive / uniqueActivated) * 100) : 0
  const counts = ['early_access', 'likely', 'maybe', 'not_now'].map((response) => ({
    response,
    count: rows.filter((row) => row.response === response).length,
  }))

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Phase 5</p><h1 className="mt-2 font-serif text-4xl tracking-tight">Monetization validation</h1><p className="mt-2 text-sm text-muted-foreground">Research evidence only. Charging remains disabled.</p></div>
          <div className="flex gap-2"><Link href="/admin" className="rounded-xl border border-border px-3 py-2 text-sm">Admin</Link><Link href="/admin/providers" className="rounded-xl border border-border px-3 py-2 text-sm">Providers</Link></div>
        </div>

        <section className="mt-8 grid gap-3 sm:grid-cols-4">
          <Metric label="Responses" value={rows.length} />
          <Metric label="Activated households" value={uniqueActivated} />
          <Metric label="Positive intent" value={uniquePositive} />
          <Metric label="Activated positive rate" value={`${positiveRate}%`} />
        </section>

        <section className="mt-6 rounded-3xl border border-border bg-card p-5">
          <h2 className="font-serif text-xl">Charging gate</h2>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-sage" style={{ width: `${Math.min(100, uniqueActivated * 5)}%` }} /></div>
          <p className="mt-2 text-sm text-muted-foreground">{uniqueActivated}/20 activated-household responses · {uniquePositive}/6 positive-intent minimum</p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">The gate also requires 10 interviews, no material activation decline, legal review, payment reconciliation, restore purchases, and explicit founder pricing approval.</p>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-4">{counts.map((item) => <Metric key={item.response} label={item.response.replace('_', ' ')} value={item.count} />)}</section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4"><h2 className="font-serif text-xl">Recent responses</h2></div>
          {rows.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No responses yet. Invite activated beta households to open Membership from Settings.</p> : (
            <div className="divide-y divide-border">{rows.slice(0, 50).map((row) => <div key={row.id} className="grid gap-1 px-5 py-4 text-sm sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-5"><div><p className="font-medium capitalize">{row.response.replace('_', ' ')}</p><p className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</p></div><span>${(row.price_cents / 100).toFixed(0)}/{row.billing_period}</span><span className="text-muted-foreground">{row.activated ? 'Activated' : 'Pre-value'}</span><span className="text-muted-foreground">{row.surface}</span></div>)}</div>
          )}
        </section>
      </div>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-border bg-card p-4"><p className="font-serif text-3xl tracking-tight">{value}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{label}</p></div>
}
