# Grading Rubric Mapping Guide

This document maps HalalScan to the Introduction to Artificial Intelligence Systems project rubric.

| Deliverable | Description | HalalScan implementation / evidence | Weight |
|-------------|-------------|--------------------------------------|--------|
| **Project Proposal** | Problem, dataset, AI approach | `docs/Project_Proposal.md` describes the halal ingredient screening problem, target users, data sources, and the neuro-symbolic AI approach. | 10% |
| **ML Model Implementation** | Training, evaluation | Gemini 2.5 Flash is used for OCR, semantic parsing, and natural-language recommendations through `src/utils/geminiApi.ts`. A local fallback ML model is implemented in `src/utils/mlModel.ts` using TF-IDF weighted Multinomial Naive Bayes with 48 labeled training samples and unigram/bigram/trigram features. The holdout evaluation in `src/utils/modelEvaluation.ts` tests 30 cases and reports accuracy, precision, recall, F1-score, and a confusion matrix. Run it with `npm run evaluate`. | 25% |
| **Knowledge Base Design** | Rules and logic | `src/constants/halalRules.ts` defines 15 domain rules and E-number categories. `KNOWLEDGE_BASE` in `src/utils/reasoningEngine.ts` adds 65 keyword triggers for pork derivatives, alcohol terms, enzymes, emulsifiers, flavorings, and doubtful animal-derived ingredients. Together with E-number categories, the system has 105 symbolic triggers. | 20% |
| **Reasoning Engine** | Correct inference | `runRuleBasedInference()` in `src/utils/reasoningEngine.ts` extracts facts, applies rule predicates, handles E-number normalization such as `E-120`, avoids substring false positives such as `E1200`, and resolves conflicts using `HARAM > MASHBOOH > HALAL`. It returns flags and a full logic-path trace. | 15% |
| **System Integration** | ML + KR&R working together | `buildConsensus()` in `src/utils/systemIntegration.ts` combines ML output with KR&R output. KR&R has veto priority: explicit HARAM rule matches override probabilistic ML predictions, and MASHBOOH warnings override ML HALAL predictions. The integrated result is displayed in `src/pages/Analysis.tsx` with architecture logs. | 15% |
| **Technical Report, Results and Presentation** | Architecture, results, limitations, presentation | `docs/Technical_Report.md`, `docs/Evaluation_Results.md`, and `docs/Presentation_Outline.md` document architecture, evaluation metrics, limitations, and presentation flow. | 15% |
| **Total** | | | **100%** |
