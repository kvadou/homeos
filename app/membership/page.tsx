import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'
import { MembershipResearch } from '@/components/membership/membership-research'
import { requireUser, requireHome } from '@/lib/supabase/home'
import { ANALYTICS_EVENTS } from '@/lib/analytics-events'

export const metadata: Metadata = { title: 'Membership · GatheredOS' }
export const dynamic = 'force-dynamic'

export default async function MembershipPage() {
  const [{ supabase, user }, home] = await Promise.all([requireUser(), requireHome()])
  const [items, files, facts, careEvents, intelligence, prior] = await Promise.all([
    supabase.from('items').select('id', { count: 'exact', head: true }).eq('home_id', home.id),
    supabase.from('files').select('id', { count: 'exact', head: true }).eq('home_id', home.id),
    supabase.from('home_facts').select('id', { count: 'exact', head: true }).eq('home_id', home.id),
    supabase.from('care_events').select('id', { count: 'exact', head: true }).eq('home_id', home.id),
    supabase.from('usage_events').select('id', { count: 'exact', head: true }).eq('user_id', user.id).in('event', [ANALYTICS_EVENTS.questionAsked, ANALYTICS_EVENTS.suggestionAccepted, ANALYTICS_EVENTS.taskCompleted]),
    supabase.from('monetization_research_responses' as never).select('response').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle() as never,
  ])
  const records = (items.count ?? 0) + (files.count ?? 0) + (facts.count ?? 0) + (careEvents.count ?? 0)
  const activated = records >= 3 && (intelligence.count ?? 0) > 0
  const priorData = (prior as unknown as { data: { response: string } | null }).data

  await supabase.from('usage_events').insert({ user_id: user.id, home_id: home.id, event: ANALYTICS_EVENTS.membershipViewed, props: { activated, surface: 'web' } })

  return <AppShell showSearch={false}><div className="mx-auto max-w-3xl"><header className="mb-7"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Membership</p><h1 className="mt-2 font-serif text-4xl tracking-tight">More help, never less ownership.</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">We are testing what ongoing intelligence is worth before turning on billing. Your answers shape a simple, transparent membership.</p></header><MembershipResearch activated={activated} priorResponse={priorData?.response ?? null} /></div></AppShell>
}
