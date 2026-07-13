import { after } from 'next/server'
import { getApiContext } from '@/lib/supabase/api-auth'
import { logUsage } from '@/lib/usage'
import { rateLimited } from '@/lib/rate-limit'
import { ingestFile } from '@/lib/ingest/pipeline'

export const runtime = 'nodejs'

/**
 * Kick the extraction pipeline for a file the caller already inserted (the iOS
 * capture flow's parity for recordUpload's `after(ingestFile)` hook). The file
 * row is validated through the RLS-scoped client, so a file in another home
 * reads as 404, never processed. ingestFile runs after the response.
 */
export async function POST(req: Request) {
  const ctx = await getApiContext(req)
  if (!ctx) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { supabase, user, home } = ctx

  if (await rateLimited({ event: 'file_ingest_requested', userId: user.id, homeId: home.id, limit: 60, windowMinutes: 60 })) {
    return Response.json(
      { success: false, error: 'Rate limit reached. Try again soon.' },
      { status: 429, headers: { 'Retry-After': '3600' } },
    )
  }

  let body: { fileId?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const fileId = body.fileId?.trim()
  if (!fileId) return Response.json({ success: false, error: 'A fileId is required' }, { status: 400 })

  // RLS already scopes reads to the caller's homes; the home_id filter makes the 404 explicit.
  const { data: file } = await supabase
    .from('files')
    .select('id')
    .eq('id', fileId)
    .eq('home_id', home.id)
    .maybeSingle()
  if (!file) return Response.json({ success: false, error: 'File not found' }, { status: 404 })

  void logUsage('file_ingest_requested', {}, home.id)
  after(() => ingestFile(fileId))
  return Response.json({ success: true, fileId }, { status: 202 })
}
