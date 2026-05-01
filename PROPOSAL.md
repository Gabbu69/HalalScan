# Artificial Intelligence Systems - Project Proposal

**Title:** HalalScan: A Neuro-Symbolic Approach to Automated Halal Dietary Validation
**Author:** Joseph C. Lorilla, Faculty, Department of Computing and Library Information Science
**Course:** Artificial Intelligence Systems

## 1. Problem Statement
The global Muslim population adheres strictly to dietary laws determining what is permissible (Halal) and what is forbidden (Haram). However, modern food production involves complex global supply chains, chemical additives, and ambiguous E-numbers (e.g., E471, E120) that make it exceedingly difficult for the average consumer to verify the halal status of a product simply by reading the label. Furthermore, ingredient lists vary by region, and language barriers often exacerbate the difficulty of manual verification. Existing solutions are either manual, region-restricted, or lack robust reasoning to deal with ambiguous (Mashbooh) ingredients. There is a clear need for an intelligent, automated system capable of analyzing food ingredients to provide immediate, reliable, and logically sound dietary verdicts.

## 2. Data Sources
To construct a comprehensive and accurate system, HalalScan leverages multiple distinct data streams:
*   **OpenFoodFacts API:** A massive, crowdsourced database of food products globally. HalalScan retrieves structured ingredient lists, nutritional facts, and packaging data using standard barcodes.
*   **Optical Character Recognition (OCR):** For products not registered in OpenFoodFacts, the system processes user-uploaded images of ingredient lists. We use advanced computer vision techniques (e.g., Google Vision or Tesseract) to extract raw text from packaging.
*   **Manual Input:** A fallback text input method allowing users to manually type or paste ingredient lists for immediate analysis.
*   **Halal Knowledge Base:** A proprietary dataset of rules and E-number classifications synthesized from major certification bodies, including JAKIM (Malaysia) and IFANCA (USA).

## 3. AI Approach
HalalScan employs a hybrid **Neuro-Symbolic AI architecture**, combining the interpretability of symbolic logic with the adaptability of machine learning:

*   **Symbolic AI (Knowledge Representation & Reasoning - KR&R):** The core of the system is a deterministic inference engine built on a structured Knowledge Base. It utilizes Forward Chaining to extract base facts (ingredients) and apply a rigid set of 15+ rules (derived from JAKIM/IFANCA). It implements a strict conflict resolution hierarchy (`HARAM > MASHBOOH > HALAL`) to guarantee safety in dietary compliance. The engine generates a transparent `logicPath` for every decision.
*   **Machine Learning Model:** A lightweight, pure TypeScript implementation of a Term Frequency-Inverse Document Frequency (TF-IDF) vectorizer coupled with a Naive Bayes classifier. This model is trained on a localized dataset of labeled ingredient lists. It provides statistical probability scoring (confidence intervals) for ingredient sets, complementing the strict rule-based engine.
*   **Large Language Model Integration (Gemini):** For highly unstructured, multi-lingual, or deeply ambiguous edge cases, the system proxies requests to the Google Gemini model. This allows for deep semantic understanding of complex chemical names and contextual natural language processing.

## 4. Expected Outcomes
1.  **High Accuracy Verdicts:** The system will classify ingredients into HALAL, HARAM, or MASHBOOH categories with >90% accuracy on standard commercial products.
2.  **Explainability:** Unlike black-box neural networks, HalalScan will output a human-readable logic path, explaining exactly which rules triggered a specific verdict.
3.  **Real-time Processing:** The lightweight TypeScript ML model and optimized reasoning engine will evaluate inputs with latency suitable for a mobile web application.
4.  **Academic Contribution:** The project will serve as a robust demonstration of neuro-symbolic AI applied to practical, real-world religious and dietary compliance.
