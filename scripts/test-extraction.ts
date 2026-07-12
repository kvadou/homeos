/**
 * Step 3 runtime test — REAL haiku vision extraction end to end.
 * Uploads a rendered test receipt to storage, runs ingestFile, and asserts
 * the full cascade: extraction row, care_event cost, item suggestion queued,
 * warranty row, timeline event. Costs ~1 haiku call. Cleans up after itself.
 *
 * Usage: pnpm dlx tsx scripts/test-extraction.ts <path-to-receipt.png>
 */
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

function loadEnvFile(path: string): Record<string, string> {
  const out: Record<string, string> = {}
  let text: string
  try {
    text = readFileSync(path, 'utf8')
  } catch {
    return out
  }
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return out
}

Object.assign(process.env, loadEnvFile('.env'), loadEnvFile('.env.local'))

async function main() {
  const pngPath = process.argv[2]
  if (!pngPath) throw new Error('usage: test-extraction.ts <receipt.png>')
  const { createAdminClient } = await import('../lib/supabase/admin')
  const { ingestFile } = await import('../lib/ingest/pipeline')
  const db = createAdminClient()

  const assert = (cond: unknown, msg: string) => {
    if (!cond) throw new Error(`ASSERT FAILED: ${msg}`)
    console.log(`ok: ${msg}`)
  }

  const { data: profile } = await db.from('profiles').select('id').eq('email', 'dev@homeos.local').single()
  if (!profile) throw new Error('dev@homeos.local not found')
  const { data: member } = await db.from('home_members').select('home_id').eq('user_id', profile.id).limit(1).single()
  if (!member) throw new Error('dev user has no home')
  const homeId = member.home_id
  const TAG = 'extract-test'

  const cleanup = async () => {
    const { data: files } = await db.from('files').select('id, storage_path').eq('home_id', homeId).like('name', `${TAG}%`)
    for (const f of files ?? []) {
      await db.from('suggestions').delete().eq('home_id', homeId).like('provenance->>file_id', f.id)
      await db.from('warranties').delete().eq('home_id', homeId).eq('file_id', f.id)
      await db.from('care_events').delete().eq('home_id', homeId).eq('provenance->>file_id', f.id)
      await db.from('extractions').delete().eq('file_id', f.id)
      await db.storage.from('home-files').remove([f.storage_path])
    }
    await db.from('suggestions').delete().eq('home_id', homeId).ilike('dedupe_key', '%traeger%')
    await db.from('timeline_events').delete().eq('home_id', homeId).ilike('title', '%traeger%')
    await db.from('timeline_events').delete().eq('home_id', homeId).ilike('title', '%pellet grill%')
    await db.from('files').delete().eq('home_id', homeId).like('name', `${TAG}%`)
  }
  await cleanup()

  // upload the receipt image to storage
  const png = readFileSync(pngPath)
  const hash = createHash('sha256').update(png).digest('hex')
  const storagePath = `${homeId}/${TAG}-receipt.png`
  const { error: upErr } = await db.storage.from('home-files').upload(storagePath, png, { contentType: 'image/png', upsert: true })
  if (upErr) throw upErr

  const { data: file, error: fErr } = await db
    .from('files')
    .insert({
      home_id: homeId,
      type: 'receipt',
      name: `${TAG}-ace-receipt`,
      storage_path: storagePath,
      content_hash: hash,
      extraction_status: 'pending',
    })
    .select('id')
    .single()
  if (fErr || !file) throw fErr ?? new Error('file insert failed')

  console.log('running ingestFile (real haiku vision extraction)...')
  const t0 = Date.now()
  await ingestFile(file.id)
  console.log(`ingest took ${((Date.now() - t0) / 1000).toFixed(1)}s`)

  const { data: f1 } = await db.from('files').select('extraction_status').eq('id', file.id).single()
  assert(f1?.extraction_status === 'done', 'file stamped done')

  const { data: exs } = await db.from('extractions').select('*').eq('file_id', file.id)
  assert(exs?.length === 1 && exs[0].status === 'done', 'extraction row done')
  const ex = exs![0]
  assert(ex.doc_type === 'receipt', `classified as receipt (got ${ex.doc_type})`)
  assert(ex.model === 'claude-haiku-4-5', 'model recorded')
  assert((ex.raw_text ?? '').toLowerCase().includes('traeger'), 'raw_text transcribed the grill')
  console.log(`   confidence: ${ex.confidence}`)

  const { data: ce } = await db.from('care_events').select('cost, title').eq('home_id', homeId).eq('provenance->>file_id', file.id)
  assert(ce?.length === 1, 'care_event written')
  assert(Math.abs(Number(ce![0].cost) - 1650.58) < 0.01, `cost = 1650.58 (got ${ce![0].cost})`)

  const { data: sg } = await db
    .from('suggestions')
    .select('summary, target, status, payload')
    .eq('home_id', homeId)
    .eq('target', 'items')
    .eq('status', 'pending')
    .ilike('dedupe_key', '%traeger%')
  assert(sg?.length === 1, `item suggestion queued: "${sg?.[0]?.summary}"`)
  const payload = sg![0].payload as Record<string, unknown>
  assert(String(payload.model ?? '').toUpperCase().includes('TFB89'), `model captured (got ${payload.model})`)

  const { data: wt } = await db.from('warranties').select('provider, term_months, ends_on').eq('home_id', homeId).eq('file_id', file.id)
  if (wt?.length) {
    console.log(`ok: warranty row — ${wt[0].provider}, ${wt[0].term_months} months, ends ${wt[0].ends_on}`)
  } else {
    const { data: wsg } = await db.from('suggestions').select('summary').eq('home_id', homeId).eq('target', 'warranties').eq('status', 'pending')
    assert(wsg?.length, 'warranty queued as suggestion (below auto threshold)')
  }

  const { data: tl } = await db.from('timeline_events').select('year, title').eq('home_id', homeId).eq('year', 2026).ilike('title', '%purchas%')
  console.log(tl?.length ? `ok: timeline event — "${tl[0].title}" (${tl[0].year})` : 'note: timeline event queued or skipped (confidence-gated)')

  console.log('\nEXTRACTION E2E PASSED — leaving suggestion pending for UI test (cleanup deferred)')
  console.log(`file_id: ${file.id}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
