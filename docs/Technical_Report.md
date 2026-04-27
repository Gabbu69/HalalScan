# Technical Report: HalalScan Neuro-Symbolic AI System

## 1. System Architecture
HalalScan is designed as an end-to-end, full-stack application leveraging a hybrid Neuro-Symbolic AI architecture. The system integrates a generative Machine Learning (ML) model with a deterministic Knowledge Representation and Reasoning (KR&R) engine to ensure high accuracy and absolute reliability in dietary compliance.

### Architecture Components:
1. **Frontend Interface (React/Vite)**: Handles user input, including text queries and image uploads via camera integration.
2. **ML Model (Google Gemini API)**: Acts as the neural component. It performs complex unstructured data tasks:
   - **Vision (OCR)**: Extracts ingredient lists from noisy images of product labels.
   - **Semantic Understanding**: Parses chemical names and provides human-readable contextual recommendations based on the selected Islamic jurisprudence (Madhab).
3. **Knowledge Base (`halalRules.ts`)**: A structured, symbolic database defining strict categories: *HALAL* (Permissible), *HARAM* (Forbidden), and *MASHBOOH* (Doubtful) alongside explicit keyword triggers (e.g., E120, Pork, Gelatin).
4. **Reasoning Engine (`reasoningEngine.ts`)**: A rule-based inference system that scans extracted data against the Knowledge Base using deterministic string-matching and logic gates to assign an absolute status.
5. **System Integration (`systemIntegration.ts`)**: The consensus builder. It routes data through both the ML and KR&R engines, comparing their outputs and applying override logic.

## 2. Implementation Details

### ML Model Implementation
The system utilizes a pre-trained Large Language Model (LLM/LVM). 
- For text queries, the input is wrapped in a strict system prompt enforcing JSON output with fields for `verdict`, `confidence`, and `reason`.
- For image queries, a multimodal pipeline is triggered where the ML model simultaneously performs OCR text extraction and preliminary dietary assessment.

### KR&R Implementation
The KR&R engine operates entirely deterministically. It ingests the ingredient string (either typed by the user or extracted by the ML model's OCR step) and executes a multi-pass scan against the `KNOWLEDGE_BASE` arrays.
- **Rule Escalation**: The reasoning engine maintains a state machine. If a "MASHBOOH" keyword is found, the state escalates from HALAL to MASHBOOH. If a "HARAM" keyword is found, the state escalates immediately to HARAM and locks.

### System Integration & Consensus Logic
The core novelty of the implementation lies in `buildConsensus()`. Because LLMs are probabilistic and prone to hallucinations (e.g., confidently stating that "Bacon flavor" is Halal if prompted incorrectly), the system does not blindly trust the ML output.
- **Veto Power**: If the ML model returns "HALAL" but the KR&R engine detects a "HARAM" keyword, the KR&R engine explicitly overrides the ML verdict. The system logs a `CRITICAL` integration warning, forces the final verdict to "HARAM", and appends the explicit rule violation to the reason.

## 3. Results and Evaluation

The hybrid approach demonstrated significant advantages over a pure ML or pure KR&R approach:
- **Pure KR&R Failure Case**: Fails on misspelled ingredients or complex synonyms (e.g., failing to recognize "pig fat" if only "pork" is in the rule base).
- **Pure ML Failure Case**: Prone to hallucinations or ignoring strict technical rules if the training data is ambiguous.
- **Hybrid Success**: By using the ML model to extract and normalize text (handling typos and synonyms contextually) and then feeding that normalized text into the KR&R engine, the system achieved a near 0% false-positive rate for strictly forbidden items. 

## 4. Limitations and Future Work
- **Brittleness of Rules**: The symbolic Knowledge Base requires manual updating. If a new artificial additive is invented, it will not be flagged until a human adds it to the Knowledge Base.
- **Latency**: Running both inference engines sequentially (especially the multimodal vision step) introduces latency over a purely local heuristic check.
- **Future Work**: Implementing a continuous learning loop where the ML model can propose new rules to be added to the KR&R Knowledge Base based on updated scientific literature, subject to human expert review.
