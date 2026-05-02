# Evaluation Results: HalalScan

Verified locally on May 2, 2026. Live Google Vision and RapidAPI keys were not required for these reproducible tests; no-key behavior is part of the tested fallback path.

## Summary

| Component | Dataset / Scope | Result |
|---|---:|---:|
| Canonical KR&R engine | 30 curated product cases | 30/30 correct, 100.0% accuracy |
| Local ML fallback | 36 holdout ingredient cases | 36/36 correct, 100.0% accuracy |
| Flask backend tests | Rules, certifiers, OCR fallback, API fallback, history, verdict regressions | 14/14 passing |
| Vercel API smoke tests | Health, rules, analyze verdicts, OCR fallback, history | Passing |
| TypeScript check | Frontend/serverless compile check | Passing |

## Rubric Evidence in the App

The Analysis result page exposes a **Rubric Evidence Logs** accordion with the four required implementation areas:

- **ML Implementation:** shows the RapidAPI Halal Food Checker provider, local TF-IDF Naive Bayes fallback, generated verdict, confidence, and ingredient classification count.
- **Knowledge Base Design:** shows the canonical 60-rule JSON knowledge base, triggered rule IDs, certifying-body status, and matched rule sources.
- **Reasoning Engine:** shows the deterministic priority order `HARAM > DOUBTFUL > UNKNOWN > HALAL`, selected verdict, rule-based status, and inference logic path.
- **System Integration:** shows the input mode, `/api/analyze` processing flow, final verdict, and integration trace across OCR/barcode/text, ML, KB, and reasoning layers.

The Knowledge Base page also displays each rule's status as a separate visible badge, so backend-loaded rules no longer depend on status text being embedded in the title.

## KR&R Evaluation

The KR&R evaluation uses the canonical backend knowledge base from `backend/data/halal_rules.json`, not the older small frontend keyword list. The dataset contains 30 products: 10 halal, 10 haram, and 10 mashbooh/requires-review cases.

| Class | Precision | Recall | F1 | Support |
|---|---:|---:|---:|---:|
| HALAL | 1.000 | 1.000 | 1.000 | 10 |
| HARAM | 1.000 | 1.000 | 1.000 | 10 |
| MASHBOOH | 1.000 | 1.000 | 1.000 | 10 |
| Macro average | 1.000 | 1.000 | 1.000 | 30 |
| Weighted average | 1.000 | 1.000 | 1.000 | 30 |

Confusion matrix:

| Actual \\ Predicted | HALAL | HARAM | MASHBOOH |
|---|---:|---:|---:|
| HALAL | 10 | 0 | 0 |
| HARAM | 0 | 10 | 0 |
| MASHBOOH | 0 | 0 | 10 |

Regression checks include missing ingredient text, exact E-number matching (`E-120` vs `E1200`), OCR-style Unicode hyphen normalization, pork derivatives, porcine gelatin, swine extract, bovine gelatin, animal shortening, and pork flavor overrides.

## Local ML Fallback Evaluation

RapidAPI Halal Food Checker is the primary ML classification layer in the submitted architecture. The local TF-IDF weighted Multinomial Naive Bayes model is retained only as a fallback and comparison artifact when live API access is unavailable.

Metadata:

| Field | Value |
|---|---:|
| Algorithm | TF-IDF weighted Multinomial Naive Bayes |
| Training samples | 58 |
| Vocabulary size | 508 |
| Feature types | Unigram, bigram, trigram |

Holdout metrics:

| Class | Precision | Recall | F1 | Support |
|---|---:|---:|---:|---:|
| HALAL | 1.000 | 1.000 | 1.000 | 10 |
| HARAM | 1.000 | 1.000 | 1.000 | 13 |
| MASHBOOH | 1.000 | 1.000 | 1.000 | 13 |
| Macro average | 1.000 | 1.000 | 1.000 | 36 |

Confusion matrix:

| Actual \\ Predicted | HALAL | HARAM | MASHBOOH |
|---|---:|---:|---:|
| HALAL | 10 | 0 | 0 |
| HARAM | 0 | 13 | 0 |
| MASHBOOH | 0 | 0 | 13 |

## Backend and API Validation

Run:

```bash
npm run lint
npm run evaluate
npm run test:backend
npm run test:vercel-api
npm run build
```

Backend tests validate:

- Knowledge base contains at least 50 rules and recognized bodies: JAKIM, MUI, IFANCA, HFA, ESMA.
- Every rule has required schema fields, a reason, and a source citation label.
- `E120`/carmine produces `NON-COMPLIANT`.
- `E1200` does not falsely trigger the `E120` rule.
- OCR-style Unicode hyphen E-numbers normalize correctly.
- Pork derivatives and alcohol force `NON-COMPLIANT`.
- Gelatin/natural flavors produce `REQUIRES REVIEW`.
- Missing or unrecognized certifying bodies produce `REQUIRES REVIEW`.
- Clean ingredients with recognized certification produce `HALAL COMPLIANT`.
- Google Vision and RapidAPI no-credential paths stay deterministic.
- SQLite history persists scan results.

## Live API Validation

Optional live validation requires:

```text
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
RAPIDAPI_KEY=your_key
```

Without these credentials, HalalScan still evaluates the knowledge base, marks live API status as unavailable, and keeps tests deterministic for classroom grading.
