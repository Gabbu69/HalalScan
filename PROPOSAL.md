# HalalScan Project Proposal

## Problem

Consumers need a practical way to verify whether packaged food products are halal-compliant before purchase or consumption. Ingredient labels can hide pork derivatives, alcohol-based flavorings, doubtful E-numbers, or unverifiable certification claims.

## Objective

Build a web application that accepts product label images, PDFs, ingredient text, and barcodes, then returns a transparent halal compliance verdict.

## Data Sources

- Google Vision OCR for product label text extraction.
- Halal Food Checker through RapidAPI for per-ingredient classification.
- OpenFoodFacts for barcode-based product lookup.
- A structured halal knowledge base with ingredient, additive, slaughter, alcohol, processing, and certifying-body rules.
- SQLite storage for scan history and cached ingredient classifications.

## AI Approach

HalalScan uses a hybrid Machine Learning + Knowledge-Based Reasoning design:

- RapidAPI Halal Food Checker supplies the primary ML classification layer.
- The knowledge base applies deterministic rules with strict override logic.
- Google Vision handles OCR for image/PDF labels.
- Legacy Gemini/Tesseract/local ML support remains as fallback only.

## Verdicts

- `HALAL COMPLIANT`: all ingredients are clear and a recognized certifying body is provided.
- `NON-COMPLIANT`: any API or KB result finds a haram ingredient.
- `REQUIRES REVIEW`: any ingredient is doubtful/unknown, or certification is missing/unrecognized.

