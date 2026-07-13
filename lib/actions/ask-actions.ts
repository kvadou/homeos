'use server'

import { revalidatePath } from 'next/cache'
import { requireHome } from '@/lib/supabase/home'
import { createClient } from '@/lib/supabase/server'
import { logUsage } from '@/lib/usage'

export type AskActionKind = 'task' | 'project' | 'fact'

export async function createAskAction(input: { kind: AskActionKind; title: string; detail?: string; dueOn?: string }) {
  const title = input.title.trim().slice(0, 180)
  const detail = input.detail?.trim().slice(0, 4000) || null
  if (!title) return { error: 'Add a title first.' }
  const home = await requireHome()
  const supabase = await createClient()
  let id: string | undefined

  if (input.kind === 'task') {
    const { data, error } = await supabase.from('care_tasks').insert({ home_id: home.id, title, detail, due_on: input.dueOn || null, status: 'open', source: 'user' }).select('id').single()
    if (error) return { error: error.message }; id = data.id
    revalidatePath('/care')
  } else if (input.kind === 'project') {
    const { data, error } = await supabase.from('projects').insert({ home_id: home.id, name: title, summary: detail, kind: 'idea', status: 'Idea' }).select('id').single()
    if (error) return { error: error.message }; id = data.id
    revalidatePath('/projects')
  } else {
    const { data, error } = await supabase.from('home_facts').insert({ home_id: home.id, statement: title, category: 'preference', source_kind: 'user', confidence: 1, evidence: [] }).select('id').single()
    if (error) return { error: error.message }; id = data.id
    revalidatePath('/library')
    revalidatePath('/emergency')
  }

  await logUsage('ask_action_created', { kind: input.kind, id }, home.id)
  revalidatePath('/')
  return { success: true as const, id }
}

