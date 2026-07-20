**DRAFT — not yet published, pending legal review.**

# GatheredOS Privacy Policy

Last updated: [FOUNDER: set publish date]

GatheredOS (gatherroot.vercel.app) helps you keep a digital record of your home and ask an AI assistant questions about it. This policy explains what we collect, why, and what control you have over it.

**[FOUNDER: confirm the legal entity name that "we/us" refers to below.]**

## 1. What we collect

**Account info**: your email address and, if you provide it, your name.

**Home info**: address, year built, size, bed/bath count, property type, and any "features" or "goals" you tell us about the home.

**Things you upload**: photos and documents (receipts, manuals, warranties, inspection reports, etc.) about your home, plus the structured data our AI extracts from them (item details, warranty terms, maintenance schedules, purchase costs, inspection findings, and short "facts" about your home worth remembering).

**Records you or the app create**: maintenance tasks and history, projects, contractors, a timeline of your home's history, and any AI-generated insights.

**Conversations**: the questions you ask the AI assistant and its answers.

**Household sharing info**: if you invite someone to your home, the invite link, the role you assign them, and (optionally) the email you associate with the invite as a display hint.

**Usage analytics**: first-party events about what you do in the app (e.g., "asked a question," "uploaded a file") so we can see what's working. This is our own analytics, not third-party ad tracking.

We do not collect data we don't need for the product to work. We don't run ads, and we don't have an ad pixel or third-party ad tracking on GatheredOS.

## 2. How we use it

- To store and organize your home's records and show them back to you.
- To extract structured data from documents/photos you upload (via AI — see Section 4).
- To identify known products from a scanned barcode or manufacturer part number.
- To answer questions you ask the AI assistant, grounded in your home's own records.
- To send you maintenance reminders and other in-product notifications.
- To operate household sharing, if you use it.
- To improve GatheredOS (aggregated or account-level usage patterns, not sold or shared).
- To keep the service secure and enforce rate limits against abuse.

## 3. Where it's stored

Your data lives in:

- **Supabase** — our database (Postgres) and file storage provider. Your account records and uploaded files are stored here, access-controlled so only members of your household can read your home's data.
- **Vercel** — hosts the GatheredOS web application.

## 4. AI processing (Anthropic)

When you upload a document/photo or ask the assistant a question, the relevant content (the document image/PDF, or your question plus the home records needed to answer it) is sent to **Anthropic** (maker of the Claude models) for processing. This is how GatheredOS reads your documents and answers your questions.

- Anthropic processes this data to return a result to GatheredOS; **per Anthropic's API terms, they do not use API data to train their models by default.**
- Only the data needed to complete the request is sent (e.g., the document being processed, or your home's records for a question) — not your entire account.
- We do not send your data to Anthropic for any purpose other than operating the features you're using.

**[FOUNDER: link Anthropic's current API/commercial terms here once finalized, in case their data-use policy is cited elsewhere in the app.]**

## 5. Other services we use (subprocessors)

| Service | What it's for | What it sees |
|---|---|---|
| Supabase | Database, auth, file storage | All account and home data |
| Vercel | Application hosting | Standard web request data |
| Anthropic | AI extraction + assistant | Uploaded documents/photos; questions + home records needed to answer them |
| Barcode Lookup (when configured) | Match a scanned product to a public catalog record | The barcode or manufacturer/model number only; not the uploaded image, receipt, address, serial number, or account identity |
| Mapbox | Address autocomplete during onboarding (when configured) | The partial address you're typing |
| RentCast | Public-records prefill (year built, sqft, beds, baths) during onboarding (when configured) | The address you enter |
| Photon (OpenStreetMap) | Keyless fallback address autocomplete, used only if Mapbox isn't configured | The partial address you're typing |

We don't sell your personal data to anyone, and we don't share it with data brokers or advertisers.

## 6. Your rights and controls

You can, at any time from Settings:

- **Export everything.** Download a full JSON copy of your account and every home you belong to — all records, files (via temporary download links), conversations, and more.
- **Delete your account.** This is self-serve and permanent. If you're the sole owner of a home, that home and everything in it (files, records, conversations) is erased. If you share a home with other owners, you're removed from it and the home continues for the remaining owners.

If you're in a jurisdiction with statutory privacy rights (e.g., **CCPA** in California, **GDPR** in the EU/UK), you additionally have the right to:

- Know what personal data we hold about you.
- Request a copy of it (use the export feature, or contact us).
- Request correction of inaccurate data.
- Request deletion (use account deletion, or contact us).
- Opt out of sale/sharing of personal data — not applicable here, as we don't sell or share it.

To exercise any of these, contact dougkvamme@gmail.com **[FOUNDER: replace with support@ once the domain exists]**.

## 7. Data retention

We keep your data as long as your account is active. If you delete your account, home records and files tied to homes you solely own are deleted immediately as part of that process. Some anonymized usage-analytics rows may persist without being linked to a home, for aggregate product metrics.

**[FOUNDER: confirm any backup-retention window — e.g., if Supabase backups retain deleted data for N days before full purge, disclose that here.]**

## 8. Children's privacy

GatheredOS is not directed at children, and we don't knowingly collect data from anyone under 18. **[FOUNDER: confirm minimum age policy — matches Terms of Service Section 2.]**

## 9. Security

We rely on Supabase's database-level access controls (row-level security scoped to your household) and standard transport encryption (HTTPS). No system is perfectly secure, and we can't guarantee absolute security of information transmitted to GatheredOS.

## 10. International users

GatheredOS is currently operated from and targeted at users in the United States. **[FOUNDER: confirm if you want to explicitly restrict to US users during beta, or state how EU/UK data transfers are handled if you accept international signups.]**

## 11. Changes to this policy

We may update this Privacy Policy as GatheredOS evolves. We'll post the updated version here with a new "Last updated" date, and for material changes we'll try to notify active users directly.

## 12. Contact

Questions about this policy or your data: dougkvamme@gmail.com **[FOUNDER: replace with support@ once the domain exists]**.

## 13. Governing law

This policy is governed by the laws of the State of New York, USA. **[FOUNDER: confirm this matches the jurisdiction chosen in the Terms of Service.]**

---

**Placeholder summary for founder review** — see the bullet list returned alongside this file.
