# Grading Rubric Mapping Guide

| # | Rubric Item | Weight | Evidence | Revised Est. Score |
|---:|---|---:|---|---:|
| 1 | Project Proposal | 10% | Submitted DOCX remains authoritative; repo docs now match React + Flask + Google Vision + RapidAPI + KBR + SQLite architecture. | 9/10 |
| 2 | ML Model Implementation | 25% | RapidAPI Halal Food Checker is the primary API-based ML layer with status normalization and caching; local Naive Bayes is clearly labeled as fallback/comparison and evaluated on 36 holdout cases. The Analysis page now shows the ML provider, fallback model, verdict, confidence, and ingredient classification count. | 22/25 |
| 3 | Knowledge Base Design | 20% | Canonical `backend/data/halal_rules.json` contains 60 structured rules, E-number taxonomy, source labels, and JAKIM/MUI/IFANCA/HFA/ESMA certifier records. The Knowledge page displays status badges for backend-loaded rules, while Analysis shows triggered rule IDs and matched sources. | 19/20 |
| 4 | Reasoning Engine | 15% | Deterministic conflict priority `HARAM > DOUBTFUL > UNKNOWN > HALAL`; response exposes facts, matched rules, certification check, conflict resolution, and logic path. The Analysis page labels this explicitly under Reasoning Engine. | 14/15 |
| 5 | System Integration | 15% | `/api/analyze` combines OCR/barcode/text input, Open Food Facts, RapidAPI classification, KB lookup, certifier verification, history persistence, and explainable output. The Analysis page now shows the input mode and integration flow; Vercel adapter mirrors the Flask route behavior. | 14/15 |
| 6 | Technical Report & Presentation | 15% | Evaluation report includes metrics, confusion matrices, command evidence, rubric evidence logs, architecture and reasoning diagrams, limitations, and rubric mapping. | 13/15 |
|  | **Estimated Total** | **100%** | Stronger, proposal-aligned implementation and evidence package. | **91/100** |

## Evidence Commands

```bash
npm run lint
npm run evaluate
npm run test:backend
npm run test:vercel-api
npm run build
```

## Notes for Presentation

- Emphasize RapidAPI as the primary ML component, not Gemini.
- Emphasize the 60-rule canonical KB and explainable conflict resolution.
- Show the 30-case KR&R evaluation and 36-case fallback ML evaluation separately.
- State that live OCR/API credentials are optional for demo but not required for reproducible grading tests.
