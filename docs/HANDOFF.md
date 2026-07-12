# HomeOS — Session Handoff (2026-07-12)

Resume point after a full rebuild + iOS TestFlight push. Working tree clean on `master`, all work pushed. Only untracked: `.playwright-cli/` (gitignored screenshots).

## Update (2026-07-12 later session)
1. **Phase 2 design pack shipped** (`db891cc`): `docs/constitution.md` + 3 reconciled design docs in `docs/plans/` (object model, intelligence engine, reasoning playbook). Read constitution first. Canonical decisions reconciled across docs: `extractions` table = citation hub, two-pattern provenance (`field_provenance` for mixed tables, row columns for wholly-AI), polymorphic `suggestions` review queue, first-class `warranties`, `home_facts` schema now / embeddings deferred, `cost_ref` static lib data.
2. **Full responsive sweep done** (`c1094fd`, [runtime-tested] + [prod-verified] /login): 11 routes x 5 viewports (320-1440) + 9-step onboarding walkthrough. Fixed: projects rail page-overflow 640-1279 (contain-paint), care house diagram overflow @320 (min() borders), care hero stack, settings segmented @320, ~60 tap targets to >=40px (incl. pointer-coarse:min-h-10 pattern), safe-area insets + viewportFit cover. Verified 0 horizontal scroll everywhere, build green, prod clean.
3. **Next: Phase 2 build order** (per intelligence-engine doc §9): (1) migration — all Phase 2 tables from object-model doc §4 + engine additions §6 ✅ DONE + applied to prod, (2) pipeline skeleton `lib/ingest/pipeline.ts` with stubbed extract ✅ DONE (runtime-tested via `scripts/test-pipeline.ts`), (3) receipt extraction live (haiku vision, `lib/ingest/extract.ts`) + review queue UI (`<ReviewQueue>` on dashboard, accept/reject actions) ✅ DONE — E2E-tested with a real rendered receipt via `scripts/test-extraction.ts` (extraction → cost/warranty/timeline auto-applied → item suggestion → dashboard Accept → item + field_provenance). NOTE: haiku structured outputs (`output_config.format`) failed twice ("Schema is too complex" / "Grammar compilation timed out") — extraction uses plain JSON prompting + code validation instead, (4) home_facts capture + Ask retrieval broadening w/ citations ✅ DONE [runtime-tested] — extraction now mints `facts[]` → `home_facts` proposals (Pattern A provenance, supersession dedupe in `autoApply`, embedding null by design); Ask context broadened to 11 sources w/ row ids (+contractors/files/timeline/rooms/warranties/home_facts + features/goals); answers stream inline `[cN]` markers + `@@CITATIONS@@` JSON tail (playbook §1.2 Citation type in `lib/ask-data.ts`), client renders confidence-toned chips + Sources row, citations persist in message content. Verified: `test-extraction.ts` x2 (facts minted + supersession asserted), live /ask question w/ 5 citations, persistence round-trip, clean teasers. Also fixed prompt-injection (file.name/type fenced as untrusted metadata in extract prompt) + model-slipped `**bold**` stripped in `textToBlocks`, (5) remaining doc types, (6) cost_ref + reasoning passes (incl. Ask fact-capture). Each phase ships + verifies alone.
4. **NEW (7/12, Doug): Household sharing — Doug + Alexis one shared home.** Schema already supports it (`home_members` roles owner/family/guest, all RLS membership-based) — what's missing is product: (a) invite flow (owner invites by email → membership row on accept), (b) member management in /settings, (c) `getCurrentHome` picks first home by `created_at` — fine for v1 but breaks if the invitee already onboarded their own home (needs a current-home selector or invite-supersedes-own-home rule), (d) onboarding fork: "join an existing home" path. Build as its own phase — slot after build-order step 3 (before Alexis starts daily-driving uploads).
5. **iOS is LIVE on Doug's phone via TestFlight** (compliance cleared, build 1 in Internal group, invite accepted). Native design review passed, no HIG violations. Parity plan: `docs/plans/2026-07-12-ios-parity-plan.md` — build order: Care tab → Ask tab (via web /api/ask) → Projects + Worth Knowing → camera/receipt capture (aligns with web Phase 2 ingestion) → settings + onboarding. Add Alexis as TestFlight internal tester (App Store Connect → Users and Access → invite alexis.kvamme@gmail.com, then TestFlight → Internal group).
6. **Collaboration model (Doug + Alexis)** — Alexis designs in v0 (v0.app project `homeos-dashboard-design-eVVBzVQ8wYi`, her ChatGPT/v0 flow stays); the GitHub repo (`kvadou/homeos` → Vercel prod) is the single source of truth. Flow: she iterates a screen in v0 → shares the v0 link/export → Claude ports it into `components/` preserving the data wiring → deploys to gethomeos.vercel.app → she verifies live. One screen/section per handoff, never whole-app dumps. Product decisions check against `docs/constitution.md` (both should read it). Setup TODOs: invite Alexis to GitHub repo + Vercel project + TestFlight; share constitution + this handoff. Status deck emailed to both 7/12: `docs/decks/2026-07-12-homeos-status.pdf`.

