# Technical Report: HalalScan Neuro-Symbolic AI System

## 1. System Architecture

HalalScan is an end-to-end web application using a hybrid neuro-symbolic AI architecture. The system combines probabilistic machine learning with deterministic Knowledge Representation and Reasoning (KR&R) so ingredient analysis is both flexible and explainable.

### Architecture Components

1. **Frontend Interface (React/Vite)**
   Handles manual ingredient input, barcode scans, image uploads, scan history, evaluation dashboards, and architecture trace display.

2. **ML Layer**
   - **Gemini 2.5 Flash:** Used through Vercel serverless API routes for OCR, semantic parsing, and natural-language recommendations.
   - **Local fallback ML model:** `src/utils/mlModel.ts` implements a TF-IDF weighted Multinomial Naive Bayes classifier trained on 48 labeled ingredient samples. It uses unigram, bigram, and trigram features, producing a 434-feature vocabulary.

3. **Knowledge Base (`halalRules.ts` and `reasoningEngine.ts`)**
   Defines 15 halal-domain rules, E-number categories, and 65 keyword triggers covering pork derivatives, alcohol, insects/colorants, enzymes, emulsifiers, flavorings, and doubtful animal-derived ingredients.

4. **Reasoning Engine (`reasoningEngine.ts`)**
   Extracts facts from ingredients, applies symbolic rules, normalizes E-number variants such as `E-120`, avoids substring false positives such as `E1200`, and resolves conflicts using `HARAM > MASHBOOH > HALAL`.

5. **System Integration (`systemIntegration.ts`)**
   Combines ML predictions with KR&R results. Explicit KR&R violations override probabilistic ML output, which is essential for religious compliance where known forbidden ingredients cannot be treated as probabilistic suggestions.

## 2. Implementation Details

### 2.1 ML Model Implementation

The project has two ML paths:

- **Primary ML path:** Gemini analyzes text or images and returns structured JSON containing verdict, confidence, flagged ingredients, reason, and recommendation.
- **Offline fallback path:** If Gemini is unavailable, the local Naive Bayes classifier evaluates ingredient text. This prevents the app from becoming unusable when the external API fails.

The local model performs:

- text normalization;
- E-number normalization;
- unigram, bigram, and trigram feature extraction;
- TF-IDF feature weighting;
- Multinomial Naive Bayes classification;
- softmax confidence scoring;
- extraction of influencing terms for interpretability.

### 2.2 Knowledge Base Design

The knowledge base has two layers:

- `HALAL_RULES`: human-readable rule entries with ID, category, title, explanation, and source.
- `KNOWLEDGE_BASE` and `ENUMBERS_LIST`: machine-readable triggers used by the reasoning engine.

This separation supports both grading/reporting needs and executable inference.

### 2.3 Reasoning Engine

The rule engine uses a forward-chaining-style process:

1. Extract base facts from the ingredient string.
2. Apply E-number rules.
3. Apply HARAM keyword rules.
4. Apply MASHBOOH keyword rules.
5. Resolve conflicts with the priority order `HARAM > MASHBOOH > HALAL`.
6. Return a verdict, confidence, flags, and logic path.

### 2.4 System Integration

The integrated pipeline runs KR&R and ML, then applies consensus logic:

- If KR&R finds HARAM, final verdict becomes HARAM even if ML says HALAL.
- If KR&R finds MASHBOOH and ML says HALAL, final verdict becomes MASHBOOH.
- If both systems agree, the result is returned with architecture logs.

## 3. Results and Evaluation

### 3.1 Local ML Fallback Evaluation

Evaluation file: `src/utils/modelEvaluation.ts`

| Metric | Score |
|--------|-------|
| Accuracy | 100.0% (30/30) |
| Macro Avg F1 | 1.00 |
| Weighted Avg F1 | 1.00 |

### 3.2 KR&R Engine Evaluation

Evaluation file: `src/utils/evaluateModel.ts`

| Metric | Score |
|--------|-------|
| Accuracy | 100.0% (30/30) |
| Macro Avg F1 | 1.00 |
| Weighted Avg F1 | 1.00 |

#### KR&R Confusion Matrix

| Actual \ Predicted | HALAL | HARAM | MASHBOOH |
|--------------------|-------|-------|----------|
| **HALAL** | 10 | 0 | 0 |
| **HARAM** | 0 | 10 | 0 |
| **MASHBOOH** | 0 | 0 | 10 |

### 3.3 Key Fixes From Evaluation

The previous KR&R evaluation missed `prosciutto`, classifying it as HALAL. The knowledge base now includes additional pork-derived terms such as prosciutto, pancetta, guanciale, mortadella, coppa, speck, jamon, serrano ham, and chicharron.

The E-number matcher was also improved from substring matching to exact normalized matching. This means:

- `E-120` correctly matches the HARAM additive `E120`.
- `E1200` no longer accidentally matches `E120`.

## 4. Limitations and Future Work

- The evaluation datasets are balanced and useful for coursework, but still small. A stronger final version should include 100+ real products from scanned labels.
- The local ML model is intentionally lightweight. It is interpretable and offline-capable, but Gemini remains stronger for OCR, multilingual text, and semantic ambiguity.
- Certification logic exists as a knowledge-base rule, but actual halal-logo image recognition is not yet implemented.
- The rule engine is English-focused. Multilingual keyword dictionaries should be added for Malay, Arabic, Indonesian, and common imported-food terms.
- The knowledge base needs ongoing expert maintenance for new additives, new synonyms, and regional ingredient names.

## 5. Reproducibility

Run:

```bash
npm install
npm run evaluate
npm run lint
npm run build
```

The evaluation command prints local ML metrics and KR&R metrics, including confusion matrices and failed cases.
