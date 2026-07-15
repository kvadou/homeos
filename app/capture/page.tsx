import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Camera, Check, Circle, FileUp, House, MapPin, ShieldAlert, Wrench } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { requireHome } from '@/lib/supabase/home'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Build your home memory · GatherRoot', description: 'A guided room-by-room capture of your home.' }
const CRITICAL = /(shut.?off|breaker|panel|gas valve|water main|sump|fire extinguisher)/i

export default async function CapturePage() {
  const home = await requireHome()
  const supabase = await createClient()
  const [roomsRes, itemsRes, filesRes, factsRes] = await Promise.all([
    supabase.from('rooms').select('id,name,slug').eq('home_id', home.id).order('name'),
    supabase.from('items').select('id,name,room_id,category').eq('home_id', home.id),
    supabase.from('files').select('id,type,item_id').eq('home_id', home.id),
    supabase.from('home_facts').select('id,statement,predicate').eq('home_id', home.id).eq('is_current', true),
  ])
  const rooms = roomsRes.data ?? []; const items = itemsRes.data ?? []; const files = filesRes.data ?? []
  const photosByItem = new Set(files.filter((f) => f.type === 'photo' && f.item_id).map((f) => f.item_id))
  const roomSteps = rooms.map((room) => {
    const roomItems = items.filter((i) => i.room_id === room.id)
    const hasPhoto = roomItems.some((i) => photosByItem.has(i.id))
    return { ...room, count: roomItems.length, hasPhoto, complete: roomItems.length > 0 && hasPhoto }
  })
  const systems = items.filter((i) => i.category === 'system').length
  const documents = files.filter((f) => ['document','manual','warranty','receipt'].includes(f.type)).length
  const emergencyFacts = (factsRes.data ?? []).filter((f) => CRITICAL.test(`${f.predicate ?? ''} ${f.statement}`)).length
  const checks = roomSteps.filter((r) => r.complete).length + Number(systems >= 3) + Number(documents >= 1) + Number(emergencyFacts >= 1)
  const total = roomSteps.length + 3
  const pct = total ? Math.round(checks / total * 100) : 0

  return <AppShell><div className="space-y-6">
    <header className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"><p className="text-xs font-medium uppercase tracking-[0.18em] text-sage-foreground">Guided capture</p><h1 className="mt-2 font-serif text-4xl tracking-tight">Build {home.name}&apos;s memory</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Walk through the house once. Photograph important items and labels, save documents, and record the details someone would need if you weren&apos;t there to explain them.</p><div className="mt-6"><div className="flex items-center justify-between text-xs font-medium"><span>{checks} of {total} areas ready</span><span>{pct}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-sage" style={{ width: `${pct}%` }} /></div></div></header>

    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7"><h2 className="font-serif text-2xl">Whole-home essentials</h2><div className="mt-4 space-y-2">
      <Step complete={systems >= 3} icon={Wrench} title="Major systems" detail={`${systems} recorded · HVAC, water heater, roof, electrical, plumbing`} href="/library/item/new?category=system" action="Add system" />
      <Step complete={documents >= 1} icon={FileUp} title="Critical documents" detail={`${documents} saved · inspection, insurance, warranties, manuals, receipts`} href="/library/upload" action="Upload document" />
      <Step complete={emergencyFacts >= 1} icon={ShieldAlert} title="Emergency knowledge" detail={`${emergencyFacts} critical location${emergencyFacts === 1 ? '' : 's'} recorded · shutoffs, panels, extinguishers`} href="/ask" action="Tell GatherRoot" />
    </div></section>

    <section><div className="flex items-end justify-between"><div><h2 className="font-serif text-2xl">Room-by-room</h2><p className="mt-1 text-sm text-muted-foreground">A room is ready when it has at least one item and one identifying photo.</p></div><Link href="/library/upload" className="hidden items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground sm:inline-flex"><Camera className="size-4" />Scan live</Link></div>
      {roomSteps.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{roomSteps.map((room) => <Link key={room.id} href={`/library/room/${room.slug}`} className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm hover:border-sage/40"><span className={`flex size-10 items-center justify-center rounded-2xl ${room.complete ? 'bg-sage/15 text-sage-foreground' : 'bg-secondary text-muted-foreground'}`}>{room.complete ? <Check className="size-5" /> : <MapPin className="size-5" />}</span><div className="min-w-0 flex-1"><p className="font-medium">{room.name}</p><p className="text-xs text-muted-foreground">{room.count} item{room.count === 1 ? '' : 's'} · {room.hasPhoto ? 'photo saved' : 'photo needed'}</p></div><ArrowRight className="size-4 text-muted-foreground" /></Link>)}</div> : <div className="mt-4 rounded-3xl border border-border bg-card p-6 text-center"><House className="mx-auto size-6 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">Rooms will appear here after onboarding.</p></div>}
    </section>
  </div></AppShell>
}

function Step({ complete, icon: Icon, title, detail, href, action }: { complete: boolean; icon: typeof House; title: string; detail: string; href: string; action: string }) {
  return <div className="flex items-center gap-3 rounded-2xl bg-secondary/30 p-4"><span className={`flex size-9 items-center justify-center rounded-xl ${complete ? 'bg-sage/15 text-sage-foreground' : 'bg-card text-muted-foreground'}`}>{complete ? <Check className="size-4" /> : <Icon className="size-4" />}</span><div className="min-w-0 flex-1"><p className="text-sm font-medium">{title}</p><p className="truncate text-xs text-muted-foreground">{detail}</p></div><Link href={href} className="inline-flex items-center gap-1 text-xs font-medium text-primary">{complete ? 'Review' : action}<ArrowRight className="size-3" /></Link></div>
}
