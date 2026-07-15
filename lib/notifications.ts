import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { escapeHtml, sendEmail, type SendResult } from '@/lib/email'

type Kind = 'invite' | 'safety' | 'warranty' | 'care' | 'digest'
export type NotificationPreferences = {
  safety_alerts: boolean
  care_reminders: boolean
  warranty_alerts: boolean
  weekly_digest: boolean
}

export const defaultNotificationPreferences: NotificationPreferences = {
  safety_alerts: true,
  care_reminders: true,
  warranty_alerts: true,
  weekly_digest: false,
}

const appUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gatherroot.vercel.app'

function shell(title: string, intro: string, body: string, cta = 'Open GatherRoot'): string {
  return `<!doctype html><div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#243746;background:#f8f6f2">
  <p style="font-family:Georgia,serif;font-size:24px;color:#0a2e4d;margin:0 0 16px">${escapeHtml(title)}</p>
  <p style="font-size:15px;line-height:1.6;margin:0 0 18px">${escapeHtml(intro)}</p>${body}
  <a href="${appUrl}" style="display:inline-block;margin-top:22px;background:#0a2e4d;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:12px">${escapeHtml(cta)}</a>
  <p style="font-size:12px;color:#7a8792;margin:28px 0 0">Manage these emails in <a href="${appUrl}/settings#notifications" style="color:#526979">GatherRoot notification settings</a>.</p>
  </div>`
}

