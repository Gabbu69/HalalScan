# Project Proposal: HalalScan

HalalScan is an AI-assisted halal verification system for packaged food products. It follows the submitted DOCX architecture:

- React frontend for scanning, upload, review, results, knowledge base, and history.
- Python Flask backend for OCR, analysis, rules, and storage APIs.
- Google Vision OCR for labels and PDFs.
- RapidAPI Halal Food Checker for per-ingredient ML classification.
- Structured knowledge-based reasoning for halal rules.
- SQLite for scan history and cached classifications.

The system returns `HALAL COMPLIANT`, `NON-COMPLIANT`, or `REQUIRES REVIEW` based on ingredient status and certifying-body verification.

