# Grading Rubric Mapping Guide

| Deliverable | Description | HalalScan implementation / evidence | Weight |
|-------------|-------------|--------------------------------------|--------|
| **Project Proposal** | Problem, dataset, AI approach | The submitted DOCX is treated as authoritative. The app now follows its React + Flask + Google Vision + RapidAPI + KBR + SQLite design. | 10% |
| **ML Model Implementation** | Training, evaluation | RapidAPI Halal Food Checker is the primary ingredient classification layer in `backend/rapidapi_client.py`, with SQLite caching. The existing local Naive Bayes model remains as a fallback/evaluation artifact. | 25% |
| **Knowledge Base Design** | Rules and logic | `backend/data/halal_rules.json` contains 60 structured rules plus JAKIM, MUI, IFANCA, HFA, and ESMA certifying-body records. | 20% |
| **Reasoning Engine** | Correct inference | `backend/analysis.py` applies proposal logic: haram -> `NON-COMPLIANT`, clear ingredients plus recognized certifier -> `HALAL COMPLIANT`, doubtful/unknown/missing certifier -> `REQUIRES REVIEW`. | 15% |
| **System Integration** | ML + KR&R working together | `POST /api/analyze` combines OpenFoodFacts barcode lookup, RapidAPI per-ingredient status, knowledge-base rules, certifying-body verification, history persistence, and explainable logs. Flask handles local SQLite; Vercel uses the matching `api/_halalscan.ts` serverless adapter and frontend localStorage history. | 15% |
| **Technical Report, Results and Presentation** | Architecture, results, limitations, presentation | `TECHNICAL_REPORT.md`, `docs/Technical_Report.md`, and backend tests document and validate the implemented architecture. | 15% |
| **Total** | | | **100%** |