function list(items: string[]): string {
  return `<ul style="padding-left:20px;font-size:14px;line-height:1.65">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
}

type TrackedInput = {
  userId: string
  homeId: string
  recipient: string
  kind: Kind
  dedupeKey: string
  subject: string
  html: string
  payload?: Record<string, unknown>
}

/** Persistent idempotency across cron retries; Resend's key is a second 24-hour guard. */
async function sendTracked(input: TrackedInput): Promise<SendResult & { duplicate?: boolean }> {
  const db = createAdminClient()
  const { data: existing } = await db.from('notification_deliveries' as never)
    .select('id,status,attempts')
    .eq('dedupe_key', input.dedupeKey)
    .maybeSingle() as { data: { id: string; status: string; attempts: number } | null }
  if (existing?.status === 'sent') return { sent: false, duplicate: true }

  const row = {
    user_id: input.userId, home_id: input.homeId, recipient: input.recipient,
    kind: input.kind, dedupe_key: input.dedupeKey, subject: input.subject,
    status: 'pending', attempts: (existing?.attempts ?? 0) + 1, payload: input.payload ?? {},
  }
  let deliveryId = existing?.id
  if (deliveryId) {
    await db.from('notification_deliveries' as never).update(row as never).eq('id', deliveryId)
  } else {
    const { data, error } = await db.from('notification_deliveries' as never).insert(row as never).select('id').single() as { data: { id: string } | null; error: { message: string } | null }
    if (error || !data) return { sent: false, error: error?.message ?? 'delivery-ledger-unavailable' }
    deliveryId = data?.id
  }

  const result = await sendEmail(input.recipient, input.subject, input.html, { idempotencyKey: input.dedupeKey })
  if (deliveryId) {
    await db.from('notification_deliveries' as never).update({
      status: result.sent ? 'sent' : result.skipped ? 'skipped' : 'failed',
      provider_id: result.id ?? null,
      last_error: result.error ?? result.skipped ?? null,
    } as never).eq('id', deliveryId)
  }
  return result
}

export async function sendInviteEmail(input: { to: string; homeName: string; inviterName: string; url: string; inviteId: string }) {
  const subject = `${input.inviterName} invited you to ${input.homeName} on GatherRoot`
  const html = shell('You’re invited', `${input.inviterName} invited you to share ${input.homeName} in GatherRoot.`, `<p style="font-size:14px;line-height:1.6">Use this private, single-use invitation to join the home.</p><a href="${input.url}" style="color:#0a2e4d;font-weight:600">Accept invitation</a>`, 'View invitation')
  return sendEmail(input.to, subject, html, { idempotencyKey: `invite-${input.inviteId}` })
}

export async function dispatchScheduledNotifications(): Promise<{ recipients: number; sent: number; skipped: number; failed: number }> {
  const db = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)
  const nextWeek = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10)
  const week = `${new Date().getUTCFullYear()}-${Math.ceil((Date.now() - Date.UTC(new Date().getUTCFullYear(), 0, 1)) / (7 * 86_400_000))}`
  const isDigestDay = new Date().getUTCDay() === 1
  const { data: memberships } = await db.from('home_members').select('home_id,user_id')
  const userIds = [...new Set((memberships ?? []).map((row) => row.user_id))]
  const homeIds = [...new Set((memberships ?? []).map((row) => row.home_id))]
  if (!userIds.length || !homeIds.length) return { recipients: 0, sent: 0, skipped: 0, failed: 0 }

  const [profilesResult, homesResult, preferencesResult, insightsResult, tasksResult] = await Promise.all([
    db.from('profiles').select('id,email').in('id', userIds),
    db.from('homes').select('id,name').in('id', homeIds),
    db.from('notification_preferences' as never).select('*').in('user_id', userIds) as unknown as Promise<{ data: Array<NotificationPreferences & { user_id: string; home_id: string }> | null; error: { message: string } | null }>,
    db.from('insights').select('home_id,dedupe_slug,headline,detail').eq('status', 'active').in('home_id', homeIds).or('dedupe_slug.like.recall:%,dedupe_slug.like.warranty-expiring:%'),
    db.from('care_tasks').select('id,home_id,title,due_on,status').in('home_id', homeIds).neq('status', 'done').gte('due_on', today).lte('due_on', nextWeek),
  ])
  if (preferencesResult.error) throw new Error(`Notification schema unavailable: ${preferencesResult.error.message}`)
  const { data: profiles } = profilesResult
  const { data: homes } = homesResult
  const { data: preferences } = preferencesResult
  const { data: insights } = insightsResult
  const { data: tasks } = tasksResult
  const profileMap = new Map((profiles ?? []).map((row) => [row.id, row]))
  const homeMap = new Map((homes ?? []).map((row) => [row.id, row]))
  const preferenceMap = new Map((preferences ?? []).map((row) => [`${row.user_id}:${row.home_id}`, row]))
  let sent = 0; let skipped = 0; let failed = 0

  async function deliver(input: TrackedInput) {
    const result = await sendTracked(input)
    if (result.sent) sent++; else if (result.error) failed++; else skipped++
  }

  for (const membership of memberships ?? []) {
    const profile = profileMap.get(membership.user_id)
    const home = homeMap.get(membership.home_id)
    if (!profile?.email || !home) continue
    const prefs = preferenceMap.get(`${membership.user_id}:${membership.home_id}`) ?? defaultNotificationPreferences
    const homeInsights = (insights ?? []).filter((row) => row.home_id === home.id)
    for (const insight of homeInsights) {
      const safety = insight.dedupe_slug?.startsWith('recall:')
      if ((safety && !prefs.safety_alerts) || (!safety && !prefs.warranty_alerts)) continue
      const kind: Kind = safety ? 'safety' : 'warranty'
      await deliver({ userId: profile.id, homeId: home.id, recipient: profile.email, kind, dedupeKey: `${kind}-${profile.id}-${insight.dedupe_slug}`, subject: insight.headline, html: shell(insight.headline, `An important update for ${home.name}.`, insight.detail ? `<p style="font-size:14px;line-height:1.6">${escapeHtml(insight.detail)}</p>` : ''), payload: { insight: insight.dedupe_slug } })
    }

    const homeTasks = (tasks ?? []).filter((row) => row.home_id === home.id)
    if (prefs.care_reminders) {
      for (const task of homeTasks) {
        await deliver({ userId: profile.id, homeId: home.id, recipient: profile.email, kind: 'care', dedupeKey: `care-${profile.id}-${task.id}-${task.due_on ?? 'none'}`, subject: `${task.title} is coming up`, html: shell('Coming up at home', `${home.name} has maintenance due in the next seven days.`, list([`${task.title} — ${task.due_on}`])), payload: { taskId: task.id } })
      }
    }
    if (isDigestDay && prefs.weekly_digest) {
      const digestItems = [
        ...homeInsights.map((row) => `${row.dedupe_slug?.startsWith('recall:') ? 'Verified recall' : 'Warranty record'}: ${row.headline}`),
        ...homeTasks.map((row) => `Care task: ${row.title} — due ${row.due_on}`),
      ].slice(0, 5)
      if (digestItems.length) await deliver({ userId: profile.id, homeId: home.id, recipient: profile.email, kind: 'digest', dedupeKey: `digest-${profile.id}-${home.id}-${week}`, subject: `Your Home Briefing for ${home.name}`, html: shell('Your Home Briefing', `These items come from records saved for ${home.name}.`, list(digestItems)), payload: { count: digestItems.length } })
    }
  }
  return { recipients: (memberships ?? []).length, sent, skipped, failed }
}
