# Phase 3 — Engine Completion (gap doc phase 3)

**Date:** 2026-07-13. **Scope:** close intelligence-engine build order 5 + finish step 3's doc-type branches + cost_ref (gap 1.3 + 1.4). Contract: `2026-07-12-phase2-intelligence-engine.md` §7.2–7.5, §7.12–7.13, §5. No schema migration needed (verified: `projects.kind` allows `'recommended'`; priority/category free text).

Sub-phases ship + verify in order: **3a doc-type extraction → 3c cost_ref → 3b sonnet reasoning** (3b consumes 3c).

## Current state (verified in code)

- `extract.ts` is already one flat superset shape: any doc type yields item/warranty/spend/facts/timeline proposals. NOT per-type-branched-missing; what's missing is specific fields + proposal kinds below.
- `EXTRACTABLE_TYPES = {receipt, manual, warranty, document}` — **photos never ingest** (§7.5 unbuilt).
- Zero sonnet calls anywhere in the pipeline. Onboarding inserts items but never seeds care tasks and mints no insights (§7.12 unbuilt). Ask has no fact-capture (§7.13).
- `cost_ref` doesn't exist (playbook §: static file in `lib/`, not a table; unlocks 10 of 100 questions).
- **Adjacent bug (fix in 3a):** `acceptSuggestion` for `contractors` calls `autoApply` → `queueSuggestion` upsert `ignoreDuplicates` → no-op because the suggestion row already holds the dedupe key. Accepting a contractor suggestion writes nothing.

## 3a — Doc-type extraction completion

Files: `lib/ingest/extract.ts`, `lib/ingest/pipeline.ts`, `lib/actions/suggestions.ts`, `lib/actions/library.ts`.

### extract.ts

Extend `JSON_SHAPE` (superset stays one call, one shape):

```
"warranty_start": "YYYY-MM-DD" | null (coverage start if stated, else purchase date applies),
"claim_phone": string | null (warranty/service claim phone if printed),
"maintenance_intervals": [{ "task": "Replace air filter", "recurrence": "monthly"|"every 3 months"|"twice yearly"|"yearly"|null, "detail": string|null }] | null (intervals THIS document states, e.g. a manual's maintenance section),
"findings": [{ "system": "Roof", "condition": string, "severity": "low"|"medium"|"high", "recommendation": string|null }] | null (inspection reports only: one entry per flagged finding)
```

Prompt: add one sentence each for photo ("if this is a photo, caption the subject; read any visible model/serial data plate or paint-can label into manufacturer/model/serial/facts") and inspection ("for inspection reports, list every flagged finding in findings"). Photo with no readable subject → all nulls, zero proposals (gallery only, no queue spam).

### buildProposals additions (all deterministic)

1. **Manual intervals → care_tasks `[QUEUE]`** (§7.2): per interval, `template_slug: 'manual:' + slugify(task)`, `item_id` from itemMatch, recurrence vocab must match web roll vocab (yearly / twice yearly / every 3 months / monthly). Cap 6. Confidence = doc confidence * 0.9 capped at 0.84 (forces queue — user vets manufacturer schedules).
2. **Warranty expiry reminder → care_tasks `[AUTO]`** (§7.3): when `ends_on` computable (starts = warranty_start ?? purchase_date), one task `title: '<provider> warranty expires <Mon YYYY>'`, `due_on = ends_on - 30d`, `template_slug: 'warranty_expiry'`, item-linked. Skip if ends_on already past.
3. **Warranty provider → contractors `[QUEUE]`**: when provider + claim_phone present. `dedupeKey: 'contractor:' + provider.toLowerCase()`.
4. **Warranty coverage insight (rule-based, no sonnet)**: `headline: 'Covered: <item/provider> until <date>'`, category `'protection'`, `dedupe_slug: 'warranty:' + file.id`.
5. **Inspection findings → care_tasks `[QUEUE]`** (§7.4): per finding, `template_slug: 'inspection:' + slugify(system)`, priority = severity, detail = condition + recommendation. High-severity findings ALSO → **projects `[QUEUE]`**: `{ name: 'Address: ' + system + ' — ' + condition (short), kind: 'recommended', summary: recommendation }`, `dedupeKey: 'inspection-project:' + slugify(system)`.
6. **Photo item link → files update `[AUTO]`** (§7.5): when itemMatch and `!file.item_id`, proposal `{ target: 'files', action: 'update', targetId: file.id, payload: { item_id: match.id } }`. Plate OCR/paint facts ride the existing items-fill + home_facts machinery unchanged.

### pipeline.ts

