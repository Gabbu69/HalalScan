# Submission Checklist

## Links

- GitHub: https://github.com/Gabbu69/HalalScan
- Vercel: https://halal-scan-seven.vercel.app

## Required Commands

Run before submission:

```bash
npm run lint
npm run evaluate
npm run test:backend
npm run test:vercel-api
npm run test:badges
npm run build
```

`npm run test:badges` launches a local Chromium/Puppeteer browser with an extended Windows timeout. If it fails before reaching the app because Chrome cannot launch on the machine, rerun it after closing other browser instances; the API/backend tests and production build remain the primary non-visual checks.

## Optional Environment Variables

Live external services are optional for reproducible grading tests.

```text
RAPIDAPI_KEY=your_rapidapi_key
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
GEMINI_API_KEY=your_gemini_key
```

Without these keys:

- Google Vision returns a graceful unavailable/fallback response.
- RapidAPI ingredient calls are marked `UNAVAILABLE`.
- The deterministic knowledge base and reasoning engine still run.
- Chat RAG can return rule-based answers without Gemini.

## Rubric Evidence Map

| Rubric item | Evidence |
|---|---|
| Project Proposal | `PROPOSAL.md`, `docs/Project_Proposal.md`, `README.md` |
| ML Model Implementation | RapidAPI path in `/api/analyze`, local Naive Bayes fallback, `npm run evaluate` |
| Knowledge Base Design | `backend/data/halal_rules.json`, Knowledge page filters, `/api/rules` |
| Reasoning Engine | `architectureDetails.krrAnalysis`, conflict priority, "Why This Result?" |
| System Integration | OCR/barcode/text flow through `/api/analyze`, Flask + Vercel parity tests |
| Technical Report & Presentation | `TECHNICAL_REPORT.md`, `docs/Technical_Report.md`, `docs/Demo_Script.md`, screenshots |

## Demo Inputs

| Case | Ingredients | Certifier | Expected |
|---|---|---|---|
| Halal | `rice, sunflower oil, sea salt` | `JAKIM` | `HALAL COMPLIANT` |
| Haram | `sugar, E120, vanilla` | `JAKIM` | `NON-COMPLIANT` |
| Halal with ingredient warnings | `sugar, gelatin, natural flavors` | `IFANCA` | `HALAL COMPLIANT` with `DOUBTFUL` ingredient rows |

## Screenshot Checklist

Expected files:

- `docs/screenshots/01-scanner-manual-input.png`
- `docs/screenshots/02-analysis-why-result.png`
- `docs/screenshots/03-rubric-evidence-logs.png`
- `docs/screenshots/04-knowledge-filters.png`
- `docs/screenshots/05-evaluation-page.png`
- `docs/screenshots/06-rag-chat-e120.png`
- `docs/screenshots/07-history-binary-badges.png`

## Final Notes

- Do not present RAG as the final verdict engine.
- Explain that `/api/analyze` is the final product decision path.
- State that 100% evaluation accuracy is from curated classroom datasets and regression tests.
- State that product badges are binary (`HALAL` or `HARAM`); `DOUBTFUL` and `UNKNOWN` remain ingredient-level evidence only.
