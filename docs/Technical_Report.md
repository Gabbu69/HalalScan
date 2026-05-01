# Technical Report: HalalScan DOCX-Compliant Architecture

HalalScan now follows the submitted DOCX proposal: React frontend, Python Flask backend, Google Vision OCR, RapidAPI Halal Food Checker, a 60-rule knowledge base, certifying-body verification, and SQLite storage.

## Architecture

- React/Vite frontend calls Flask through `/api/*`.
- Flask exposes `/api/ocr`, `/api/analyze`, `/api/rules`, and `/api/history`.
- Vercel deployment uses matching TypeScript serverless routes in `api/*.ts`, so the deployed app does not require a long-running Flask process.
- Google Vision is the primary OCR engine for images and the first 5 PDF pages.
- RapidAPI Halal Food Checker is the primary ML classification layer.
- Knowledge-based reasoning applies deterministic halal rules and certifying-body checks.
- SQLite stores scan history and cached ingredient classifications.

## Verdicts

- `NON-COMPLIANT`: any haram ingredient from API or KB.
- `HALAL COMPLIANT`: all ingredients clear and certifying body recognized.
- `REQUIRES REVIEW`: doubtful/unknown ingredient, missing certifier, or unrecognized certifier.

Recognized bodies: JAKIM, MUI, IFANCA, HFA, ESMA.

## Evidence

- `backend/data/halal_rules.json`: 60 rules and recognized-body records.
- `backend/app.py`: Flask API.
- `backend/analysis.py`: integration and verdict logic.
- `backend/ocr.py`: Google Vision image/PDF OCR path.
- `backend/rapidapi_client.py`: RapidAPI client and SQLite cache.
- `backend/tests/test_app.py`: mocked backend tests.
- `api/_halalscan.ts`: Vercel serverless adapter for the same ML + KBR + SI behavior.

## Tests

Run:

```bash
npm run lint
npm run evaluate
npm run test:backend
npm run test:vercel-api
```

Live API credentials are optional for tests and required only for live Google Vision/RapidAPI calls.
