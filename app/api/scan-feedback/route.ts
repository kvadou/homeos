import { getApiContext } from '@/lib/supabase/api-auth'
import { ANALYTICS_EVENTS } from '@/lib/analytics-events'

const OUTCOMES = new Set(['correct', 'incorrect', 'no_match', 'failed'])
const REASONS = new Set([
  'label_unreadable',
  'wrong_item',
  'missing_details',
  'camera_problem',
  'processing_failed',
  'other',
])

export async function POST(req: Request) {
  const ctx = await getApiContext(req)
  if (!ctx) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  let body: { fileId?: string; outcome?: string; reason?: string; surface?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const fileId = body.fileId?.trim()
  const outcome = body.outcome?.trim()
  const reason = body.reason?.trim()
  const surface = body.surface === 'ios' ? 'ios' : 'web'
  if (!fileId || !outcome || !OUTCOMES.has(outcome)) {
    return Response.json({ success: false, error: 'A valid fileId and outcome are required' }, { status: 400 })
  }
  if (reason && !REASONS.has(reason)) {
    return Response.json({ success: false, error: 'Unknown feedback reason' }, { status: 400 })
  }

  const { data: file } = await ctx.supabase
    .from('files')
    .select('id, extraction_status, meta')
    .eq('id', fileId)
    .eq('home_id', ctx.home.id)
    .maybeSingle()
  if (!file) return Response.json({ success: false, error: 'File not found' }, { status: 404 })

  const meta = file.meta && typeof file.meta === 'object' && !Array.isArray(file.meta)
    ? file.meta as Record<string, unknown>
    : {}
  const { error } = await ctx.supabase.from('usage_events').insert({
    user_id: ctx.user.id,
    home_id: ctx.home.id,
    event: ANALYTICS_EVENTS.scanFeedbackSubmitted,
    props: {
      fileId,
      outcome,
      reason: reason ?? null,
      surface,
      extractionStatus: file.extraction_status,
      hasCode: Boolean(meta.scan_code),
      hasText: Boolean(meta.scan_text),
    } as never,
  })
  if (error) return Response.json({ success: false, error: 'Feedback could not be saved' }, { status: 500 })
  return Response.json({ success: true })
}
