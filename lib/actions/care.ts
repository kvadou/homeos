'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logUsage } from '@/lib/usage'
import { rollRecurrence } from '@/lib/care-data'

/** Mark a care task done, log a matching service event, and record usage. */
export async function completeTask(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in' }

  const { data: task } = await supabase
    .from('care_tasks')
    .select('home_id, item_id, title, detail, priority, season, recurrence, source, due_on')
    .eq('id', id)
    .single()
  if (!task) return { error: 'Task not found' }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('care_tasks')
    .update({ status: 'done', completed_at: now, completed_by: user.id })
    .eq('id', id)
  if (error) return { error: error.message }

  await supabase.from('care_events').insert({
    home_id: task.home_id,
    item_id: task.item_id,
    title: `${task.title} completed`,
    occurred_on: now.slice(0, 10),
  })

  // §7.8: roll a recurring task forward to its next occurrence. Dedupe on
  // (home_id, title, item_id, due_on) so a double-complete can't stack copies.
  const next = rollRecurrence(task)
  if (next && next.due_on) {
    let dupe = supabase
      .from('care_tasks')
      .select('id')
      .eq('home_id', next.home_id)
      .eq('title', next.title)
      .eq('due_on', next.due_on)
      .eq('status', 'open')
    dupe = next.item_id ? dupe.eq('item_id', next.item_id) : dupe.is('item_id', null)
    const { data: existing } = await dupe.maybeSingle()
    if (!existing) await supabase.from('care_tasks').insert(next)
  }

  await logUsage('task_completed', { taskId: id }, task.home_id)
  revalidatePath('/care')
  return { success: true }
}

/** Create a care task. Wired for the AI/assistant path; the Care UI has no add form yet. */
export async function addTask(input: {
  homeId: string
  title: string
  detail?: string
  itemId?: string
  season?: string
  dueOn?: string
  priority?: string
}) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('care_tasks')
    .insert({
      home_id: input.homeId,
      title: input.title,
      detail: input.detail ?? null,
      item_id: input.itemId ?? null,
      season: input.season ?? null,
      due_on: input.dueOn ?? null,
      priority: input.priority ?? null,
      status: 'open',
      source: 'user',
    })
    .select('id')
    .single()
  if (error) return { error: error.message }

  await logUsage('task_created', { taskId: data.id }, input.homeId)
  revalidatePath('/care')
  return { success: true, id: data.id }
}

/** Snooze a task out of the active list. No snooze affordance in the UI yet — API only. */
export async function snoozeTask(id: string) {
  const supabase = await createClient()
  const { data: task } = await supabase.from('care_tasks').select('home_id').eq('id', id).single()

  const { error } = await supabase.from('care_tasks').update({ status: 'snoozed' }).eq('id', id)
  if (error) return { error: error.message }

  await logUsage('task_snoozed', { taskId: id }, task?.home_id)
  revalidatePath('/care')
  return { success: true }
}
