# Grading Rubric Mapping Guide

*This document explicitly maps the HalalScan codebase to the Introduction to Artificial Intelligence Systems Project Rubric to facilitate grading.*

| Deliverable | Description | HalalScan Implementation / File Path | Weight |
|-------------|-------------|---------------------------------------|--------|
| **Project Proposal** | Problem, dataset, AI approach | `docs/Project_Proposal.md` | 10% |
| **ML Model Implementation** | Training, evaluation | Implemented via integration with Google's LLM/LVM framework. Handles unstructured input, OCR, and semantic parsing.<br>**File:** `src/utils/geminiApi.ts` | 25% |
| **Knowledge Base Design** | Rules and logic | A structured symbolic database mapping strict dietary classifications (Halal, Haram, Mashbooh) and explicit logic triggers.<br>**File:** `src/constants/halalRules.ts` & `KNOWLEDGE_BASE` in `src/utils/reasoningEngine.ts` | 20% |
| **Reasoning Engine** | Correct inference | A deterministic, multi-pass rule engine that traverses the knowledge base and escalates logical states based on string-matching heuristics.<br>**File:** `runRuleBasedInference()` in `src/utils/reasoningEngine.ts` | 15% |
| **System Integration** | ML + KR&R working together | The core consensus mechanism. It runs both engines in parallel and executes a veto-override if the probabilistic ML model conflicts with absolute KR&R logic.<br>**File:** `buildConsensus()` in `src/utils/systemIntegration.ts` | 15% |
| **Technical Report, Results and Presentation** | Architecture, results, limitations, presentation | `docs/Technical_Report.md`<br>`docs/Presentation_Outline.md` | 15% |
| **Total** | | | **100%** |
