# Grading Rubric Mapping Guide

*This document explicitly maps the HalalScan codebase to the Introduction to Artificial Intelligence Systems Project Rubric to facilitate grading.*

| Deliverable | Description | HalalScan Implementation / File Path | Weight |
|-------------|-------------|---------------------------------------|--------|
| **Project Proposal** | Problem, dataset, AI approach | `docs/Project_Proposal.md` | 10% |
| **ML Model Implementation** | Training, evaluation | Implemented via integration with Google's LLM/LVM framework (Gemini 2.5 Flash). Handles unstructured input, OCR, and semantic parsing via prompt-engineered pipelines.<br>**Model File:** `src/utils/geminiApi.ts`<br>**Evaluation Dataset (30 products):** `src/utils/evaluationDataset.ts`<br>**Evaluation Engine (metrics):** `src/utils/evaluateModel.ts`<br>**Evaluation UI Page:** `src/pages/Evaluation.tsx`<br>**Evaluation Results:** `docs/Evaluation_Results.md` | 25% |
| **Knowledge Base Design** | Rules and logic | A structured symbolic database mapping strict dietary classifications (Halal, Haram, Mashbooh) with 60+ keyword triggers and 10 categorized rules covering ingredients, E-numbers, enzymes, beverages, cosmetics, and certification.<br>**Rules File:** `src/constants/halalRules.ts`<br>**Knowledge Base:** `KNOWLEDGE_BASE` in `src/utils/reasoningEngine.ts` | 20% |
| **Reasoning Engine** | Correct inference | A deterministic, multi-pass rule engine that traverses the knowledge base and escalates logical states (HALAL→MASHBOOH→HARAM) based on string-matching heuristics. Produces full logic-path audit trail.<br>**File:** `runRuleBasedInference()` in `src/utils/reasoningEngine.ts` | 15% |
| **System Integration** | ML + KR&R working together | The core consensus mechanism. It runs both engines in parallel and executes a veto-override if the probabilistic ML model conflicts with absolute KR&R logic.<br>**File:** `buildConsensus()` in `src/utils/systemIntegration.ts` | 15% |
| **Technical Report, Results and Presentation** | Architecture, results, limitations, presentation | `docs/Technical_Report.md` (with quantitative evaluation)<br>`docs/Evaluation_Results.md` (confusion matrix, per-class metrics)<br>`docs/Presentation_Outline.md` | 15% |
| **Total** | | | **100%** |

