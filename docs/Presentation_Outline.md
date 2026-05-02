# Presentation Outline: HalalScan

## Slide 1: Title
- **HalalScan:** A Hybrid Machine Learning and Knowledge-Based Reasoning System for Halal Certification Verification
- Team: Paclibar, Nebrija, Ibrahim

## Slide 2: Problem
- Food labels can hide pork derivatives, alcohol carriers, doubtful E-numbers, and unclear certifying bodies.
- Manual verification is slow, inconsistent, and difficult for consumers unfamiliar with ingredient terminology.

## Slide 3: Proposed Solution
- Upload a product label, scan a barcode, or paste ingredients.
- Google Vision extracts label text.
- RapidAPI Halal Food Checker classifies ingredients.
- A 60-rule knowledge base verifies compliance and explains the final verdict.

## Slide 4: System Architecture
- React frontend for scanning, OCR review, analysis results, knowledge base, and history.
- Flask backend for OCR, analysis, rules, and SQLite storage.
- Vercel serverless adapter mirrors the main API routes for deployment.
- Open Food Facts supplements barcode lookup.

## Slide 5: Knowledge Base
- 60 canonical rules in `backend/data/halal_rules.json`.
- Covers additives, E-numbers, pork, alcohol, animal enzymes, dairy, meat, seafood, processing, and certifying bodies.
- Recognized bodies: JAKIM, MUI, IFANCA, HFA, ESMA.

## Slide 6: Reasoning Engine
- Ingredient facts are normalized and matched against canonical rules.
- RapidAPI results and KB results are merged.
- Conflict priority: `HARAM > DOUBTFUL > UNKNOWN > HALAL`.
- Final labels: `HALAL COMPLIANT`, `NON-COMPLIANT`, `REQUIRES REVIEW`.

## Slide 7: Evaluation Results
- KR&R dataset: 30/30 correct, 100.0% accuracy.
- Local ML fallback holdout: 36/36 correct, 100.0% accuracy.
- Flask backend tests: 14/14 passing.
- Vercel API smoke tests: passing.

## Slide 8: Explainability Demo
- Show a halal product with recognized certifier.
- Show `E120` or pork derivative forcing `NON-COMPLIANT`.
- Show gelatin/natural flavors forcing `REQUIRES REVIEW`.
- Point to facts, matched rules, conflict resolution, and certifier check in the result.

## Slide 9: Limitations
- Google Vision and RapidAPI require credentials for live external calls.
- Certifier matching checks a maintained trusted list, not official certificate authenticity.
- Non-English labels and school-of-law differences are routed outside the current scope.

## Slide 10: Conclusion
- HalalScan demonstrates a practical hybrid AI system: ML/API classification handles ingredient analysis, while deterministic knowledge-based reasoning keeps compliance decisions explainable and defensible.
