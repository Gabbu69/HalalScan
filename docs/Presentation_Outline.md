# Presentation Outline: HalalScan

## Slide 1: Title
- **Title:** HalalScan: A Hybrid ML and Knowledge-Based Reasoning System for Halal Verification
- **Subtitle:** Google Vision OCR + RapidAPI Ingredient Classification + Rule-Based Compliance Logic

## Slide 2: Problem
- Food labels contain hidden haram substances, doubtful E-numbers, alcohol carriers, and unclear certifying bodies.
- Manual verification is slow and error-prone for everyday consumers.

## Slide 3: Solution
- Upload a label image/PDF, scan a barcode, or paste ingredients.
- Review OCR text before analysis.
- Receive `HALAL COMPLIANT`, `NON-COMPLIANT`, or `REQUIRES REVIEW`.

## Slide 4: Architecture
- React frontend for scanning, review, results, knowledge base, and history.
- Flask backend for OCR, analysis, rules, and storage.
- SQLite for scan history and RapidAPI result caching.

## Slide 5: AI Components
- Google Vision extracts text from labels and PDFs.
- RapidAPI Halal Food Checker classifies each ingredient.
- Knowledge-based reasoning applies 60 deterministic halal rules.

## Slide 6: Safety Logic
- Any haram result from API or KB forces `NON-COMPLIANT`.
- Doubtful/unknown ingredients force `REQUIRES REVIEW`.
- Missing or unrecognized certifying body also forces `REQUIRES REVIEW`.
- Only clear ingredients plus JAKIM/MUI/IFANCA/HFA/ESMA certification produce `HALAL COMPLIANT`.

## Slide 7: Results
- Backend tests cover rule count, E120, gelatin, pork/alcohol logic, certifier checks, OCR fallback, history, and verdict decisions.
- Existing local ML/KR&R evaluation remains available as fallback evidence.

## Slide 8: Limitations
- Live Google Vision and RapidAPI require credentials.
- Certifying-body matching does not verify official certificate authenticity.
- Knowledge-base rules require expert maintenance.

## Slide 9: Conclusion
- HalalScan demonstrates a practical hybrid AI system where ML handles extraction/classification and rule-based logic keeps final compliance decisions explainable.

