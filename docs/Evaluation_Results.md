# Evaluation Results: HalalScan

## Backend Compliance Tests

The Flask backend test suite validates the DOCX-aligned behavior without requiring live credentials:

- Rule count is at least 50.
- Recognized certifying bodies include JAKIM, MUI, IFANCA, HFA, and ESMA.
- E120/carmine produces `NON-COMPLIANT`.
- Clear ingredients with recognized certification produce `HALAL COMPLIANT`.
- Missing or unrecognized certifying bodies produce `REQUIRES REVIEW`.
- Gelatin/natural flavors produce `REQUIRES REVIEW`.
- Missing ingredient text produces `REQUIRES REVIEW`.
- Google Vision OCR skips cleanly when credentials are not configured.
- SQLite history persists scan results.

Run:

```bash
npm run test:backend
```

## Existing Local Model Evaluation

The previous local evaluation remains available for coursework evidence and fallback validation:

```bash
npm run evaluate
```

It reports the local Naive Bayes fallback metadata, holdout results, KR&R dataset results, and edge-case regression checks. This is no longer the primary DOCX architecture; it is retained as a fallback and comparison layer.

## Live API Validation

Live Google Vision and RapidAPI validation requires:

```text
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
RAPIDAPI_KEY=your_key
```

When those variables are absent, tests remain deterministic and the app falls back or marks unresolved inputs for review.

## Vercel Serverless Validation

Run:

```bash
npm run test:vercel-api
```

This directly invokes the Vercel route handlers and verifies:

- `/api/health` exposes rule/API configuration.
- `/api/rules` returns at least 50 rules.
- `/api/analyze` returns all three proposal verdicts.
- `/api/ocr` returns a clean Google Vision unavailable response when credentials are absent.
- `/api/history` responds in the serverless adapter.