- `Proposal.target` union += `'projects' | 'files'`.
- **Policy restructure (fixes the contractor bug):** move "new entities are never silently inserted" from `autoApply` into `applyCascade` — before the gate: `if (isNewEntity(p)) → queueSuggestion` where `isNewEntity = (items|contractors|projects) && action==='insert'`. `autoApply` then ALWAYS writes: gains real `contractors` insert (dedupe: ilike name match in home → skip), `projects` insert (dedupe on `(home_id, name, kind)` match → skip), `files` update case (`update files set item_id where id=targetId and home_id`). `acceptSuggestion`'s existing items special-case stays (field_provenance + care seeding).
- `library.ts`: `EXTRACTABLE_TYPES` += `'photo'`.

### Verify 3a

`pnpm build` + fixture E2E: generate 4 fixture docs (manual page w/ maintenance table, warranty certificate, inspection report w/ 3 findings incl. 1 high, photo-style data plate) as HTML → PDF/PNG, upload to dev home via service role, insert `files` rows, run `ingestFile` directly via tsx, assert: care_tasks queued w/ manual: slugs, warranty_expiry task auto-applied, warranties row, contractor suggestion, inspection tasks + recommended-project suggestion, files.item_id linked. Then accept one contractor suggestion and assert the contractors row exists (bug regression check).

## 3c — cost_ref

New `lib/cost-ref.ts` (static data, no table — playbook decision):

```ts
export type CostRef = { key: string; label: string; replaceLow: number; replaceHigh: number; lifespanYears: [number, number]; unit?: 'each'|'sqft' }
export const SYSTEM_COSTS: CostRef[] = [ /* ~20: water heater, furnace, AC, roof asphalt, windows(each), deck(sqft)… national 2026 ranges */ ]
export const PROJECT_RECOUP: { key: string; label: string; costLow: number; costHigh: number; recoupPct: [number, number] }[] = [ /* ~12: kitchen minor/major, bath, deck, siding, solar… */ ]
export const REGIONAL_MULTIPLIER: Record<string, number> = { CA: 1.35, NY: 1.3, /* …all states, 1.0 default */ }
export function costRefFor(home: {state?: string|null}) { /* multiplied snapshot for prompts */ }
```

Wire into `/api/ask` system prompt as a `cost_reference` block ("benchmark data, not this home's records — cite as type 'general', confidence 'estimated'"). Verify: build + one Ask question ("what's a fair price for a water heater replacement here?") returns a numeric range citing general.

## 3b — Sonnet reasoning passes

New `lib/ingest/reason.ts` (model `claude-sonnet-5`, all writes through `applyCascade`-equivalent gating at depth 2, each pass = 1 call max):

1. **Replacement forecast** (§7.1/§7.6): `forecastForItem(db, homeId, itemId)` — item (installed_on + lifespan or cost_ref lifespan) + cost_ref range → one-sentence insight proposal, `dedupe_slug: 'forecast:' + itemId`, model self-reports confidence → AUTO/QUEUE via normal gate. Hooks: end of `ingestFile` when cascade created/updated an item with installed_on (receipt path); `createItem` after() when installed_on set.
2. **Inspection health summary** (§7.4): when docType='inspection' with findings → one insight ("3 items need attention; roof most urgent"), `dedupe_slug: 'inspection:' + fileId`.
3. **Onboarding batch** (§7.12): `after(() => onboardingCascade(homeId))` in `completeOnboarding`: rule-based first (seed care tasks per created system via `seedCareTasksForItem` — missing today; timeline seed = year built), then ONE sonnet pass over profile → 2–3 starter insights `[AUTO]`, `dedupe_slug: 'onboarding:' + n`.
4. **Ask fact-capture** (§7.13): after() post-stream in `/api/ask`: **haiku** (extraction, not reasoning — §5 rationale) over the user's question only → durable stated facts → proposals forced `[QUEUE]` (chat never silently writes records). Reuses home_facts/items proposal machinery.

Budget note: ingestFile stays ≤ 1 haiku + 1 sonnet (forecast OR health summary, by docType) per §1 ceiling.

### Verify 3b

Fixture re-run: receipt fixture → forecast insight exists w/ depth 2 provenance; inspection fixture → summary insight; fresh onboarding via script → care_tasks + timeline + insights; Ask "my roof is a 2015 GAF architectural shingle" → suggestion queued, nothing auto-written.

## Order + gates

1. 3a → build + fixture E2E → commit.
2. 3c → build + Ask spot-check → commit.
3. 3b → build + fixture E2E → commit.
Each commit pushed to master (Vercel deploys). No Doug gates — fully ungated work.
