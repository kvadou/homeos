import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'
import { WorthKnowing } from '@/components/worth-knowing/worth-knowing'
import { requireHome } from '@/lib/supabase/home'
import { createClient } from '@/lib/supabase/server'
import { insightToFact, type Fact } from '@/lib/worth-knowing-data'
import { buildHomeIntelligence } from '@/lib/home-intelligence'

export const metadata: Metadata = {
  title: 'Home Intelligence · GatheredOS',
  description: 'Personal, evidence-backed observations GatheredOS has learned about your home.',
}

export default async function WorthKnowingPage() {
  const home = await requireHome()
  const supabase = await createClient()

  const [insightsRes, systemsRes, filesRes, eventsRes, factsRes] = await Promise.all([
    supabase.from('insights').select('*').eq('home_id', home.id).eq('status', 'active').order('created_at', { ascending: false }),
    supabase.from('items').select('manufacturer,model,installed_on').eq('home_id', home.id).eq('category', 'system'),
    supabase.from('files').select('extraction_status').eq('home_id', home.id),
    supabase.from('care_events').select('id', { count: 'exact', head: true }).eq('home_id', home.id),
    supabase.from('home_facts').select('category,predicate,statement,source_kind').eq('home_id', home.id).eq('is_current', true),
  ])

  const facts: Fact[] = (insightsRes.data ?? []).filter((row) => !row.dedupe_slug?.startsWith('onboarding:')).map(insightToFact)
  const intelligence = buildHomeIntelligence({
    home,
    systems: systemsRes.data ?? [],
    files: filesRes.data ?? [],
    careEventCount: eventsRes.count ?? 0,
    facts: factsRes.data ?? [],
  })

  return (
    <AppShell showSearch={false}>
      <WorthKnowing facts={facts} intelligence={intelligence} />
    </AppShell>
  )
}
