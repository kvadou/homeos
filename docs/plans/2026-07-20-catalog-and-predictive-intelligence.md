# Catalog identity and predictive intelligence

## What runs today

GatheredOS's intelligence is event-driven and explainable:

1. A scan or document creates an extraction with source text, structured fields, confidence, and provenance.
2. Deterministic rules turn those fields into item updates, warranties, care history, maintenance tasks, timeline events, and candidate insights.
3. Claude Haiku reads documents and labels. Claude Sonnet is used only for bounded summaries and replacement-forecast wording over supplied facts and benchmark numbers.
4. The daily scheduled job advances warranty states, checks identified models against CPSC recalls, and sends eligible notifications.
5. The front end reads materialized, active `insights` rows. It does not invent insights while rendering.

The replacement forecast is currently a planning estimate, not a learned failure probability. It uses installation year, a recorded or benchmark lifespan, regional replacement-cost ranges, and remaining project budgets.

## Catalog resolver added in this phase

The ingestion path now supports exact product resolution without exposing the image or household data to a catalog provider:

- A UPC/EAN/GTIN is looked up before Claude vision.
- A manufacturer part number is looked up after OCR/vision extracts the model plate.
- Exact matches are cached in `catalog_products` and `catalog_identifiers`.
- The home-owned `items` row links to the canonical catalog product and records source/confidence.
- New items still require one explicit confirmation. Existing exact matches can be linked automatically under the normal confidence gate.
- Provider errors, missing credentials, and catalog misses fall back to the existing Claude-only path.

The initial provider adapter is Barcode Lookup because it supports both barcode and manufacturer-part-number queries. Configure it server-side with:

```text
BARCODE_LOOKUP_API_KEY
```

The provider interface is intentionally replaceable. Before committing to a long-term vendor, run a representative corpus of appliances, HVAC labels, tools, filters, fixtures, and receipt line items through competing providers and record exact-match rate, false-match rate, useful-field coverage, latency, cost, and redistribution terms.

## Moving toward predictive intelligence

### 1. Maintain an evidence ledger

Every prediction must point to evidence: catalog identity, installation date, receipt, warranty, manual, completed maintenance, service outcome, inspection finding, recall, weather exposure, or an explicitly labeled benchmark. Preserve event time, source, and confidence.

### 2. Compute versioned item features

Build a scheduled `item_feature_snapshots` layer with values such as:

- age and age-to-expected-life ratio;
- maintenance adherence and overdue-task count;
- repair frequency, recency, and rolling repair cost;
- warranty state and recall state;
- product family, manufacturer, and model generation;
- climate exposure appropriate to the system;
- data completeness and evidence freshness.

Feature definitions must be versioned so an old prediction can be reproduced.

### 3. Start with calibrated, transparent scores

Before there is enough outcome data for machine learning, use deterministic or Bayesian scores with explicit bands:

- `monitor`: routine care, no adverse signals;
- `watch`: late-life or maintenance drift;
- `plan`: late-life plus repairs/cost trend;
- `act`: verified safety, recall, leak, or failure evidence.

The model should produce a probability range and contributing factors, not a fake precise failure date.

### 4. Learn only from confirmed outcomes

Capture replacement dates, failures, repairs, final service costs, accepted/rejected insights, and “still operating” observations. These censored and completed outcomes can later support survival models by product family and model cohort. A Weibull or Cox-style survival model is a better first fit than a generative model for time-to-failure; boosted models can follow when the dataset is large enough.

### 5. Materialize and supersede insights

Scheduled scoring should upsert stable insight keys such as `health:<item>:<model-version>` and dismiss or supersede stale claims when inputs change. The front end should show:

- what changed;
- why the insight appeared;
- evidence and confidence;
- the recommended next action;
- whether it is a known fact, rule-based estimate, or learned prediction.

### 6. Close the feedback loop

User confirmation and real service outcomes become calibration data. Measure precision, false-alert rate, lead time, action rate, and cost avoided. Do not train across private document contents; derive de-identified, minimum-necessary features and preserve a deletion path back to the source home.

## Near-term delivery order

1. Benchmark catalog providers and activate the selected API key.
2. Add product/model reference fields that improve lifespan, manuals, parts, energy, and recall coverage.
3. Add versioned item feature snapshots and an explainable health-score job.
4. Add insight supersession, evidence display, and user feedback.
5. Collect confirmed outcomes before training cohort survival models.
