# HalalScan

HalalScan is a React + Flask web application for halal compliance screening. It follows the DOCX proposal architecture: Google Vision extracts label text, RapidAPI Halal Food Checker classifies ingredients, and a knowledge-based reasoning engine applies strict halal rules before returning a final verdict.

## Current Architecture

- **Frontend**: React 19, Vite, Tailwind CSS, Zustand, `html5-qrcode`.
- **Backend**: Python Flask API on `localhost:5000`.
- **Vercel Adapter**: TypeScript serverless routes mirror the Flask analysis logic for deployed builds.
- **OCR**: Google Vision `DOCUMENT_TEXT_DETECTION` for images and first 5 PDF pages.
- **ML Classification**: Halal Food Checker through RapidAPI, cached in SQLite.
- **Knowledge Base**: 60 structured rules plus recognized certifying bodies: JAKIM, MUI, IFANCA, HFA, and ESMA.
- **Storage**: SQLite for scan history and ingredient classification cache.
- **Fallbacks**: Existing Gemini/Tesseract/local Naive Bayes paths remain as optional local fallback support.

## Verdict Model

- `NON-COMPLIANT`: any ingredient is haram by API or knowledge-base rule.
- `HALAL COMPLIANT`: all ingredients are clear and the certifying body is recognized.
- `REQUIRES REVIEW`: any ingredient is doubtful/unknown, or the certifying body is missing/unrecognized.

## Setup

Install Node dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
python -m pip install -r backend/requirements.txt
```

Copy `.env.example` to `.env` and configure live API credentials when available:

```text
GOOGLE_APPLICATION_CREDENTIALS=C:/path/to/google-vision-service-account.json
RAPIDAPI_KEY=your_rapidapi_key
```

Live credentials are optional for local tests. Without them, OCR and RapidAPI calls skip or fallback cleanly.

## Run Locally

Start Flask:

```bash
npm run backend
```

Start React in another terminal:

```bash
npm run dev
```

Vite proxies `/api/*` to `http://localhost:5000`.

## Vercel Deployment

The deployed app uses `api/*.ts` serverless routes, so it does not need a long-running Flask server on Vercel. These routes expose the same public API shape:

- `api/analyze.ts`: DOCX verdict logic, RapidAPI classification, OpenFoodFacts lookup, KB reasoning.
- `api/ocr.ts`: Google Vision REST OCR when Vercel service-account env vars are configured.
- `api/rules.ts`: 60-rule knowledge base.
- `api/history.ts`: serverless-memory response; the frontend also persists scan history in localStorage.

Set these Vercel environment variables for live external services:

```text
RAPIDAPI_KEY=your_rapidapi_key
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
```

If Google Vision is not configured, image scans still fall back to browser OCR for images. If RapidAPI is not configured, the knowledge base still performs deterministic reasoning and marks unresolved ingredients for review.

## Tests

```bash
npm run lint
npm run evaluate
npm run test:backend
npm run test:vercel-api
```

`npm run test:backend` uses mocked/no-credential paths for Google Vision, RapidAPI, OpenFoodFacts, and SQLite behavior.

## Main API

- `POST /api/ocr`: label image/PDF OCR through Google Vision, with graceful no-credential fallback.
- `POST /api/analyze`: barcode/text/OCR analysis with RapidAPI + knowledge-base reasoning.
- `GET /api/rules`: current knowledge base and recognized certifying bodies.
- `GET /api/history`: SQLite-backed scan history.
