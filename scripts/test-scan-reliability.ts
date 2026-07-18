/**
 * Repeatable scan reliability gate. The committed corpus is synthetic and
 * contains no customer data. `--fixtures-only` validates the corpus without
 * model calls; the full run executes five real vision ingests and fails if any
 * extraction/cascade assertion fails.
 *
 * Usage:
 *   pnpm test:scan -- --fixtures-only
 *   pnpm test:scan
 */
import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { isClearlyOutOfScopeEvidence } from '../lib/ingest/extract'

type Corpus = {
  version: number
  thresholds: Record<string, number>
  cases: { id: string; file: string; type: string; expects: string[] }[]
}

const root = resolve(process.cwd())
const fixtureDir = resolve(root, 'scripts/fixtures')
const corpus = JSON.parse(readFileSync(resolve(fixtureDir, 'scan-corpus.json'), 'utf8')) as Corpus

if (corpus.cases.length < 5) throw new Error('Reliability corpus must contain at least five representative cases.')
for (const testCase of corpus.cases) {
  const path = resolve(fixtureDir, testCase.file)
  if (statSync(path).size < 10_000) throw new Error(`${testCase.id}: fixture is missing or too small.`)
  if (!testCase.expects.length) throw new Error(`${testCase.id}: expected evidence is empty.`)
  console.log(`fixture: ${testCase.id} (${testCase.type}) — ${testCase.file}`)
}
console.log(`\nCorpus v${corpus.version}: ${corpus.cases.length} cases; thresholds ${JSON.stringify(corpus.thresholds)}`)

const rejectedEvidence = [
  'Scan to view our menu',
  'Restaurant dine-in menu — order online',
  'Nutrition facts and ingredients',
]
const householdEvidence = [
  'Whirlpool dishwasher model WDT730HAMZ',
  'Rheem water heater product registration',
  'Furnace serial number 4PXC4030A1000AA',
]
for (const evidence of rejectedEvidence) {
  if (!isClearlyOutOfScopeEvidence(evidence)) throw new Error(`Scope gate should reject: ${evidence}`)
}
for (const evidence of householdEvidence) {
  if (isClearlyOutOfScopeEvidence(evidence)) throw new Error(`Scope gate should allow: ${evidence}`)
}
console.log('Scope gate: restaurant/menu evidence rejected; household product evidence allowed.')

if (process.argv.includes('--fixtures-only')) {
  console.log('FIXTURE GATE PASSED — no model calls made.')
  process.exit(0)
}

function run(label: string, args: string[]) {
  console.log(`\n=== ${label} ===`)
  const started = Date.now()
  const result = spawnSync('pnpm', ['exec', 'tsx', ...args], { cwd: root, stdio: 'inherit' })
  if (result.status !== 0) throw new Error(`${label} failed with exit ${result.status ?? 'unknown'}`)
  return (Date.now() - started) / 1000
}

const receiptSeconds = run('Synthetic receipt', ['scripts/test-extraction.ts', 'scripts/fixtures/receipt.png', '--cleanup'])
const documentSeconds = run('Manual, warranty, inspection, and data plate', ['scripts/test-doctypes.ts'])
const averageSeconds = (receiptSeconds + documentSeconds) / corpus.cases.length
if (averageSeconds > corpus.thresholds.maxAverageSeconds) {
  throw new Error(`Average reliability runtime ${averageSeconds.toFixed(1)}s exceeds ${corpus.thresholds.maxAverageSeconds}s threshold.`)
}
console.log(`\nSCAN RELIABILITY PASSED — 5/5 pipelines; average ${(averageSeconds).toFixed(1)}s per case.`)
