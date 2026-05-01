# Technical Report: HalalScan Neuro-Symbolic Reasoning System

**Author:** Joseph C. Lorilla, Faculty, Department of Computing and Library Information Science
**Course:** Artificial Intelligence Systems

---

## 1. System Architecture
HalalScan is designed as a scalable, serverless web application that utilizes a **Neuro-Symbolic AI architecture**. The frontend is developed in React (TypeScript) and hosted on Vercel, ensuring high availability and rapid client-side rendering.

The system's intelligence layer consists of three primary components:
1.  **Rule-Based Inference Engine (Symbolic):** A deterministic engine executing locally in the client/serverless environment.
2.  **Statistical Machine Learning Model (Sub-symbolic):** A lightweight TF-IDF and Naive Bayes classifier for probabilistic scoring.
3.  **Gemini API Enhancement:** An external API proxy accessed securely via server-side API routes to handle OCR, semantic ambiguity, and richer explanations.

This architecture ensures that the system is fast, secure (no exposed API keys), highly interpretable, and offline-first for text/barcode ingredient analysis. Photo scans include an editable OCR review step before final inference.

---

## 2. Integration of ML and KR&R (Neuro-Symbolic Approach)
The defining feature of HalalScan is its integration of Machine Learning (ML) with Knowledge Representation and Reasoning (KR&R). 

Pure ML models (like neural networks) act as "black boxes," making them unsuitable for religious compliance where the *reasoning* is as important as the *verdict*. Conversely, pure symbolic systems are brittle and struggle with typos or novel ingredient names.

HalalScan merges them:
*   The **ML Model** provides a probabilistic `confidence score` by vectorizing the ingredient text and comparing it against historical training distributions.
*   The **KR&R Engine** acts as an absolute safeguard. Even if the ML model predicts "Halal" with 90% confidence, if the KR&R engine detects a hard-coded rule violation (e.g., the presence of "E120"), the Symbolic engine overrides the ML model, demonstrating a `HARAM > MASHBOOH > HALAL` priority hierarchy.
*   If Gemini is unavailable, local ML plus KR&R still returns a verdict instead of blocking the user.

---

## 3. Knowledge Base Design
The Knowledge Base (`src/constants/halalRules.ts`) is formulated as a structured array of heuristic rules and encyclopedic facts.

**Schema:**
Each rule contains a unique `id`, `category` (e.g., Additives, Slaughter Method), `title`, detailed `content`, and a verifiable `source` (e.g., JAKIM, IFANCA).

**Data Structures:**
*   **Rules Array:** 15 distinct rules covering everything from Zabiha requirements to alcohol as a solvent.
*   **E-Numbers Dictionary:** A strict categorization of chemical additives split into arrays of HARAM (e.g., E904, E542), MASHBOOH (e.g., E471), and HALAL (e.g., E300).
*   **Keyword Triggers:** 104 executable keyword rules and 40 E-number triggers, including pork derivatives, alcohol terms, ambiguous animal-source ingredients, and insufficient-data handling.

This structured approach allows the reasoning engine to map raw string tokens directly to authoritative fatwas and international standards.

---

## 4. Reasoning Engine Logic
The engine (`src/utils/reasoningEngine.ts`) implements **Forward Chaining**, starting from known facts and applying rules to extract a conclusion.

1.  **Fact Extraction:** The engine tokenizes the user's ingredient input into an array of base facts.
2.  **Rule Application:** The engine iterates through the E-Numbers list and Keyword lists. When a fact matches a rule predicate, the engine derives a new state (e.g., `haramScore += 100`).
3.  **Conflict Resolution:** It is common for a product to contain both Halal and Haram ingredients. The engine uses priority tiers: The presence of a single Haram item instantly escalates the global state to HARAM, regardless of the volume of Halal items. 
4.  **Uncertainty Handling:** If MASHBOOH items are found without any HARAM items, the system enters an uncertain state, prompting the user for further clarification (e.g., checking for a Halal logo).
5.  **Input Quality Guard:** Empty, unknown, or placeholder ingredient text is treated as MASHBOOH rather than HALAL.
6.  **Traceability:** A `logicPath` string array is continuously updated at every step, documenting exactly why a decision was reached.

---

## 5. Sample Results

**Test Input 1:** "Water, sugar, E120, natural flavors"
*   **Extracted Facts:** water, sugar, e120, natural, flavors
*   **ML Prediction:** HARAM (Confidence: 0.85)
*   **Symbolic Logic Path:**
    1. `[FORWARD CHAINING INIT] Extracting base facts from ingredients.`
    2. `Extracted facts: 5 tokens found.`
    3. `Rule match [R001]: Found Haram E-Number E120.`
    4. `Rule match: Found Mashbooh keyword "natural flavors". Status ambiguous.`
    5. `[CONFLICT RESOLUTION] Evaluating derived facts against priority tiers.`
    6. `Resolution: HARAM tier prioritized. Verdict: HARAM.`
*   **Final Output:** HARAM.

**Test Input 2:** "Wheat flour, salt, yeast"
*   **ML Prediction:** HALAL (Confidence: 0.98)
*   **Symbolic Logic Path:**
    1. `Extracted facts: 4 tokens found.`
    2. `[CONFLICT RESOLUTION] Evaluating derived facts against priority tiers.`
    3. `Resolution: No Haram/Mashbooh conflicts. Verdict: HALAL.`
*   **Final Output:** HALAL.

---

## 6. Limitations
*   **Incomplete Data:** The KR&R engine is only as good as its dictionary. Novel chemical names not explicitly listed in the Mashbooh or Haram arrays might bypass the symbolic check.
*   **Language Dependency:** The current TF-IDF and KR&R implementations are heavily optimized for English ingredient lists.
*   **Context Blindness:** The system cannot physically verify if cross-contamination occurred at the factory level, relying entirely on the provided text.
*   **Future Improvements:** Add halal-logo recognition, a 100+ real-product dataset, multilingual dictionaries, an admin KB update workflow, and a verified halal retailer/certification data source.

## 7. Conclusion
HalalScan successfully demonstrates the application of a Neuro-Symbolic AI framework to dietary compliance. By combining the rigorous, explainable logic of a rule-based expert system with the probabilistic adaptability of a machine learning classifier, the project achieves a high degree of accuracy and trustworthiness. This hybrid approach is critical for domains like religious compliance, where human-readable justifications are mandatory.