## Update (2026-07-12 evening session) — iOS parity sweep COMPLETE + onboarding fix
1. **iOS parity sweep phases A-E all shipped** (commits `49b4ee8`→`bb6e331` + a11y): 5 tabs (Home/Care/Projects/Library/Ask), Care (swipe complete w/ care_event + recurrence roll, snooze, history), Ask (streams web /api/ask via Bearer JWT, citation sentinel protocol, Sources strip), Projects (kind segments), Home folds in Worth Knowing (dismissible insight carousel, weekend priorities, coming up, activity), receipt capture (camera/PhotosPicker → hash → upload → POST /api/ingest → full extraction cascade; photos skip ingest, web parity), Settings sheet + CreateHomeView (kills the no-home dead end), item edit, VoiceOver labels. All verified: xcodebuild + XCUITest screenshot sweep (`ios/HomeOSUITests/ScreenshotSweep.swift` — the iOS pw-verify; logs in as dev, screenshots all 5 tabs).
2. **Web for iOS**: `lib/supabase/api-auth.ts` getApiContext (cookie OR Bearer, RLS as user), proxy passes /api/* through w/ credential-less 401 backstop, new `POST /api/ingest` (202/401/404, fires after(ingestFile)).
3. **Xcode Cloud discovery**: CI auto-builds master from the COMMITTED xcodeproj (handoff's old "gitignored" note was wrong since `3ab5fda`) and auto-ships TestFlight. **RULE: any iOS file add/remove commits the regenerated pbxproj** (Build 4 broke on this; fixed `8e09464`).
4. **Onboarding step-2 bug (Doug hit on prod, phone)**: fake v0 address-autocomplete theater hard-blocked real addresses + injected fabricated property data. Deleted (−185 lines, `da18e60`). Verified: full 9-step signup→dashboard walkthroughs at 1440/768/390 + prod spot-check [prod-verified].
5. **Review findings carried forward**: (a) MED phantom large-title gap on Care/Library (pre-existing since v1, sim-verified only — check on-device in build 2 before chasing; suspect serif nav appearance × large title), (b) LOW corner-radius drift 12/20 across tabs, (c) Ask iOS lacks conversation history list, (d) member invite flow = web phase (slot with household sharing, item 4 below).
6. **Doug TODOs**: (a) TestFlight build 2 lands from Xcode Cloud on the last push — verify on phone, then add Alexis (App Store Connect → TestFlight → Internal), (b) run the test-account cleanup: `pnpm dlx tsx <session-scratchpad>/cleanup-test-accounts.ts` (4 onboard-*@homeos.local accounts; permission classifier blocked agent deletion), (c) web completeTask doesn't roll recurrence yet (iOS does — engine §7.8): add to web in a small follow-up.

## Update (2026-07-12 late night) — sharing live, address intelligence, theater purge
1. **Household sharing SHIPPED** (`9567946`): `home_invites` (migration applied to prod), Settings → Invite family → single-use 7-day link (Editor/Viewer), `/invite/[token]` w/ signup redirect (hardened next param), service-role accept → family membership, onboarding bypassed. E2E-verified with a real fresh account joining Willow Lane. **Doug: text Alexis a link from prod Settings.** Deferred: member removal UI polish, multi-home current-home picker (invitee who already has a home).
2. **Address autofill + autocomplete shipped** (`3a7a86f`, `b7e0ac8`, `6f46aac`): native autofill attrs (web) + `.streetAddressLine1` (iOS, street-first + name derives from street); `/api/address-search` — Mapbox when `MAPBOX_TOKEN` set, keyless Photon fallback otherwise (OSM lacks Doug's street — Mapbox key fixes); dropdown/card on both surfaces, augment-never-gate. `/api/property-lookup` (RentCast, dark until `RENTCAST_API_KEY`) prefills year/sqft/beds/baths with public-records attribution. **Doug: sign up rentcast.io + mapbox.com, then keys → .env + Vercel env (agent can't create accounts).** `getApiUser` added (auth without home) for mid-onboarding routes.
3. **Web completeTask rolls recurrence** (`e8214d2`, engine §7.8, iOS parity; template_slug dropped on the roll to dodge the template unique index).
4. **Fake-capability purge** (`e8214d2`): settings Connected Sources / Notifications / Privacy / Home Intelligence / fake subscription+billing all deleted (v0 theater, same family as the onboarding address bug). Settings now shows only real capability.
5. **Test-account cleanup pending (Doug)**: 5 accounts — onboard-{desktop,tablet,mobile,prodcheck} + invite-e2e @homeos.local; script in session scratchpad (classifier blocks agent-side auth deletes).
6. Onboarding step-2 address step also has property-prefill wiring live (dark until RentCast key).

## TL;DR — one thing is pending
The iOS app is uploaded to TestFlight but **not yet on the phone**. Only blocker: build 1 needs a one-time **export-compliance** answer in App Store Connect (a legal click, Doug's to make). Everything else is done and auto from here.
- Go to App Store Connect → HomeOS: Home Manager → TestFlight → build 1 → **Manage** (next to "Missing Compliance") → **"None of the algorithms mentioned above"** → Save.
- Auto-distribution then pushes it to the "Internal" group → appears in Doug's TestFlight app (~1 min; may need to accept an emailed TestFlight invite first).
- Future uploads skip this — `ITSAppUsesNonExemptEncryption=NO` is now baked into the project.

## What HomeOS is
AI operating system for homeowners — the home's digital memory (devices, docs, maintenance, projects) + an AI assistant that reasons over it. Business plan: `docs/business-plan.md`. Roadmap: `docs/roadmap.md`. GTM: `docs/gtm-plan.md`.

## Stack (live)
- **Web**: Next.js 16 (App Router, React 19), Tailwind v4, Base UI. Flat app at repo root (NOT a monorepo — old CLAUDE.md monorepo refs are dead).
- **Backend**: Supabase project ref `gpncqcnklcmqiakvdibg`. Postgres (15-table RLS schema), Supabase Auth (`@supabase/ssr`, email confirmations OFF for beta), Storage bucket `home-files`.
- **AI**: Ask HomeOS = `claude-sonnet-5` streaming, home-context system prompt (`app/api/ask/route.ts`).
- **Deploy**: Vercel project `homeos`, GitHub `kvadou/homeos`, push-to-master auto-deploys → **https://gethomeos.vercel.app** (custom domain deferred).
- **iOS**: SwiftUI app in `ios/` (supabase-swift via SPM), same Supabase backend. Bundle id `com.dougkvamme.homeos`, App Store name "HomeOS: Home Manager" (both provisional — real "HomeOS" was globally taken; rename display name anytime pre-release). Team `FM45AMFBNY`.

## Accounts / test data
- Web/iOS dev account: `dev@homeos.local` / `homeos-dev-2026!` — fully seeded "Willow Lane" home (11 items, 16 projects, 14 insights, service history). Also `is_admin=true`.
- Real users: `dougkvamme@gmail.com` (is_admin), `alexis.kvamme@gmail.com`.
- Seed any home: `pnpm dlx tsx scripts/seed.ts --email <email> --wipe`.
- Env: `.env` / `.env.local` (gitignored). Keys: `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SITE_URL`, plus empty `RESEND_API_KEY`/`WELCOME_FROM_EMAIL` placeholders.

## Done this session (all committed + pushed, latest `50ad5c0`)
1. **Scrapped** old Turborepo/Prisma/Clerk repo → rebuilt from v0 design export on Supabase.
2. **All 7 sections wired to real data**: dashboard, care, projects, library (full device CRUD), worth-knowing, ask (real Claude chat), settings + 9-step onboarding writes home→DB.
3. **Auth**: signup/login, `/admin` (gated by `profiles.is_admin`), **password reset** (`/forgot-password` + `/reset-password`, PKCE), sign-out.
4. **Welcome email**: env-gated Resend scaffold (`lib/email.ts`), no-ops until creds set.
5. **Mobile sweep** (impeccable): added mobile nav drawer (sidebar was `hidden lg:flex` with no mobile nav — app was unusable on phone); killed horizontal overflow on all routes (root cause: `flex-1 main` needed `min-w-0`; active-projects rail stacks vertically on mobile). All 8 routes verified 0 horizontal scroll at 390px.
6. **iOS v1** built, distribution-signed, uploaded to TestFlight (build 1, state VALID). Internal test group "Internal" created, Doug added as tester.
7. Security review fixes throughout (IDOR scoping, open redirect, host-header, email XSS, is_admin escalation).

## Next up (pick up here)
1. **Finish TestFlight** — Doug answers the compliance question (above); confirm build lands on his phone.
2. **SMTP for emails** — password-reset emails + welcome email both need a Resend account + verified sender domain. Then: `RESEND_API_KEY` + `WELCOME_FROM_EMAIL` into Vercel, and point Supabase Auth SMTP at Resend (built-in sender is rate-limited).
3. **iOS simulator screenshots** — were blocked by a stale CoreSimulator daemon (Xcode 26.6 needs a Mac reboot). After reboot: `cd ios && xcodegen generate && open HomeOS.xcodeproj`.
4. **Product Phase 2** (roadmap): document ingestion → OCR → metadata extraction → knowledge graph → AI memory → real answer generation w/ citations → proactive insights. Roadmap Prompts #1–3 + a HomeOS Constitution kick it off.
5. Later: custom domain, contractor/agentic marketplace layer (`contractors` table is the seed), App Store submission.

## Gotchas / conventions (don't relearn the hard way)
- **Next 16 renamed `middleware.ts` → `proxy.ts`** (export `proxy`). Don't "fix" it back.
- **RSC rule**: never pass Lucide icon components (any function) server→client. Pass icon NAME strings; resolve client-side via `iconFor()` registries in `lib/*-data.ts`. (Bit multiple agents.)
- Server actions are home-scoped explicitly (`.eq('home_id', home.id)`) on top of RLS.
- Migrations: `supabase db push` (needs `SUPABASE_DB_PASSWORD` from `.env`; IPv6 fails → CLI uses IPv4 pooler automatically after `supabase link`).
- iOS `.xcodeproj` is generated from `ios/project.yml` via `xcodegen generate` (gitignored). App Store Connect app record can't be created via API (POST /v1/apps disallowed) — web UI only.
- pw-verify sessions expire (~1hr) — re-login before trusting "no overflow"/render checks (a redirect to /login trivially passes).

## Key paths
- `app/` routes, `components/<section>/`, `lib/<section>-data.ts` (types + adapters + presentational maps), `lib/actions/*.ts` (server actions), `lib/supabase/{client,server,middleware,home,admin}.ts`, `lib/email.ts`, `lib/usage.ts`.
- `supabase/migrations/*.sql`, `scripts/seed.ts`.
- `ios/HomeOS/*.swift`, `ios/project.yml`.
- `docs/` — business-plan, roadmap, gtm-plan, this handoff.
