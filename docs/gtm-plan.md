# HomeOS Go-To-Market Plan

**Product:** AI operating system for homeowners. The home's digital memory (systems, documents, maintenance, projects) plus an AI assistant that reasons over it.
**Launch shape:** Free web app on Vercel, custom domain before public beta. Solo founder. $0 to $500/mo budget.
**North star:** Weekly active households (WAH).
**Year-1 goals:** 10,000 registered households, 1,000 paying.

---

## 1. Positioning

**One-liner:** HomeOS is the memory your home never had. Upload your documents once, and get an AI that actually knows your house: what's in it, what it needs, and what to do next.

**Positioning statement:** For homeowners drowning in scattered notes, email folders, and paper manuals, HomeOS is the single system of record for a home that turns its history into personalized guidance, unlike Zillow (value only), Houzz (inspiration only), or notes apps (storage without intelligence), because HomeOS remembers your specific home and gets smarter every week you use it.

**Messaging pillars** (every piece of content maps to one):

1. **"Your home's knowledge dies in drawers and inboxes."** When did the water heater go in? Which paint is in the guest room? Where's the shutoff valve? HomeOS preserves what you'd otherwise lose. Anti-fragmentation message; hits the 12-tools problem directly.
2. **"Generic advice is worthless. Your home is specific."** Google tells you what furnaces need. HomeOS tells you what *your* furnace needs, based on its age, model, and service history. This is the AI differentiation vs ChatGPT.
3. **"Confidence, not chores."** A Home Health Score and a prioritized plan beat a guilt-inducing to-do list. Am I taking good care of my home? HomeOS answers yes, and proves it. This is the emotional close and the premium upsell.

**What we never say:** "smart home hub," "IoT," "chatbot." HomeOS competes on memory and judgment, not device control.

---

## 2. ICP: Who feels the pain worst

**Primary early adopter: the Recent Buyer (closed within 18 months).**
Age 28 to 45, household income $100K+, just inherited a house with zero documentation and a 40-page inspection report they don't understand. The inspection report is the perfect first upload: one PDF that seeds systems, ages, and a deficiency list. Pain is acute, the moment is dated (closing day), and they're reachable (r/FirstTimeHomeBuyer, realtor relationships, "just bought a house" content).

**Secondary: the DIY Maintainer.** Owner of a 10+ year-old home who watches repair YouTube, keeps a spreadsheet, and already tracks *something*. Lower urgency but highest retention and word-of-mouth; they become the power users and Reddit advocates.

