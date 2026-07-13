import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { AlertTriangle, Droplets, ExternalLink, FileText, Flame, HardHat, House, Phone, ShieldAlert, Zap } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { requireHome } from '@/lib/supabase/home'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Emergency · HomeOS', description: 'Critical information for your home when every second matters.' }

const CRITICAL = /(shut.?off|breaker|electrical panel|gas valve|water main|sump|fire extinguisher|escape|emergency)/i

export default async function EmergencyPage() {
  const home = await requireHome()
  const supabase = await createClient()
  const [factsRes, itemsRes, contractorsRes, filesRes] = await Promise.all([
    supabase.from('home_facts').select('id,statement,predicate,category').eq('home_id', home.id).eq('is_current', true).order('created_at', { ascending: false }),
    supabase.from('items').select('id,name,category,manufacturer,model,status,summary').eq('home_id', home.id).order('name'),
    supabase.from('contractors').select('id,name,company,phone,email,notes').eq('home_id', home.id).order('name'),
    supabase.from('files').select('id,name,type,storage_path').eq('home_id', home.id).in('type', ['document','warranty']).order('created_at', { ascending: false }).limit(12),
  ])
  const facts = (factsRes.data ?? []).filter((f) => CRITICAL.test(`${f.predicate ?? ''} ${f.statement}`))
  const systems = (itemsRes.data ?? []).filter((i) => i.category === 'system')
  const contractors = (contractorsRes.data ?? []).filter((c) => c.phone).slice(0, 8)
  const files = filesRes.data ?? []
  const signed = files.length ? await supabase.storage.from('home-files').createSignedUrls(files.map((f) => f.storage_path), 900) : { data: [] }
  const urls = new Map((signed.data ?? []).map((x) => [x.path, x.signedUrl]))
  const address = [home.street, home.city, [home.state, home.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')

  return <AppShell showSearch={false}><div className="space-y-6">
    <header className="rounded-3xl bg-primary p-6 text-primary-foreground shadow-sm sm:p-8">
      <div className="flex items-start gap-4"><span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15"><ShieldAlert className="size-6" /></span><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground/70">Emergency mode</p><h1 className="mt-1 font-serif text-3xl tracking-tight">{home.name}</h1><p className="mt-2 text-sm text-primary-foreground/75">{address || 'Address not recorded'}</p></div></div>
      {address && <a href={`https://maps.apple.com/?q=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-sm font-medium">Open address in Maps <ExternalLink className="size-4" /></a>}
    </header>

    <section className="rounded-3xl border border-wood/30 bg-wood/10 p-5 sm:p-7"><div className="flex gap-3"><AlertTriangle className="mt-0.5 size-5 shrink-0 text-wood-foreground" /><div><h2 className="font-medium">If anyone is in immediate danger</h2><p className="mt-1 text-sm text-muted-foreground">Leave the home and call local emergency services. HomeOS records are reference information, not emergency instructions.</p><a href="tel:911" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 text-sm font-medium text-white"><Phone className="size-4" /> Call 911</a></div></div></section>

    <div className="grid gap-5 lg:grid-cols-2">
      <Card title="Shutoffs & critical locations" icon={Droplets} empty="No shutoff or emergency locations are recorded yet.">{facts.map((f) => <li key={f.id} className="rounded-2xl bg-secondary/40 px-4 py-3 text-sm">{f.statement}</li>)}</Card>
      <Card title="Major systems" icon={Zap} empty="No major systems are recorded yet.">{systems.map((s) => <li key={s.id} className="flex items-start gap-3 rounded-2xl bg-secondary/40 px-4 py-3"><Flame className="mt-0.5 size-4 text-muted-foreground" /><div><p className="text-sm font-medium">{s.name}</p><p className="text-xs text-muted-foreground">{[s.manufacturer, s.model, s.status].filter(Boolean).join(' · ') || s.summary || 'Details not recorded'}</p></div></li>)}</Card>
      <Card title="Emergency contacts" icon={HardHat} empty="No contractor phone numbers are recorded yet.">{contractors.map((c) => <li key={c.id} className="flex items-center gap-3 rounded-2xl bg-secondary/40 px-4 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{c.company || c.name}</p><p className="truncate text-xs text-muted-foreground">{c.company ? c.name : c.notes}</p></div><a href={`tel:${c.phone}`} aria-label={`Call ${c.company || c.name}`} className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Phone className="size-4" /></a></li>)}</Card>
      <Card title="Critical documents" icon={FileText} empty="No insurance or critical documents are available.">{files.map((f) => <li key={f.id}><a href={urls.get(f.storage_path) ?? '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl bg-secondary/40 px-4 py-3"><FileText className="size-4 text-muted-foreground" /><span className="min-w-0 flex-1 truncate text-sm font-medium">{f.name}</span><ExternalLink className="size-4 text-muted-foreground" /></a></li>)}</Card>
    </div>

    {facts.length === 0 && <section className="rounded-3xl border border-border bg-card p-6 text-center"><House className="mx-auto size-6 text-muted-foreground" /><h2 className="mt-3 font-serif text-xl">Complete your emergency record</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Photograph or tell HomeOS where your water shutoff, gas valve, electrical panel, sump pump, and fire extinguishers are located.</p><Link href="/ask" className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Add emergency knowledge with Ask</Link></section>}
  </div></AppShell>
}

function Card({ title, icon: Icon, empty, children }: { title: string; icon: typeof House; empty: string; children: ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children)
  return <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6"><div className="flex items-center gap-2"><Icon className="size-5 text-sage-foreground" /><h2 className="font-serif text-xl tracking-tight">{title}</h2></div>{hasChildren ? <ul className="mt-4 space-y-2">{children}</ul> : <p className="mt-4 rounded-2xl bg-secondary/30 px-4 py-4 text-sm text-muted-foreground">{empty}</p>}</section>
}
