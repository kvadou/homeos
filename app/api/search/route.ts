import { getApiContext } from '@/lib/supabase/api-auth'
import { logUsage } from '@/lib/usage'
import { rateLimited } from '@/lib/rate-limit'

export type HomeSearchResult = {
  id: string
  type: 'item' | 'document' | 'project' | 'contractor' | 'care' | 'timeline' | 'insight' | 'fact'
  title: string
  detail: string | null
  href: string
}

/** Fast, bounded search across the current home's structured memory and OCR text. */
export async function GET(req: Request) {
  const ctx = await getApiContext(req)
  if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const q = new URL(req.url).searchParams.get('q')?.trim().slice(0, 100) ?? ''
  if (q.length < 2) return Response.json({ results: [] })
  const { supabase, user, home } = ctx

  if (await rateLimited({ event: 'home_search', userId: user.id, homeId: home.id, limit: 240, windowMinutes: 60 })) {
    return Response.json(
      { success: false, error: 'Rate limit reached. Try again soon.' },
      { status: 429, headers: { 'Retry-After': '3600' } },
    )
  }
  // Log AFTER passing the limit check so a blocked request doesn't extend the window.
  void logUsage('home_search', {}, home.id)

  const like = `%${q.replace(/[%_]/g, '')}%`

  const [items, files, projects, contractors, tasks, timeline, insights, facts, extractions] = await Promise.all([
    supabase.from('items').select('id,name,manufacturer,model,summary').eq('home_id', home.id).ilike('name', like).limit(6),
    supabase.from('files').select('id,name,type,item_id,created_at').eq('home_id', home.id).ilike('name', like).limit(6),
    supabase.from('projects').select('id,name,status,summary').eq('home_id', home.id).ilike('name', like).limit(5),
    supabase.from('contractors').select('id,name,company,notes').eq('home_id', home.id).ilike('name', like).limit(5),
    supabase.from('care_tasks').select('id,title,detail,due_on,status').eq('home_id', home.id).ilike('title', like).limit(5),
    supabase.from('timeline_events').select('id,title,detail,year').eq('home_id', home.id).ilike('title', like).limit(5),
    supabase.from('insights').select('id,headline,detail,category').eq('home_id', home.id).eq('status', 'active').ilike('headline', like).limit(5),
    supabase.from('home_facts').select('id,statement,category,subject_table,subject_id').eq('home_id', home.id).eq('is_current', true).ilike('statement', like).limit(6),
    supabase.from('extractions').select('id,file_id,doc_type,raw_text').eq('home_id', home.id).textSearch('search', q, { type: 'websearch', config: 'english' }).limit(5),
  ])

  const results: HomeSearchResult[] = []
  for (const x of items.data ?? []) results.push({ id: x.id, type: 'item', title: x.name, detail: [x.manufacturer, x.model, x.summary].filter(Boolean).join(' · ') || null, href: `/library/item/${x.id}` })
  for (const x of files.data ?? []) results.push({ id: x.id, type: 'document', title: x.name, detail: x.type, href: x.item_id ? `/library/item/${x.item_id}` : '/library' })
  for (const x of projects.data ?? []) results.push({ id: x.id, type: 'project', title: x.name, detail: x.summary ?? x.status, href: '/projects' })
  for (const x of contractors.data ?? []) results.push({ id: x.id, type: 'contractor', title: x.name, detail: x.company ?? x.notes, href: '/projects' })
  for (const x of tasks.data ?? []) results.push({ id: x.id, type: 'care', title: x.title, detail: x.detail ?? x.due_on, href: '/care' })
  for (const x of timeline.data ?? []) results.push({ id: x.id, type: 'timeline', title: x.title, detail: x.detail ?? String(x.year), href: '/projects' })
  for (const x of insights.data ?? []) results.push({ id: x.id, type: 'insight', title: x.headline, detail: x.detail ?? x.category, href: '/worth-knowing' })
  for (const x of facts.data ?? []) results.push({ id: x.id, type: 'fact', title: x.statement, detail: x.category, href: x.subject_table === 'items' && x.subject_id ? `/library/item/${x.subject_id}` : '/library' })
  for (const x of extractions.data ?? []) results.push({ id: x.id, type: 'document', title: `Text found in ${x.doc_type ?? 'document'}`, detail: snippet(x.raw_text, q), href: '/library' })

  return Response.json({ results: results.slice(0, 30) })
}

function snippet(text: string | null, q: string): string | null {
  if (!text) return null
  const at = text.toLowerCase().indexOf(q.toLowerCase())
  const start = Math.max(0, at < 0 ? 0 : at - 55)
  return `${start ? '…' : ''}${text.slice(start, start + 150)}${start + 150 < text.length ? '…' : ''}`
}

