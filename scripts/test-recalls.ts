/**
 * matchCpscRecalls verification — ZERO network, inline fixture rows only.
 *
 * Guards the structured matcher against the substring noise it replaced:
 *   (a) Rheem XE50T10 + manufacturer Rheem → matches a recall row with those fields
 *   (b) model "A100" with no manufacturer  → does NOT match "A1000" or free-text noise
 *   (c) manufacturer mismatch              → blocks an otherwise-matching model
 *
 * Usage: pnpm dlx tsx scripts/test-recalls.ts
 */
import { matchCpscRecalls, type CpscRecall } from '../lib/recalls'

const assert = (cond: unknown, msg: string) => {
  if (!cond) throw new Error(`ASSERT FAILED: ${msg}`)
  console.log(`ok: ${msg}`)
}

// (a) A real-shaped Rheem water-heater recall.
const rheemRecall: CpscRecall = {
  RecallID: 12345,
  Title: 'Rheem Recalls Gladiator Water Heaters',
  Products: [{ Name: 'Rheem Gladiator Water Heaters', Model: 'XE50T10' }],
  Manufacturers: [{ Name: 'Rheem Manufacturing Company' }],
}

const aMatch = matchCpscRecalls([rheemRecall], { manufacturer: 'Rheem', model: 'XE50T10' })
assert(aMatch.length === 1, '(a) Rheem XE50T10 + maker Rheem matches the fixture recall')
assert(aMatch[0].id === '12345' && aMatch[0].confidence === 'model', '(a) match carries the recall id at model confidence')

// (b) "A100" is short + generic; the substring "A1000" and a free-text mention must NOT match.
const a1000Recall: CpscRecall = {
  RecallID: 22222,
  Title: 'Widget A1000 Recall',
  Products: [{ Name: 'Widget with A100 in the description', Model: 'A1000' }],
  Manufacturers: [{ Name: 'Acme' }],
}
const bMatch = matchCpscRecalls([a1000Recall], { manufacturer: null, model: 'A100' })
assert(bMatch.length === 0, '(b) model "A100" with no manufacturer does not substring-match "A1000" / free text')

// (c) Same model, but the recall belongs to a different manufacturer → blocked.
const bradfordRecall: CpscRecall = {
  RecallID: 33333,
  Title: 'Bradford White Water Heater Recall',
  Products: [{ Name: 'Bradford White Heaters', Model: 'XE50T10' }],
  Manufacturers: [{ Name: 'Bradford White Corporation' }],
}
const cMatch = matchCpscRecalls([bradfordRecall], { manufacturer: 'Rheem', model: 'XE50T10' })
assert(cMatch.length === 0, '(c) manufacturer mismatch blocks the model match')

console.log('\nRECALL MATCHER PASSED — structured model + manufacturer matching, no substring noise')
