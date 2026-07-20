# GatheredOS Scan Reliability Gate

This is the release gate for receipt, document, label, and item identification. The fixtures are synthetic and contain no customer data.

## Corpus

| Case | Evidence | Required outcome |
|---|---|---|
| Water-heater receipt | Vendor, model, total, date, warranty | Receipt classification and a grounded item/cost proposal |
| Furnace manual | Manufacturer, model, filter guidance | Manual classification and queued maintenance guidance |
| Water-heater warranty | Provider, term, expiry | Warranty classification, expiry record/reminder, reviewable contractor |
| Home inspection | Three findings including one high severity | Inspection classification, three tasks, recommended project |
| Furnace data plate | Manufacturer, model, serial | Photo classification and correct existing-item link or review suggestion |

## Thresholds

- Pipeline completion: 100%—a saved scan may never disappear into an unknown state.
- Document classification: 100% on the controlled corpus.
- Critical-field accuracy: at least 90% across expected manufacturer, model, serial, amount, date, term, and severity fields.
- Mean end-to-end processing time: no more than 30 seconds per case on the controlled corpus.
- New entities are always confirmed by the homeowner, regardless of model confidence.
- Claims below 0.50 confidence are dropped and measured; 0.50–0.85 enters review; 0.85+ may update an existing record.

Run `pnpm test:scan -- --fixtures-only` for the zero-cost fixture gate. Run `pnpm test:scan` before a release that changes capture, extraction prompts, confidence gates, or cascade logic; the full gate makes five real vision calls and cleans up its test data.

User feedback is recorded as `scan_feedback_submitted` with outcome, controlled reason, platform, extraction status, and whether barcode/OCR evidence was available. This makes failure clusters diagnosable without storing image contents in analytics.
