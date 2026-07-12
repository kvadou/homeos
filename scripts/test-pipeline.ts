/**
 * Runtime test for the Phase 2 ingest pipeline skeleton (step 2 verification).
 * Runs against the dev home with the service-role key, exactly like seed.ts.
 * Creates a fake receipt file row, runs ingestFile twice (idempotency), then
 * seeds a water heater item twice (template dedupe). Cleans up after itself.
 *
 * Usage: pnpm dlx tsx scripts/test-pipeline.ts
 */
import { readFileSync } from 'node:fs'

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
  const { createAdminClient } = await import('../lib/supabase/admin')
  const { ingestFile, seedCareTasksForItem } = await import('../lib/ingest/pipeline')
  const db = createAdminClient()

  const assert = (cond: unknown, msg: string) => {
    if (!cond) throw new Error(`ASSERT FAILED: ${msg}`)
    console.log(`ok: ${msg}`)
  }

  // dev home
  const { data: profile } = await db.from('profiles').select('id').eq('email', 'dev@homeos.local').single()
  if (!profile) throw new Error('dev@homeos.local not found')
  const { data: member } = await db.from('home_members').select('home_id').eq('user_id', profile.id).limit(1).single()
  if (!member) throw new Error('dev user has no home')
  const homeId = member.home_id
  const TAG = 'pipeline-test'
  const hash = `${TAG}-hash-1`

  // cleanup from any previous run
  const cleanup = async () => {
    const { data: files } = await db.from('files').select('id').eq('home_id', homeId).like('name', `${TAG}%`)
    for (const f of files ?? []) {
      await db.from('extractions').delete().eq('file_id', f.id)
      await db.from('care_events').delete().eq('home_id', homeId).eq('provenance->>file_id', f.id)
    }
    await db.from('files').delete().eq('home_id', homeId).like('name', `${TAG}%`)
    await db.from('suggestions').delete().eq('home_id', homeId).like('dedupe_key', 'item:appliance:stub%')
    await db.from('timeline_events').delete().eq('home_id', homeId).like('title', `Purchased — ${TAG}%`)
    const { data: items } = await db.from('items').select('id').eq('home_id', homeId).like('name', `${TAG}%`)
    for (const it of items ?? []) await db.from('care_tasks').delete().eq('item_id', it.id)
    await db.from('items').delete().eq('home_id', homeId).like('name', `${TAG}%`)
    await db.from('usage_events').delete().eq('home_id', homeId).eq('event', 'ai_low_confidence')
  }
  await cleanup()

  // --- 1. fake receipt upload ---
  const { data: file, error: fErr } = await db
    .from('files')
    .insert({
      home_id: homeId,
      type: 'receipt',
      name: `${TAG}-receipt`,
      storage_path: `${homeId}/${TAG}-receipt.pdf`,
      content_hash: hash,
      extraction_status: 'pending',
    })
    .select('id')
    .single()
  if (fErr || !file) throw fErr ?? new Error('file insert failed')

  await ingestFile(file.id)

  const { data: f1 } = await db.from('files').select('extraction_status').eq('id', file.id).single()
  assert(f1?.extraction_status === 'done', 'file stamped done')

  const { data: ex } = await db.from('extractions').select('status, doc_type, confidence').eq('file_id', file.id)
  assert(ex?.length === 1 && ex[0].status === 'done' && ex[0].doc_type === 'receipt', 'extraction row done')

  const { data: ce } = await db.from('care_events').select('id, cost').eq('home_id', homeId).eq('provenance->>file_id', file.id)
  assert(ce?.length === 1 && Number(ce[0].cost) === 100, 'AUTO: care_event written once (cost 100)')

  const { data: sg } = await db.from('suggestions').select('status, target').eq('home_id', homeId).eq('dedupe_key', 'item:appliance:stub-mfr:stub-model')
  assert(sg?.length === 1 && sg[0].status === 'pending' && sg[0].target === 'items', 'QUEUE: item suggestion pending')

  const { data: tl } = await db.from('timeline_events').select('id').eq('home_id', homeId).eq('title', `Purchased — ${TAG}-receipt`)
  assert(tl?.length === 1, 'AUTO: timeline event written')

  const { data: dropped } = await db.from('insights').select('id').eq('home_id', homeId).eq('dedupe_slug', 'insight:stub-dropped')
  assert(dropped?.length === 0, 'DROP: low-confidence insight not written')

  const { data: ue } = await db.from('usage_events').select('id').eq('home_id', homeId).eq('event', 'ai_low_confidence')
  assert((ue?.length ?? 0) >= 1, 'DROP: logged to usage_events')

  // --- 2. re-run: idempotent, nothing doubles ---
  await ingestFile(file.id)
  const { data: ce2 } = await db.from('care_events').select('id').eq('home_id', homeId).eq('provenance->>file_id', file.id)
  assert(ce2?.length === 1, 're-run: care_event still 1 (upsert by file_id)')
  const { data: sg2 } = await db.from('suggestions').select('id').eq('home_id', homeId).eq('dedupe_key', 'item:appliance:stub-mfr:stub-model')
  assert(sg2?.length === 1, 're-run: suggestion still 1')
  const { data: tl2 } = await db.from('timeline_events').select('id').eq('home_id', homeId).eq('title', `Purchased — ${TAG}-receipt`)
  assert(tl2?.length === 1, 're-run: timeline still 1')

  // --- 3. template seeding for a new item, twice ---
  const { data: item } = await db
    .from('items')
    .insert({ home_id: homeId, name: `${TAG} Water Heater`, category: 'system' })
    .select('id')
    .single()
  if (!item) throw new Error('item insert failed')

  await seedCareTasksForItem({ homeId, itemId: item.id, name: `${TAG} Water Heater`, category: 'system' })
  await seedCareTasksForItem({ homeId, itemId: item.id, name: `${TAG} Water Heater`, category: 'system' })

  const { data: tasks } = await db.from('care_tasks').select('template_slug, source').eq('item_id', item.id)
  assert(tasks?.length === 1 && tasks[0].template_slug === 'wh-flush-annual' && tasks[0].source === 'ai',
    'templates: water heater → 1 task (wh-flush-annual), seeded twice → still 1')

  await cleanup()
  console.log('\nALL PIPELINE TESTS PASSED')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
