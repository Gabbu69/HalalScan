# HalalScan Demo Script

Use this script for the final presentation. Keep the demo focused on the rubric: ML implementation, knowledge base design, reasoning engine, and system integration.

## Opening

"HalalScan is a hybrid AI system for halal food screening. It combines OCR/barcode/text input, an ML classification layer, a structured halal knowledge base, and deterministic reasoning. The final verdict is explainable and reproducible."

## Demo Flow 1: Halal

Input:

```text
Ingredients: rice, sunflower oil, sea salt
Certifying body: JAKIM
```

Expected result: `HALAL COMPLIANT`, displayed to users as `HALAL`.

Say:

"The ML layer checks the ingredients, and the knowledge base finds no haram trigger. The certifying body is recognized as JAKIM and appears as supporting evidence, so the product badge is halal."

Point to:

- User badge: `HALAL`
- Certifier: `RECOGNIZED`
- "Why This Result?"
- Rubric Evidence Logs

## Demo Flow 2: Haram

Input:

```text
Ingredients: sugar, E120, vanilla
Certifying body: JAKIM
```

Expected result: `NON-COMPLIANT`, displayed to users as `HARAM`.

Say:

"E120 is carmine/cochineal. The knowledge base rule `R001` marks it as haram. Even with a recognized certifier, the reasoning engine prioritizes haram findings, so the product becomes non-compliant."

Point to:

- User badge: `HARAM`
- Triggered rule: `R001`
- Flagged ingredient: `E120`
- Product priority: `HARAM > HALAL`
- Ingredient rows can still show `DOUBTFUL` or `UNKNOWN`

## Demo Flow 3: No Haram Detected, With Ingredient Warnings

Input:

```text
Ingredients: sugar, gelatin, natural flavors
Certifying body: IFANCA
```

Expected result: `HALAL COMPLIANT`, displayed to users as `HALAL`.

Say:

"Gelatin and natural flavors are source-dependent, so the ingredient table still shows warning evidence. But because no haram rule fired, the product-level result stays halal instead of going to a maybe side."

Point to:

- User badge: `HALAL`
- Triggered rule: `R002`
- Ingredient-level `DOUBTFUL` classification
- Ingredient-level classifications

## Knowledge Base Demo

Say:

"The knowledge base has 67 structured rules with categories, statuses, E-numbers, keywords, reasons, and source labels. Filters make haram, doubtful, halal, info, and E-number rules easy to inspect."

Show:

- Search `E120`
- Filter `Haram`
- Filter `E-numbers`

## RAG Chat Demo

Ask:

```text
Is E120 halal?
```

Say:

"The chat assistant retrieves matching rules from the same canonical knowledge base. It cites rule IDs and sources, but it does not decide final product verdicts. `/api/analyze` remains the final reasoning path."

## Evaluation Demo

Say:

"The evaluation page shows reproducible classroom tests: 30 KR&R cases and 36 local ML fallback holdout cases. The 100% score is for this curated test set, not a production guarantee."

## Closing

"The important part is not just the final label. HalalScan explains how the answer was produced: ML classification, knowledge-base rules, certifier verification, and deterministic conflict resolution."