**Explicitly not yet:** renters, property managers, realtors as users (they're a channel, not a customer, in year 1).

---

## 3. Channel plan (ranked for a solo founder)

| # | Channel | Effort | Time to signal | Expected return | Play |
|---|---------|--------|----------------|-----------------|------|
| 1 | Reddit (value-first) | Low | 1-2 weeks | High; primary beta source | See playbook below |
| 2 | Build-in-public (X + r/SideProject) | Low | 2-4 weeks | Medium; compounds credibility, feeds every other channel | 3 posts/week on building HomeOS |
| 3 | SEO / programmatic content | Medium | 3-6 months | High long-term; near-zero short-term | "How long does a [system] last" + "[appliance] maintenance schedule" pages, generated from the maintenance engine's own data |
| 4 | Product Hunt launch | Medium (one-time) | Launch day | Medium spike, badge + backlink | Fire only when activation and retention are proven |
| 5 | YouTube DIY creators | Medium | 1-2 months | High if one hits; $0 plays exist | Free premium-for-life + affiliate rev share later. Target mid-tier (50K-500K subs): Everyday Home Repairs, The Honest Carpenter, LRN2DIY, Proper DIY, Fix It Home Improvement. Skip This Old House / Home RenoVision until there's budget |
| 6 | Realtor closing-gift channel | Medium | 2-3 months | High LTV per effort; sets up Year-2 B2B2C | "Gift HomeOS to your buyer, pre-loaded with their inspection report." Start with 5 local agents |
| 7 | Personal finance influencers/newsletters | Medium | 2-3 months | Medium | Angle: "the 1% rule is dumb; here's what your home actually costs." Pitch The Money Guy Show, BiggerPockets Money, budget-focused newsletters |

**Reddit playbook (channel #1, the week-1 channel):**

- Target subs: **r/FirstTimeHomeBuyer**, **r/homeowners**, **r/HomeImprovement**, **r/HomeMaintenance**, **r/DIY**, **r/CenturyHomes** (old-home owners = document hoarders), r/personalfinance (answer-only, never promote).
- All of these restrict self-promotion. The play is not "posting about HomeOS." It is:
  1. Answer 3 to 5 maintenance/what-do-I-do-first questions daily under a real persona. Follow the 9:1 rule.
  2. Post genuinely useful artifacts: "I made a first-year home maintenance checklist after buying" with a link in profile, not post.
  3. Beta recruitment via posts that ask for help, not attention: "I'm building a tool that turns your inspection report into a maintenance plan. 20 beta spots, want brutal feedback." r/SideProject and r/InternetIsBeautiful allow this directly; in the homeowner subs, message-first users who describe the exact pain.
- Budget: $0. Time: 30 to 45 min/day. This is the single highest-leverage hour of the founder's week until public beta.

---

## 4. Launch sequence

### Stage 1: Private beta (invite-only, target 50-100 households)
- **Entry criteria:** the core loop works end to end for a stranger: sign up, create home profile, upload inspection report or manual, HomeOS extracts systems, generates a maintenance schedule, and answers one question citing the user's own document. Nothing else has to exist.
- **During:** weekly personal email to every household. Watch sessions. Fix the top 3 friction points weekly, nothing else.
- **Exit criteria:** activation rate >= 50% (definition in section 6); >= 30% of activated households return in 3 consecutive weeks; the founder can state in one sentence why retained users come back.

### Stage 2: Public beta (open signup, quiet)
- **Entry criteria:** private beta exit met, self-serve onboarding with zero founder intervention, custom domain live, error monitoring in place.
- **During:** turn on SEO content, escalate Reddit presence, start creator and realtor outreach with real screenshots and real retention numbers.
- **Exit criteria:** 500+ registered households, activation holds >= 40% without hand-holding, week-4 (D30) retention >= 25%, referral hook live.

### Stage 3: Launch (coordinated spike)
- **Entry criteria:** public beta exit met, premium tier live or waitlisted, 3+ creator/realtor relationships warm enough to amplify on launch day.
- **The day:** Product Hunt + build-in-public thread + "I built this" posts in r/SideProject and r/InternetIsBeautiful + every warm contact activated at once. One spike, not a drip.

---

## 5. Activation loop and referral hooks

**Aha moment:** HomeOS answers a question about *your* home using *your* document. Everything in onboarding drives toward it in under 10 minutes.

First-session sequence (this is the onboarding spec):
1. Create home profile: address, year built, sqft. Under 60 seconds.
2. **Upload one document.** Inspection report is the golden path; appliance manual or receipt also works. This is the moment that matters; the empty-state should beg for the inspection report specifically.
3. HomeOS auto-extracts 3+ systems/appliances and shows them: "Here's what I learned about your home."
4. Auto-generate the personalized maintenance schedule and Home Health Score.
5. Prompt one question: "Ask me anything about your home." Suggested chips: "What should I do first?" "When does my water heater need replacing?"

**Habit loop (retention):** weekly "Worth Knowing" email digest: seasonal tasks due, one insight from their data, one question they haven't asked. The email is the product for week-2+ users; ship it before public beta.

**Referral hooks:**
- **Household invite:** "Add your partner" is a natural, non-icky viral action; homes have 2+ adults. Prompt after activation.
- **Shareable Home Health Score:** a public scorecard card image made for Reddit/group-chat flexing.
- **Realtor gift link:** an agent creates a pre-seeded home for their buyer. Every gifted home is a warm activated user plus an agent testimonial.

---

## 6. Metrics dashboard

| Metric | Definition | Beta target | Month-6 target |
|--------|-----------|-------------|----------------|
| Activation rate | Signup -> home profile + 1 doc uploaded + 1 question asked, within 7 days | >= 50% | >= 40% at scale |
| WAH (north star) | Households with 1+ meaningful action (doc, task, question, email click) in 7 days | 30 | 800 |
| D30 retention | % of activated households active in week 4 | >= 25% | >= 30% |
| K-factor | Invites sent x invite conversion, per activated household | measure only | 0.15-0.25 |
| Registered households | Cumulative | 100 | 2,500 (pace to 10K/yr) |
| Time-to-aha | Median signup -> first cited answer | < 10 min | < 7 min |
| Free -> paid | Once premium ships | n/a | 5-8% of activated |

Instrument events from day 1: `signup`, `home_created`, `doc_uploaded`, `question_asked`, `answer_cited`, `invite_sent`, `email_opened`. PostHog free tier covers all of it.

**Kill/pivot signal:** if activated D30 retention sits below 15% after two full iteration cycles in private beta, the loop is broken; fix retention before spending anything on acquisition.

---

## 7. 90-day execution calendar

Assumes GTM starts alongside Phase-2 build (ingestion + AI), not after it.

| Week | Focus | Concrete tasks |
|------|-------|----------------|
| 1 | Foundations | Register domain. Waitlist landing page (one-liner + inspection-report screenshot + email capture). Create Reddit persona, join the 6 subs, start daily answers. First build-in-public post. |
| 2 | Audience | 30 min/day Reddit. Publish "first-year homeowner maintenance checklist" (blog + Reddit artifact). PostHog events wired. |
| 3 | Beta recruit | r/SideProject beta post. DM 20 Redditors describing the exact pain. Goal: 25 committed beta households. |
| 4 | Beta prep | Golden path hardened: inspection report -> systems -> schedule -> cited answer. Onboarding per section 5. |
| 5 | **Private beta opens** | Onboard first 25 personally (15-min calls where possible). Watch, don't pitch. |
| 6 | Iterate | Fix top-3 frictions. Weekly personal email starts. Recruit next 25. |
| 7 | Iterate | "Worth Knowing" weekly digest ships. Measure activation and week-over-week return. |
| 8 | Iterate | Third friction pass. First 5 SEO pages live ("how long does a furnace last" pattern). Beta at 50-100. |
| 9 | Exit check | Score against Stage-1 exit criteria. Not met: two more iterate weeks, shift everything right. Met: proceed. |
| 10 | **Public beta** | Open signups on custom domain. Announce via waitlist, Reddit persona, build-in-public. Household-invite referral live. |
| 11 | Channel outreach | Pitch 10 mid-tier DIY YouTubers (free premium-for-life for them + audience). Pitch 5 local realtors on gift links. 10 more SEO pages. |
| 12 | Optimize | Onboarding funnel pass from real data. Shareable Home Health Score ships. Draft Product Hunt assets. |
| 13 | Pre-launch | Score Stage-2 exit criteria. Line up launch-day amplifiers. Set PH date for week 15-16 (launch sits just past this 90-day window, by design: launch is earned, not scheduled). |

Weekly operating rhythm throughout: 5 hrs community, 2 hrs content, 1 hr metrics review, rest on product.

---

## 8. Budget ($0-500/mo)

| Item | $0 mode | $500 mode |
|------|---------|-----------|
| Domain | $20/yr | same |
| Vercel | Free tier | Pro $20/mo |
| Supabase (DB + auth + storage) | Free tier | Pro $25/mo |
| Claude API | ~$25-50/mo at beta scale (cap per-user usage) | $150-250/mo at public-beta scale |
| Email (Resend/Loops) | Free tier | $20/mo |
| PostHog | Free tier | Free tier |
| Creator seeding | $0 (free premium) | $100-200/mo micro-sponsorship of one mid-tier DIY channel, only after activation >= 40% is proven |
| Paid ads | $0 | $0. Do not buy ads in the first 90 days; nothing to scale yet |

**Total:** ~$30/mo minimum, ~$400-500/mo comfortable. The binding constraint is founder hours, not dollars; the calendar above is built for that.

---

## 9. Risks worth naming

1. **AI extraction quality misses on real inspection reports.** The golden path is the product. Mitigate: test against 20 real reports before beta; degrade gracefully to guided manual entry.
2. **Reddit accounts flagged as promotional.** Mitigate: 9:1 rule, persona built on genuine answers weeks before any mention of HomeOS.
3. **ChatGPT is good enough for one-off questions.** Mitigate: never compete on Q&A; compete on memory. Every message: "it knows *your* home."
4. **Retention flat because homes are low-frequency.** The weekly digest is the counter; if it doesn't drive returns by week 8, that's the fire to fight before any launch.
