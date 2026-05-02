# HalalScan Project Proposal Progress Report

**Project Title:** HalalScan: A Hybrid Machine Learning and Knowledge-Based Reasoning System for Halal Certification Verification  
**Course:** Artificial Intelligence  
**Prepared by:** Paclibar, Edgardo Gabriel L.; Nebrija, Ryan; Ibrahim, Joseph  
**Program:** Bachelor of Science in Computer Science  
**Date:** May 2, 2026

## 1. Executive Summary

HalalScan is an AI-assisted web application that helps users evaluate whether packaged food products are halal-compliant, non-compliant, or require further review. The system addresses a real consumer problem: many food labels contain unfamiliar ingredients, E-numbers, animal-derived additives, alcohol-based flavorings, and unclear halal certification marks. These details are difficult to verify manually, especially when consumers do not have food chemistry or halal certification knowledge.

The project uses a hybrid artificial intelligence design. Machine learning support is used for ingredient classification through the Halal Food Checker API via RapidAPI, while knowledge-based reasoning is used to enforce explicit halal rules from a structured rule base. A local TF-IDF weighted Multinomial Naive Bayes classifier is also included as an offline fallback and evaluation artifact. The final verdict is produced by combining machine learning output, knowledge base rule matches, certifying-body validation, and deterministic conflict resolution.

Current progress is strong and demonstrable. The React frontend, Flask backend, Vercel-compatible API adapter, canonical 60-rule knowledge base, reasoning engine, evaluation page, history persistence, and report evidence are already implemented. The app exposes rubric evidence directly in the user interface through a "Rubric Evidence Logs" section, making the ML Implementation, Knowledge Base Design, Reasoning Engine, and System Integration components visible during demonstration.

## 2. Project Background and Problem

Halal food verification is important for Muslim consumers because food permissibility depends not only on the visible product name, but also on ingredient sources, additives, processing methods, and certifying authorities. A product may appear harmless while containing doubtful or non-compliant ingredients such as pork gelatin, carmine, alcohol flavoring, lard, animal enzymes, or source-dependent emulsifiers.

Existing approaches often require users to search manually, rely on incomplete barcode databases, or trust certification logos without verification. This is slow and inconsistent. Some users may not know that E120 refers to carmine, that E471 can be source-dependent, or that gelatin may be halal, haram, or doubtful depending on its origin.

HalalScan responds to this problem by giving users a single workflow:

1. Scan or upload a product label image, scan a barcode, or paste ingredient text.
2. Extract or collect ingredient information.
3. Classify ingredients using an ML-backed ingredient checker and local fallback model.
4. Match ingredients against a maintained halal knowledge base.
5. Apply reasoning rules to produce a transparent final verdict.
6. Show flagged ingredients, matched rules, confidence, recommendation, and explanation logs.

## 3. Project Objectives

The general objective is to design, implement, and evaluate an AI-powered halal verification system that combines machine learning and knowledge-based reasoning to support explainable halal compliance screening for packaged food products.

Specific objectives and current progress are:

| Objective | Current Progress |
|---|---|
| Build a user-facing scanning and analysis app | Implemented in React with scanner, manual text, image, knowledge base, evaluation, history, and result views. |
| Integrate OCR and barcode workflows | Implemented through Google Vision-compatible OCR endpoint and Open Food Facts barcode lookup. Optional-key fallback is supported. |
| Implement an ML classification layer | Implemented through RapidAPI Halal Food Checker integration, status normalization, caching, and local Naive Bayes fallback. |
| Design a halal knowledge base | Implemented as a canonical JSON rule base with 60 rules, E-number taxonomy, keyword matching, reasons, sources, and certifying bodies. |
| Build a reasoning engine | Implemented with deterministic priority logic: HARAM > DOUBTFUL > UNKNOWN > HALAL. |
| Integrate all components | Implemented through `/api/analyze`, frontend analysis flow, backend Flask routes, Vercel API adapter, and SQLite history. |
| Evaluate progress and output | Implemented with reproducible evaluation scripts, backend tests, serverless smoke tests, and build validation. |

## 4. Proposed Solution

HalalScan is designed as a hybrid AI system instead of a pure machine learning classifier. A pure model could classify ingredients, but it may not explain decisions clearly or enforce strict halal rules. A pure rule-based system could be transparent, but it may lack flexibility when ingredients are phrased differently or when an external classifier can provide additional context.

The chosen solution combines both:

- **Machine Learning Implementation:** RapidAPI Halal Food Checker is the primary ingredient classification layer. The local TF-IDF Naive Bayes model provides fallback classification and coursework evaluation evidence.
- **Knowledge Base Design:** A canonical JSON knowledge base stores halal, haram, doubtful, unknown, and informational rules with E-numbers, keywords, sources, reasons, and certifying bodies.
- **Reasoning Engine:** The system applies deterministic rules to merge ML and knowledge-base outputs. HARAM findings override all lower-risk classifications.
- **System Integration:** React, Flask, Vercel serverless APIs, OCR, Open Food Facts, RapidAPI, the knowledge base, and SQLite history work together in one app.

