import { ANALYTICS_EVENTS } from '@/lib/analytics-events'
import { evaluateServiceSafety, SERVICE_SAFETY_FLAGS } from '@/lib/service-coordination/safety'
import { getApiContext } from '@/lib/supabase/api-auth'
import type { Json } from '@/lib/supabase/database.types'

type IntakeBody = {
  itemId?: string
  symptom?: string
  errorCode?: string
  urgency?: string
  safety?: Record<string, unknown>
  availability?: { start?: string; end?: string; notes?: string }
  fileIds?: string[]
  shareApproved?: boolean
}

const TERMINAL_STATUSES = ['recorded', 'cancelled']

export async function GET(req: Request) {
  const ctx = await getApiContext(req)
  if (!ctx) return Response.json({ error: 'Sign in to view repair help.' }, { status: 401 })

  const itemId = new URL(req.url).searchParams.get('itemId')?.trim()
  if (!itemId) return Response.json({ error: 'Choose an item to view repair help.' }, { status: 400 })

  const { data, error } = await ctx.supabase.from('service_cases')
    .select('id,status,symptom_summary,urgency,sharing_status,sharing_expires_at,opened_at')
    .eq('home_id', ctx.home.id)
    .eq('item_id', itemId)
    .not('status', 'in', `(${TERMINAL_STATUSES.join(',')})`)
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('active service case lookup failed', error)
    return Response.json({ error: 'We could not check repair requests.' }, { status: 500 })
  }
  return Response.json({ case: data })
}

export async function POST(req: Request) {
  const ctx = await getApiContext(req)
  if (!ctx) return Response.json({ error: 'Sign in to request repair help.' }, { status: 401 })

  let body: IntakeBody
  try { body = await req.json() } catch {
    return Response.json({ error: 'The repair request could not be read.' }, { status: 400 })
  }
  const itemId = body.itemId?.trim()
  const symptom = body.symptom?.trim()
  if (!itemId || !symptom || symptom.length < 3) {
    return Response.json({ error: 'Describe what is happening with the item.' }, { status: 400 })
  }
  const urgency = body.urgency === 'soon' ? 'soon' : 'routine'
  const safetyAnswers = Object.fromEntries(
    SERVICE_SAFETY_FLAGS.map((flag) => [flag, body.safety?.[flag] === true]),
  )
  const safety = evaluateServiceSafety(safetyAnswers)

  const { data: item } = await ctx.supabase.from('items')
    .select('id,name,category,manufacturer,model,serial,installed_on')
    .eq('id', itemId).eq('home_id', ctx.home.id).maybeSingle()
  if (!item) return Response.json({ error: 'This item is no longer available.' }, { status: 404 })
  if (!safety.stopped && body.shareApproved !== true) {
    return Response.json({ error: 'Review and approve what GatheredOS may share.' }, { status: 400 })
  }

  const fileIds = Array.from(new Set((body.fileIds ?? []).filter((id) => typeof id === 'string')))
  const { data, error } = await ctx.supabase.rpc('create_household_service_intake', {
    p_home_id: ctx.home.id,
    p_item_id: item.id,
    p_symptom_summary: symptom,
    p_urgency: urgency,
    p_structured_intake: { errorCode: body.errorCode?.trim() || null } as Json,
    p_preferred_windows: body.availability?.start && body.availability?.end ? [{
      start: body.availability.start,
      end: body.availability.end,
      notes: body.availability.notes?.trim() || null,
    }] as Json : [] as Json,
    p_safety_result: safety as unknown as Json,
    p_service_address_snapshot: {
      street: ctx.home.street, city: ctx.home.city, state: ctx.home.state, zip: ctx.home.zip,
    } as Json,
    p_item_snapshot: item as unknown as Json,
    p_share_approved: body.shareApproved === true,
    p_file_ids: fileIds,
  })
  if (error) {
    console.error('service intake failed', error)
    return Response.json({ error: 'We could not save the repair request. Please try again.' }, { status: 500 })
  }

  const events = safety.stopped
    ? [ANALYTICS_EVENTS.serviceHelpStarted, ANALYTICS_EVENTS.serviceSafetyStopped]
    : [ANALYTICS_EVENTS.serviceHelpStarted, ANALYTICS_EVENTS.serviceSafetyScreenCompleted,
      ANALYTICS_EVENTS.serviceIntakeCompleted, ANALYTICS_EVENTS.serviceSharingReviewed,
      ANALYTICS_EVENTS.serviceSharingApproved]
  await ctx.supabase.from('usage_events').insert(events.map((event) => ({
    user_id: ctx.user.id, home_id: ctx.home.id, event,
    props: { caseId: data.id, itemId, surface: 'ios' } as Json,
  })))

  return Response.json({ case: data, safety })
}
