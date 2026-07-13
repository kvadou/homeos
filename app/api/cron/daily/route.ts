import { dailyJobs } from '@/lib/cron/jobs'

/**
 * Daily scheduled-intelligence run (vercel.json crons → 11:00 UTC). Vercel
 * injects `Authorization: Bearer <CRON_SECRET>` on cron invocations when the
 * CRON_SECRET env var is set; there is no cookie/user context here. Jobs run
 * sequentially and each is isolated so one failure can't sink the rest.
 */
export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const jobs: Record<string, unknown>[] = []
  for (const job of dailyJobs) {
    try {
      jobs.push(await job())
    } catch (err) {
      console.error('[cron/daily] job failed:', err)
      jobs.push({ name: job.name, error: err instanceof Error ? err.message : String(err) })
    }
  }

  return Response.json({ ok: true, jobs })
}