Final user-facing verdicts are:

- `HALAL COMPLIANT`
- `NON-COMPLIANT`
- `REQUIRES REVIEW`

## 5. Current System Architecture

The implemented architecture follows the submitted proposal:

```text
User input
  -> React frontend
  -> OCR, barcode lookup, or manual ingredients
  -> /api/analyze
  -> Open Food Facts lookup when barcode data is needed
  -> RapidAPI Halal Food Checker when configured
  -> Canonical halal knowledge base
  -> Reasoning engine and conflict resolution
  -> SQLite/serverless history
  -> Explainable result page
```

The frontend is responsible for the user experience: scanning, uploading, entering ingredient text, viewing analysis results, browsing rules, running evaluation, and reviewing history. The backend and API adapter are responsible for data collection, classification, rule lookup, reasoning, and persistence.

Important public routes remain stable:

| Route | Purpose |
|---|---|
| `POST /api/analyze` | Main product, ingredient, image-text, and barcode analysis route. |
| `POST /api/ocr` | OCR route for label text extraction. |
| `GET /api/rules` | Exposes canonical knowledge-base rules and certifying bodies. |
| `GET /api/history` | Returns saved scan history. |
| `GET /api/health` | Reports service health and configuration status. |

## 6. Machine Learning Implementation Progress

The main ML layer is an API-based ingredient classification approach using the Halal Food Checker via RapidAPI. This is aligned with the project proposal because a live halal ingredient classifier is more feasible than training a large production model from scratch within the project timeline.

Implemented ML features include:

- Per-ingredient classification through RapidAPI when `RAPIDAPI_KEY` is configured.
- Status normalization into system labels such as HALAL, HARAM, DOUBTFUL, UNKNOWN, and UNAVAILABLE.
- Caching for repeated ingredient checks.
- Deterministic no-key behavior, so the app remains demo-ready even without external credentials.
- Local TF-IDF weighted Multinomial Naive Bayes fallback model.
- Training data for HALAL, HARAM, and MASHBOOH labels.
- Holdout evaluation with confusion matrix, precision, recall, F1-score, and accuracy.

The fallback model currently reports:

| Item | Value |
|---|---:|
| Algorithm | TF-IDF weighted Multinomial Naive Bayes |
| Training samples | 58 |
| Vocabulary size | 508 |
| Feature types | Unigram, bigram, trigram |
| Holdout test cases | 36 |
| Holdout accuracy | 36/36, 100.0% |

In the app, the Analysis page now displays ML evidence under **ML Implementation**, including the provider, fallback model, generated verdict, confidence, ingredient classification count, and optional-key mode.

## 7. Knowledge Base Design Progress

The knowledge base is the rule-driven core of HalalScan. It is stored in `backend/data/halal_rules.json` and is shared by the backend and frontend views. This prevents the app from having separate or conflicting rule lists.

The current knowledge base includes:

- 60 structured halal rules.
- Categories covering additives, pork, alcohol, animal sources, dairy, meat, seafood, plant ingredients, processing, and certification.
- E-number rules for additives such as E120, E441, E471-E477, E481-E483, E542, E904, and E920.
- Keyword matching for ingredient names such as pork, lard, gelatin, carmine, shellac, alcohol, rennet, whey, tallow, and natural flavors.
- Source and reason fields for explainability.
- Recognized certifying bodies: JAKIM, MUI, IFANCA, HFA, and ESMA.

Each rule record follows the same basic schema:

```text
id, category, title, status, e_numbers, keywords, reason, source
```

The Knowledge Base page has been improved so each backend-loaded rule shows a visible status badge. This makes HARAM, DOUBTFUL, UNKNOWN, HALAL, and INFO rules clear without depending on status text inside the rule title.

## 8. Reasoning Engine Progress

The reasoning engine is responsible for producing the final decision. It does not simply copy the ML result. Instead, it merges machine learning output with knowledge-base matches and certification checks.

The implemented reasoning priority is:

```text
HARAM > DOUBTFUL > UNKNOWN > HALAL
```

This means:

- If any ingredient is HARAM, the final verdict becomes `NON-COMPLIANT`.
- If no HARAM ingredient exists but an ingredient is DOUBTFUL or UNKNOWN, the final verdict becomes `REQUIRES REVIEW`.
- If all ingredients are clear and the certifying body is recognized, the verdict becomes `HALAL COMPLIANT`.
- If the certifying body is missing or unrecognized, the product is routed to review even if the ingredients appear clear.

The reasoning engine also produces a trace. The output includes extracted facts, matched rule IDs, certification status, conflict resolution, final verdict, flagged ingredients, and a logic path. This supports explainability, which is important for the AI systems rubric.

## 9. System Integration Progress

System integration is already working across the major components:

