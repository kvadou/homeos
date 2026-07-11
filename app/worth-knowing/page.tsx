import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'
import { WorthKnowing } from '@/components/worth-knowing/worth-knowing'
import { requireHome } from '@/lib/supabase/home'
import { createClient } from '@/lib/supabase/server'
import { insightToFact, type Fact } from '@/lib/worth-knowing-data'

export const metadata: Metadata = {
  title: 'Worth Knowing · HomeOS',
  description: 'The quietly interesting things HomeOS has learned about your home.',
}

export default async function WorthKnowingPage() {
  const home = await requireHome()
  const supabase = await createClient()

  const { data } = await supabase
    .from('insights')
    .select('*')
    .eq('home_id', home.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const facts: Fact[] = (data ?? []).map(insightToFact)

  return (
    <AppShell showSearch={false}>
      <WorthKnowing facts={facts} />
    </AppShell>
  )
}
