# Evaluation Results: HalalScan AI System

## 1. Overview

HalalScan is evaluated as a hybrid neuro-symbolic system:

- **Local ML fallback model:** TF-IDF weighted Multinomial Naive Bayes for offline text classification.
- **KR&R engine:** deterministic rule-based inference over the halal knowledge base.
- **Integrated system:** Gemini handles OCR/semantic parsing, while KR&R provides strict rule vetoes for known HARAM and MASHBOOH ingredients.

## 2. Local ML Fallback Evaluation

The local fallback model in `src/utils/mlModel.ts` is trained on **58 labeled ingredient samples** across HALAL, HARAM, and MASHBOOH classes. It uses unigram, bigram, and trigram features, producing a vocabulary of **508 weighted features**.

Evaluation is implemented in `src/utils/modelEvaluation.ts` with a 36-case holdout set plus edge-case regression checks in `test_ml.ts`.

| Metric | Value |
|--------|-------|
| **Accuracy** | 100.0% (36/36) |
| **Macro-Average F1** | 1.00 |
| **Weighted-Average F1** | 1.00 |

### Local ML Confusion Matrix

```
                 Predicted
              HALAL  HARAM  MASHBOOH
Actual HALAL  [ 10     0       0   ]
       HARAM  [  0    13       0   ]
    MASHBOOH  [  0     0      13   ]
```

## 3. KR&R Engine Evaluation

The KR&R engine is evaluated independently against `src/utils/evaluationDataset.ts`, a curated dataset of **30 consumer products** with balanced class distribution:

| Class | Count | Examples |
|-------|-------|----------|
| HALAL | 10 | Rice crackers, orange juice, olive oil, canned tuna, peanut butter |
| HARAM | 10 | Pork sausage, bacon chips, tiramisu with rum, wine dressing, prosciutto |
| MASHBOOH | 10 | Gummy bears, cheese crackers, marshmallows, protein bars |

| Metric | Value |
|--------|-------|
| **Accuracy** | 100.0% (30/30) |
| **Macro-Average F1** | 1.00 |
| **Weighted-Average F1** | 1.00 |

### KR&R Confusion Matrix

```
                 Predicted
              HALAL  HARAM  MASHBOOH
Actual HALAL  [ 10     0       0   ]
       HARAM  [  0    10       0   ]
    MASHBOOH  [  0     0      10   ]
```

### KR&R Improvements

The rule engine now catches the previous false negative on **prosciutto** by expanding pork-derived keyword coverage. It also catches `pig`, `swine`, `porcine`, `boar`, pork stock/broth/flavor terms, and treats missing ingredient placeholders as MASHBOOH. It normalizes E-number variants such as `E-120` and avoids substring false positives such as matching `E120` inside `E1200`.

Additional regression checks verify:

- `No ingredients listed` -> MASHBOOH
- `pig fat`, `porcine gelatin`, `swine extract` -> HARAM
- `beef gelatin`, `bovine gelatin`, `animal shortening` -> MASHBOOH
- `E-120` -> HARAM, while `E1200` is not falsely flagged as E120

## 4. Why the Hybrid Architecture Matters

| Scenario | KR&R Alone | ML Alone | Hybrid ML + KR&R |
|----------|------------|----------|------------------|
| Product contains pork, bacon, ham, or prosciutto | Caught by explicit rules | Usually caught | Caught, with KR&R veto if ML disagrees |
| Product contains E120 or E-120 | Caught by normalized E-number rules | May depend on model context | Always caught by KR&R veto |
| Product contains vague enzymes or emulsifiers | Marked MASHBOOH if in KB | Often caught semantically | Dual confirmation |
| Label image is noisy or multilingual | Limited without OCR/translation | Stronger OCR/semantic handling | ML extracts text, KR&R verifies known rules |
| Novel additive not in KB | May be missed | May infer risk from context | ML reduces coverage gap, KR&R keeps hard constraints |

## 5. How to Reproduce

Run:

```bash
npm run evaluate
```

This prints:

- Local ML model metadata
- Local ML smoke-test predictions
- Local ML holdout metrics
- KR&R rule-engine metrics

## 6. Limitations

- The 30-case KR&R dataset and 36-case local ML holdout set are useful for coursework evidence, but they are still small. A stronger final version should include 100+ real scanned products.
- The local ML model is intentionally lightweight and interpretable; Gemini remains the stronger component for OCR and semantic parsing.
- The knowledge base still requires manual expert maintenance for new additives, regional ingredient names, and multilingual labels.
- Certification logo handling is described in the rules, but actual logo recognition is not yet implemented.
- A larger real-product dataset, multilingual dictionaries, an admin KB update workflow, halal-logo recognition, and real halal retailer/certification data are recommended next improvements. User-editable OCR correction is now implemented in the photo scan flow.
