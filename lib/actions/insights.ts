'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireHome } from '@/lib/supabase/home'
import { logUsage } from '@/lib/usage'

/** Dismiss an insight so it drops out of the Home Intelligence ledger. */
export async function dismissInsight(id: string) {
  const home = await requireHome()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('insights')
    .update({ status: 'dismissed' })
    .eq('id', id)
    .eq('home_id', home.id)
    .select('id')
  if (error) return { error: error.message }
  if (!data?.length) return { error: 'Insight not found.' }

  await logUsage('insight_dismissed', { insightId: id }, home.id)
  revalidatePath('/worth-knowing')
  revalidatePath('/')
  return { success: true }
}

/** Create an insight for the caller's own home. API-only for now; no UI form yet. */
export async function createInsight(input: {
  category: string
  headline: string
  detail?: string
  basis?: string
  stat?: string
  action?: string
  source?: string
}) {
  const home = await requireHome()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('insights')
    .insert({
      home_id: home.id,
      category: input.category,
      headline: input.headline,
      detail: input.detail ?? null,
      basis: input.basis ?? null,
      stat: input.stat ?? null,
      action: input.action ?? null,
      source: input.source ?? 'system',
      status: 'active',
    })
    .select('id')
    .single()
  if (error) return { error: error.message }

  await logUsage('insight_created', { insightId: data.id }, home.id)
  revalidatePath('/worth-knowing')
  revalidatePath('/')
  return { success: true, id: data.id }
}