- React frontend collects image, barcode, and manual text input.
- OCR route supports Google Vision-compatible extraction when credentials exist and deterministic fallback when they do not.
- Barcode analysis can use Open Food Facts to retrieve product metadata and ingredients.
- Analysis route combines product data, ingredient text, ML classification, knowledge-base lookup, certifier verification, and reasoning.
- Results are returned with final verdict, confidence, recommendation, flagged ingredients, per-ingredient classification, triggered rules, and architecture details.
- Scan history is stored locally through SQLite in the Flask backend and through serverless memory for the Vercel adapter.
- The frontend result page displays the verdict and rubric evidence logs.

The integration is intentionally optional-key friendly. Live APIs can be used during a full demo, but grading tests and classroom demonstrations do not fail if Google Vision or RapidAPI credentials are unavailable.

## 10. Evaluation and Testing Progress

The project includes reproducible validation commands:

```bash
npm run lint
npm run evaluate
npm run test:backend
npm run test:vercel-api
npm run build
```

Current reported results:

| Check | Result |
|---|---:|
| TypeScript check | Passing |
| Canonical KR&R evaluation | 30/30 correct, 100.0% accuracy |
| Local ML fallback evaluation | 36/36 correct, 100.0% accuracy |
| Flask backend tests | 14/14 passing |
| Vercel API smoke tests | Passing |
| Production build | Passing with existing large chunk warning |

The backend tests validate important behavior such as:

- Knowledge base size and required schema fields.
- Recognized certifying bodies.
- E120/carmine as non-compliant.
- E1200 not falsely matching E120.
- OCR-style Unicode hyphen normalization.
- Pork derivatives and alcohol forcing non-compliance.
- Gelatin and natural flavors requiring review.
- Missing or unrecognized certifying body requiring review.
- Clean ingredients with recognized certification becoming halal compliant.
- Deterministic no-credential behavior.
- Scan history persistence.

## 11. Current Output and Demonstrable Features

The project currently produces a functional web application and supporting documentation. Demonstrable outputs include:

- Product analysis result with final halal verdict.
- Per-ingredient classification table.
- Flagged ingredients and recommendation.
- Certification check.
- Knowledge-base browser with status badges and source labels.
- Evaluation page with KR&R and local ML metrics.
- History page for previous scans.
- API routes for rules, health, OCR, analysis, and history.
- Technical report, rubric mapping, evaluation results, and this progress report.

The most important grading evidence is visible in the Analysis page accordion named **Rubric Evidence Logs**. It separates the project into the same core components used by the rubric:

1. ML Implementation
2. Knowledge Base Design
3. Reasoning Engine
4. System Integration

## 12. Limitations

The current system is suitable for academic demonstration, but it has limitations:

- Live Google Vision and RapidAPI calls require external credentials.
- Certifying-body verification checks a maintained list but does not authenticate certificates against official government databases.
- The knowledge base should be reviewed by qualified halal authorities before real-world production use.
- Non-English labels may require translation before accurate ingredient reasoning.
- Halal rulings can vary by school of law, so doubtful cases are routed to review instead of being forced into a single answer.
- The local ML fallback is intentionally small and should not be treated as a production-grade classifier.

## 13. Remaining Work

Recommended next steps are:

1. Add more real product label test cases from local stores.
2. Add screenshots of the Analysis, Knowledge, Evaluation, and History pages to the final report or presentation.
3. Configure live Google Vision and RapidAPI credentials for a full demo environment.
4. Add more certifying bodies relevant to the Philippines and Southeast Asia.
5. Improve non-English ingredient handling.
6. Optimize frontend bundle size if deployment performance becomes a grading concern.
7. Ask a halal subject-matter reviewer to inspect the rule base before claiming real-world authority.

## 14. Conclusion

HalalScan has progressed from proposal into a working hybrid AI application. It demonstrates machine learning integration, structured knowledge-base design, deterministic reasoning, and end-to-end system integration. The current output is not only functional but also explainable: users can see why a verdict was produced, which ingredients were flagged, which rules were triggered, and how the system combined ML and rule-based reasoning.

The project is ready to be presented as a strong progress output for an Artificial Intelligence Systems course. It includes the main app, documented architecture, evaluation evidence, and rubric-aligned demonstrations.

## Appendix A: Evidence Files

| Evidence | Location |
|---|---|
| Proposal summary | `docs/Project_Proposal.md` |
| Technical report | `docs/Technical_Report.md` |
| Evaluation results | `docs/Evaluation_Results.md` |
| Rubric mapping | `docs/Rubric_Mapping.md` |
| Canonical knowledge base | `backend/data/halal_rules.json` |
| Frontend reasoning fallback | `src/utils/reasoningEngine.ts` |
| Local ML fallback | `src/utils/mlModel.ts` |
| System integration layer | `src/utils/systemIntegration.ts` |
| Backend analysis engine | `backend/analysis.py` |
| Vercel analysis adapter | `api/_halalscan.ts` |
| Backend tests | `backend/tests/test_app.py` |

