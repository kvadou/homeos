import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarClock, FileText, HardHat, House, MapPin, ShieldAlert, Wrench } from 'lucide-react'
import { requireHome } from '@/lib/supabase/home'
import { createClient } from '@/lib/supabase/server'
import { PrintButton } from '@/components/handoff/print-button'

export const metadata: Metadata = { title: 'Home handoff package · GatherRoot', description: 'A printable record of the home and its history.' }
const CRITICAL = /(shut.?off|breaker|panel|gas valve|water main|sump|fire extinguisher|emergency)/i
const date = (value: string | null) => value ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(`${value.slice(0, 10)}T12:00:00`)) : 'Not recorded'
const money = (value: number | null) => value == null ? null : `$${value.toLocaleString()}`

export default async function HandoffPage() {
  const home = await requireHome()
  const supabase = await createClient()
  const [rooms, items, facts, contractors, projects, events, warranties, files] = await Promise.all([
    supabase.from('rooms').select('id,name').eq('home_id', home.id).order('name'),
    supabase.from('items').select('id,name,category,manufacturer,model,serial,installed_on,status,room_id').eq('home_id', home.id).order('name'),
    supabase.from('home_facts').select('id,statement,predicate,category').eq('home_id', home.id).eq('is_current', true).order('created_at'),
    supabase.from('contractors').select('id,name,company,phone,email,notes').eq('home_id', home.id).order('name'),
    supabase.from('projects').select('id,name,kind,status,completed_year,cost,budget,spent,summary').eq('home_id', home.id).order('updated_at', { ascending: false }),
    supabase.from('care_events').select('id,title,occurred_on,cost,note,item_id').eq('home_id', home.id).order('occurred_on', { ascending: false }).limit(50),
    supabase.from('warranties').select('id,provider,kind,coverage,starts_on,ends_on,status,item_id').eq('home_id', home.id).order('ends_on'),
    supabase.from('files').select('id,name,type,item_id,created_at').eq('home_id', home.id).order('created_at', { ascending: false }),
  ])
  const roomById = new Map((rooms.data ?? []).map((r) => [r.id, r.name]))
  const itemById = new Map((items.data ?? []).map((i) => [i.id, i.name]))
  const emergency = (facts.data ?? []).filter((f) => CRITICAL.test(`${f.predicate ?? ''} ${f.statement}`))
  const address = [home.street, home.city, [home.state, home.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  const generated = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date())

  return <main className="handoff-print mx-auto min-h-screen max-w-5xl bg-white px-5 py-8 text-slate-950 sm:px-10 print:max-w-none print:p-0">
    <div className="mb-8 flex items-center justify-between gap-4 print:hidden"><Link href="/settings" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600"><ArrowLeft className="size-4" />Settings</Link><PrintButton /></div>
    <header className="border-b-2 border-slate-900 pb-7"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Home handoff package</p><div className="mt-3 flex items-start justify-between gap-6"><div><h1 className="font-serif text-4xl tracking-tight">{home.name}</h1><p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600"><MapPin className="size-4" />{address || 'Address not recorded'}</p></div><div className="text-right text-xs text-slate-500"><p>Generated {generated}</p><p className="mt-1">Private home record</p></div></div></header>

    <section className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4"><Stat label="Year built" value={home.year_built?.toString() ?? '—'} /><Stat label="Square feet" value={home.sqft?.toLocaleString() ?? '—'} /><Stat label="Beds" value={home.beds?.toString() ?? '—'} /><Stat label="Baths" value={home.baths?.toString() ?? '—'} /></section>

    <Section title="Emergency knowledge" icon={ShieldAlert}>{emergency.length ? <ul className="space-y-2">{emergency.map((f) => <li key={f.id} className="rounded-lg bg-amber-50 px-3 py-2 text-sm">{f.statement}</li>)}</ul> : <Empty text="No shutoff or emergency locations have been recorded." />}</Section>

    <Section title="Systems and important items" icon={Wrench}>{(items.data ?? []).length ? <table className="w-full text-left text-xs"><thead><tr className="border-b border-slate-300 text-slate-500"><th className="py-2">Item</th><th>Make / model</th><th>Location</th><th>Installed</th></tr></thead><tbody>{(items.data ?? []).map((i) => <tr key={i.id} className="border-b border-slate-200 align-top"><td className="py-2.5 font-medium">{i.name}<span className="block font-normal text-slate-500">{i.category}</span></td><td>{[i.manufacturer, i.model, i.serial].filter(Boolean).join(' · ') || '—'}</td><td>{i.room_id ? roomById.get(i.room_id) ?? '—' : '—'}</td><td>{date(i.installed_on)}</td></tr>)}</tbody></table> : <Empty text="No systems or items recorded." />}</Section>

    <div className="grid gap-7 print:grid-cols-2 sm:grid-cols-2">
      <Section title="Warranties" icon={CalendarClock}>{(warranties.data ?? []).length ? <ul className="space-y-3">{(warranties.data ?? []).map((w) => <li key={w.id} className="text-sm"><p className="font-medium">{w.item_id ? itemById.get(w.item_id) ?? w.provider : w.provider ?? 'Warranty'}</p><p className="text-xs text-slate-500">{w.coverage || w.kind || 'Coverage not recorded'} · ends {date(w.ends_on)} · {w.status}</p></li>)}</ul> : <Empty text="No warranties recorded." />}</Section>
      <Section title="Contractors" icon={HardHat}>{(contractors.data ?? []).length ? <ul className="space-y-3">{(contractors.data ?? []).map((c) => <li key={c.id} className="text-sm"><p className="font-medium">{c.company || c.name}</p><p className="text-xs text-slate-500">{[c.company ? c.name : null, c.phone, c.email].filter(Boolean).join(' · ')}</p></li>)}</ul> : <Empty text="No contractors recorded." />}</Section>
    </div>

    <Section title="Projects and improvements" icon={House}>{(projects.data ?? []).length ? <ul className="space-y-3">{(projects.data ?? []).map((p) => <li key={p.id} className="flex gap-4 text-sm"><div className="flex-1"><p className="font-medium">{p.name}</p><p className="text-xs text-slate-500">{p.summary || [p.kind, p.status].filter(Boolean).join(' · ')}</p></div><p className="text-right text-xs"><span className="block font-medium">{money(p.cost ?? p.spent ?? p.budget) ?? '—'}</span>{p.completed_year && <span className="text-slate-500">{p.completed_year}</span>}</p></li>)}</ul> : <Empty text="No projects recorded." />}</Section>

    <Section title="Recent maintenance history" icon={CalendarClock}>{(events.data ?? []).length ? <ol className="space-y-2">{(events.data ?? []).map((e) => <li key={e.id} className="flex gap-4 border-b border-slate-200 py-2 text-sm"><time className="w-28 shrink-0 text-xs text-slate-500">{date(e.occurred_on)}</time><div className="flex-1"><p className="font-medium">{e.title}</p>{e.note && <p className="text-xs text-slate-500">{e.note}</p>}</div>{e.cost != null && <span className="text-xs font-medium">{money(e.cost)}</span>}</li>)}</ol> : <Empty text="No maintenance history recorded." />}</Section>

    <Section title="Document inventory" icon={FileText}>{(files.data ?? []).length ? <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">{(files.data ?? []).map((f) => <div key={f.id} className="flex items-center gap-2 border-b border-slate-200 py-2 text-xs"><FileText className="size-3.5 text-slate-400" /><span className="min-w-0 flex-1 truncate">{f.name}</span><span className="text-slate-500">{f.type}</span></div>)}</div> : <Empty text="No documents recorded." />}</Section>

    <footer className="mt-10 border-t border-slate-300 pt-4 text-xs text-slate-500"><p>Generated from the home&apos;s records in GatherRoot. Verify critical details before relying on this package. This copy intentionally contains no private document download links.</p></footer>
  </main>
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-100 p-3"><p className="font-serif text-xl">{value}</p><p className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">{label}</p></div> }
function Section({ title, icon: Icon, children }: { title: string; icon: typeof House; children: ReactNode }) { return <section className="mt-8 break-inside-avoid"><div className="mb-3 flex items-center gap-2 border-b border-slate-300 pb-2"><Icon className="size-4 text-slate-500" /><h2 className="font-serif text-xl">{title}</h2></div>{children}</section> }
function Empty({ text }: { text: string }) { return <p className="rounded-lg bg-slate-100 px-3 py-3 text-sm text-slate-500">{text}</p> }
