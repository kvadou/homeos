# HomeOS — Session Handoff (2026-07-13)

Resume point after the 7/12 mega-session. Working tree clean on `master` at `3c76fb2`, all pushed, prod deployed (gethomeos.vercel.app), iOS auto-shipping via Xcode Cloud. Untracked-only: `.playwright-cli/`, `docs/decks/2026-07-12-homeos-status.html`.

## TL;DR — where we are and what's next
Web + iOS are at feature parity and honest (all v0 fake-capability UI purged). Phase 2 intelligence engine runs end-to-end for receipts. Household sharing is live (invite link texted to Alexis 7/12, acceptance pending). **The forward plan is `docs/plans/2026-07-13-customer-complete-gap-analysis.md`** — read it first; next build phase is **#1 Outbound spine** (Resend + domain + Vercel cron: auth/invite/warranty/digest emails), gated on Doug buying a domain + Resend account. Until those exist, useful ungated work: gap-doc phase 3 (engine completion — doc-type prompt branches, sonnet reasoning passes, cost_ref) or phase 4 trust pack items that need no accounts (rate limiting, export, deletion).

## What shipped 7/12 (all [runtime-tested] or better, per-commit evidence in git log)
1. **Phase 2 step 4**: extraction mints `home_facts` (supersession dedupe); Ask retrieval broadened to 11 sources w/ row ids; answers stream inline `[cN]` citations + `@@CITATIONS@@` tail; confidence-toned chips + Sources row; citations persist. Prompt-injection fix in extract.ts (file metadata fenced as untrusted).
2. **iOS parity sweep A–E** (plan: `docs/plans/2026-07-12-ios-parity-plan.md`, all done): 5 tabs — Care (swipe complete w/ care_event + recurrence roll, snooze, history), Ask (streams web `/api/ask` via Bearer, citation protocol, Sources strip), Projects (kind segments), Home (Worth Knowing carousel + digest sections), Library (search, Documents w/ status chips, camera/PhotosPicker receipt capture → `/api/ingest` → full cascade; photos skip ingest), Settings sheet, CreateHomeView (no-home dead end killed), item edit, VoiceOver labels. **Verification harness**: `ios/HomeOSUITests/ScreenshotSweep.swift` — logs in as dev, screenshots all 5 tabs; run via `xcodebuild test`. Design review: GO; carried findings below.
3. **Web↔iOS auth**: `lib/supabase/api-auth.ts` — `getApiUser` (cookie OR Bearer, no home needed — mid-onboarding safe) + `getApiContext` (adds home). Proxy passes `/api/*` through with a credential-less 401 backstop; route-level auth is the boundary.
4. **Onboarding address step rebuilt**: the v0 fake-suggestion trap (hard-blocked real addresses, injected fabricated property data) deleted; plain honest form; native autofill attrs (web) + `.streetAddressLine1` street-first (iOS, name derives from street); **real autocomplete** via `GET /api/address-search` (Mapbox when `MAPBOX_TOKEN` set → house-number coverage; keyless Photon/OSM fallback otherwise — OSM lacks Doug's own street), dropdown/card on both surfaces, augment-never-gate, OSM attribution. Verified 9-step walkthroughs at 1440/768/390 + prod.
5. **Property prefill scaffold**: `GET /api/property-lookup` (RentCast; dark `{property:null}` until `RENTCAST_API_KEY`) → step-home fills untouched year/sqft/beds/baths with "Prefilled from public records" attribution.
6. **Household sharing live**: `home_invites` migration applied to prod; Settings → Invite family dialog (Editor/Viewer, copy link, pending list + revoke); `/invite/[token]` w/ signup redirect (hardened `next` param — URL-parse guard); service-role accept (constitution §3.6), idempotent, single-use, onboarding bypassed. E2E: fresh account joined Willow Lane. **Invite for Alexis minted from Doug's real account + iMessaged 7/12 — check acceptance** (`home_invites` token d5b3f8a6…, `home_members` for alexis).
7. **Web recurrence roll** (engine §7.8, iOS parity): completeTask inserts next occurrence (`rollRecurrence` in lib/care-data.ts; vocab yearly / twice yearly / every 3 months / monthly + synonyms; template_slug dropped on the copy to dodge the template unique index; deduped on home/title/item/due).
8. **Fake-capability purge**: settings Connected Sources / Notifications / Privacy / Home Intelligence / fake "HomeOS Plus · Visa 4242" billing / "87% Home Knowledge" — all deleted. Settings now = real stats, home profile, homes, family+invites.

## Doug TODOs (everything below is gated on these)
1. **Check Alexis accepted** her invite (or re-mint: Settings → Invite family).
2. **TestFlight build 2+** on phone: exercise Care/Ask/receipt capture; check whether the Care/Library large-title gap reproduces on-device (sim-only so far).
3. **Accounts** (agent cannot create accounts/authenticate — hard rule): rentcast.io + mapbox.com signups → keys → `.env` + `vercel env add RENTCAST_API_KEY MAPBOX_TOKEN` → both dark features light up. For gap-doc phase 1: **buy domain + Resend account**.
4. **Test-account cleanup** (classifier blocks agent-side auth deletes): 5 accounts onboard-{desktop,tablet,mobile,prodcheck} + invite-e2e @homeos.local — script was in 7/12 session scratchpad; trivial to regenerate: service-role delete homes by created_by then `auth.admin.deleteUser`.
5. Later gates: Stripe account, App Store assets, legal review, pricing sign-off (gap doc §5).

## Carried findings / known ceilings
- **Care/Library iOS phantom large-title gap** — pre-existing since v1, sim-verified only; suspect serif nav appearance × large title. Check on-device before chasing.
- OSM/Photon lacks many house numbers (Doug's street included) — Mapbox key is the fix; swap is already coded.
- Corner-radius drift across iOS tabs (12 vs 20); Ask iOS has no conversation history list; member removal UI + multi-home picker deferred.
- Invitee who already owns a home gets dual membership; `getCurrentHome` picks oldest — needs a current-home picker eventually (comment in code).
- Legacy dev-data row renders literal `**` in one old Ask answer (persisted pre-fix; ignorable).

## Gotchas (don't relearn)
- Next 16: `middleware.ts` → `proxy.ts` (export `proxy`). Don't "fix" back.
- RSC: never pass icon components server→client; icon NAME strings + `iconFor()` registries.
- **Xcode Cloud builds the COMMITTED xcodeproj**: any iOS file add/remove ⇒ `xcodegen generate` + commit `ios/HomeOS.xcodeproj/project.pbxproj` in the same push, or CI breaks (Build 4 incident).
- Migrations: `supabase db push` (SUPABASE_DB_PASSWORD in .env) — permission-gated; Doug must name prod-apply.
- haiku structured outputs failed on our schema ("Schema is too complex") — extraction uses plain JSON prompting + code validation.
- pw-verify/playwright sessions expire; a redirect to /login trivially "passes" render checks. Local dev: Next allows ONE dev server per dir (lock).
- Subagents this session repeatedly idled without delivering reports — always check the worker (diff/tests) directly; two reviewer agents died silently, one left a half-applied edit that didn't compile.
- iMessage sends + auth-user deletes + prod db push are classifier-gated: Doug runs them via `!` or names the action.

## Key paths
- Forward plan: `docs/plans/2026-07-13-customer-complete-gap-analysis.md` (tiers + sequenced phases). Constitution: `docs/constitution.md`. Engine contract: `docs/plans/2026-07-12-phase2-intelligence-engine.md` (+ object model, reasoning playbook same date).
- Web: `app/api/{ask,ingest,address-search,property-lookup}/route.ts`, `lib/ingest/{pipeline,extract}.ts`, `lib/actions/{invites,care,...}.ts`, `lib/supabase/{api-auth,middleware,home}.ts`, `components/onboarding/steps/step-home.tsx`, `components/settings/settings-panel.tsx`, `app/invite/[token]/`.
- iOS: `ios/HomeOS/*.swift` (13 views + service/models/theme), `ios/HomeOSUITests/ScreenshotSweep.swift`, `ios/project.yml` (+ committed xcodeproj).
- DB: `supabase/migrations/` through `20260712192000_home_invites.sql` — all applied to prod.

## Accounts / env
- Dev: dev@homeos.local / homeos-dev-2026! (seeded Willow Lane, is_admin). Real: dougkvamme@gmail.com (owner, home "Home"), alexis.kvamme@gmail.com (invited).
- Env now also expects (optional until keys exist): `MAPBOX_TOKEN`, `RENTCAST_API_KEY`. Existing: supabase pair, service role, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SITE_URL`; `RESEND_API_KEY`/`WELCOME_FROM_EMAIL` still empty placeholders (phase 1 fills them).
- Supabase ref gpncqcnklcmqiakvdibg · Vercel project homeos (CLI authed) · Apple team FM45AMFBNY, Xcode Cloud auto-archive on master.
