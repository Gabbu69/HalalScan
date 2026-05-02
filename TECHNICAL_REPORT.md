# Technical Report: HalalScan DOCX-Compliant Architecture

## 1. System Architecture

HalalScan now uses the architecture specified in the proposal document:

1. **React frontend** for barcode scanning, label upload, OCR review, certifying-body input, results, rules, and history.
2. **Python Flask backend** as the primary `/api` service.
3. **Vercel TypeScript serverless adapter** with matching API behavior for deployed builds.
4. **Google Vision OCR** for product label images and first 5 PDF pages.
5. **RapidAPI Halal Food Checker** as the primary per-ingredient ML classification layer.
6. **Knowledge-Based Reasoning (KBR)** over a structured 60-rule halal knowledge base.
7. **SQLite storage** for local Flask scan history and cached RapidAPI ingredient classifications.

The previous Gemini/Tesseract/local Naive Bayes components remain available only as fallback support when the Flask backend or live credentials are unavailable.

## 2. Data Flow

User input follows this path:

`Image/PDF/Text/Barcode -> Google Vision or OpenFoodFacts -> RapidAPI Ingredient Classifier -> Knowledge Base Lookup -> Reasoning Engine -> Verdict -> SQLite History -> React Results`

The scanner accepts ingredient photos, PDFs, manual text, and barcodes. For image/PDF inputs, the frontend calls `POST /api/ocr`, shows editable extracted text, then submits the reviewed text to `POST /api/analyze`.

On Vercel, `api/*.ts` implements the same public routes. Serverless functions cannot persist SQLite on the platform, so Vercel scan history is maintained by frontend localStorage, while `/api/history` returns the current serverless-memory view.

## 3. Verdict Logic

The backend returns proposal-aligned verdict labels:

- `NON-COMPLIANT`: at least one ingredient is haram by RapidAPI or knowledge-base rule.
- `HALAL COMPLIANT`: all ingredients are clear and the certifying body is recognized.
- `REQUIRES REVIEW`: any ingredient is doubtful/unknown, or the certifying body is missing/unrecognized.

Recognized certifying bodies are JAKIM, MUI, IFANCA, HFA, and ESMA. The system does not claim to verify official certificate authenticity; it checks whether the named body is in the maintained trusted list.

## 4. Knowledge Base

The backend knowledge base is stored in `backend/data/halal_rules.json` and contains:

- Haram additive rules such as E120, E542, E904, and E920.
- Doubtful additive rules such as E441, E471-E477, E481-E483, E422, E470, and E570.
- Pork, blood, alcohol, animal enzyme, dairy, meat, seafood, plant, processing, and certification rules.
- Rule IDs, categories, statuses, reasons, keywords, E-number mappings, and sources.

The reasoning engine records a logic path and triggered rule IDs for explainability.

## 5. Evaluation

Implemented checks:

- `npm run lint`: TypeScript type checking.
- `npm run evaluate`: existing local ML/KR&R coursework evaluation.
- `npm run test:backend`: Flask tests covering rules, certification, OCR no-credential fallback, history, and verdict logic.
- `npm run test:vercel-api`: direct tests for Vercel serverless health, rules, OCR fallback, and the three verdict outcomes.

Backend tests use no live keys, so they are reproducible in a classroom environment. Live Google Vision and RapidAPI behavior can be smoke-tested after setting `GOOGLE_APPLICATION_CREDENTIALS` and `RAPIDAPI_KEY`.

## 6. Limitations

- Live OCR and RapidAPI classification require external credentials.
- Certifying-body verification is list-based, not an official certificate database lookup.
- The knowledge base is maintainable but still needs expert review for production use.
- Non-English labels may require OCR support plus translation before reliable ingredient reasoning.
