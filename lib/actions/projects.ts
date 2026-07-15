'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireHome } from '@/lib/supabase/home'
import { logUsage } from '@/lib/usage'

type ProjectKind = 'active' | 'idea' | 'recommended' | 'completed'

/** Create a project of any kind. Returns the new id or an error message. */
export async function createProject(values: {
  name: string
  kind?: ProjectKind
  status?: string | null
  summary?: string | null
  budget?: number | null
  spent?: number | null
  progress?: number | null
  metadata?: Record<string, unknown>
}) {
  const name = values.name?.trim()
  if (!name) return { error: 'Please enter a name.' }
  if (name.length > 160) return { error: 'Keep the project name under 160 characters.' }

  const home = await requireHome()
  const supabase = await createClient()
  const kind = values.kind ?? 'idea'
  const { data, error } = await supabase
    .from('projects')
    .insert({
      home_id: home.id,
      name,
      kind,
      status: values.status ?? null,
      summary: values.summary ?? null,
      budget: values.budget == null ? null : Math.max(0, values.budget),
      spent: values.spent == null ? null : Math.max(0, values.spent),
      progress: values.progress == null ? null : Math.min(100, Math.max(0, values.progress)),
      metadata: (values.metadata ?? {}) as never,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  await logUsage('project_created', { kind }, home.id)
  revalidatePath('/projects')
  return { id: data.id }
}

/** Save a new idea from the "Add an idea" form. */
export async function createIdea(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim()
  if (!title) return { error: 'Please enter a title.' }

  const category = String(formData.get('category') ?? '').trim()
  const roughCost = String(formData.get('roughCost') ?? '').trim()
  const note = String(formData.get('note') ?? '').trim()

  const home = await requireHome()
  const supabase = await createClient()
  const { error } = await supabase.from('projects').insert({
    home_id: home.id,
    name: title,
    kind: 'idea',
    summary: note || null,
    metadata: { category: category || undefined, roughCost: roughCost || undefined } as never,
  })

  if (error) return { error: error.message }
  await logUsage('idea_created', { title }, home.id)
  revalidatePath('/projects')
  return { ok: true }
}

/** Patch a project's editable fields. */
export async function updateProject(
  id: string,
  patch: {
    name?: string
    status?: string
    progress?: number
    spent?: number
    budget?: number
    summary?: string
  },
) {
  if (patch.name !== undefined) {
    patch.name = patch.name.trim()
    if (!patch.name) return { error: 'Please enter a project name.' }
    if (patch.name.length > 160) return { error: 'Keep the project name under 160 characters.' }
  }
  if (patch.progress !== undefined) patch.progress = Math.min(100, Math.max(0, patch.progress))
  if (patch.spent !== undefined) patch.spent = Math.max(0, patch.spent)
  if (patch.budget !== undefined) patch.budget = Math.max(0, patch.budget)
  const home = await requireHome()
  const supabase = await createClient()
  const { error } = await supabase
    .from('projects')
    .update(patch)
    .eq('id', id)
    .eq('home_id', home.id)

  if (error) return { error: error.message }
  await logUsage('project_updated', { id }, home.id)
  revalidatePath('/projects')
  return { ok: true }
}

/** Promote a saved idea to an in-progress active project. */
export async function convertIdeaToActive(id: string) {
  const home = await requireHome()
  const supabase = await createClient()
  const { error } = await supabase
    .from('projects')
    .update({
      kind: 'active',
      status: 'In progress',
      progress: 0,
      started_on: new Date().toISOString().slice(0, 10),
    })
    .eq('id', id)
    .eq('home_id', home.id)
    .eq('kind', 'idea')

  if (error) return { error: error.message }
  await logUsage('project_updated', { id, action: 'convert' }, home.id)
  revalidatePath('/projects')
  return { ok: true }
}

/** Mark a project complete and record it on the home timeline. */
export async function completeProject(id: string) {
  const home = await requireHome()
  const supabase = await createClient()

  const { data: project, error: readErr } = await supabase
    .from('projects')
    .select('name, summary, spent')
    .eq('id', id)
    .eq('home_id', home.id)
    .single()
  if (readErr || !project) return { error: readErr?.message ?? 'Project not found.' }

  const year = new Date().getFullYear()
  const { error } = await supabase
    .from('projects')
    .update({
      kind: 'completed',
      status: 'Completed',
      progress: 100,
      completed_year: year,
      cost: project.spent,
    })
    .eq('id', id)
    .eq('home_id', home.id)
  if (error) return { error: error.message }

  await supabase.from('timeline_events').insert({
    home_id: home.id,
    year,
    title: project.name,
    detail: project.summary,
    kind: 'project',
  })

  await logUsage('project_completed', { id }, home.id)
  revalidatePath('/projects')
  return { ok: true }
}

/** Delete a project. Callers must confirm with a custom dialog first. */
export async function deleteProject(id: string) {
  const home = await requireHome()
  const supabase = await createClient()
  const { error } = await supabase.from('projects').delete().eq('id', id).eq('home_id', home.id)

  if (error) return { error: error.message }
  revalidatePath('/projects')
  return { ok: true }
}
