# Presentation Outline: HalalScan 

*This is a suggested slide-by-slide outline for your final Capstone presentation.*

## Slide 1: Title Slide
- **Title:** HalalScan: A Neuro-Symbolic AI System for Dietary Compliance
- **Subtitle:** Combining Machine Learning with Rule-Based Reasoning
- **Presenter Name**

## Slide 2: The Problem (Problem Formulation)
- **Context:** Globalized food supply chains make dietary compliance difficult.
- **The Issue:** Labels contain complex chemical names and E-numbers.
- **The AI Challenge:** Pure ML models hallucinate, which is unacceptable for strict religious/dietary compliance where 100% accuracy is required.

## Slide 3: The Solution - HalalScan
- **What it is:** An end-to-end interactive mobile-first application.
- **Core Feature:** Real-time dietary analysis via text, barcode lookup, and editable image OCR.
- **The Innovation:** A Hybrid Neuro-Symbolic approach.

## Slide 4: AI Approach (Neuro-Symbolic Architecture)
- **Neural (ML):** Uses generative AI (LLM/LVM) to handle unstructured data, extract text from messy images, and provide semantic understanding.
- **Symbolic (KR&R):** Uses a strict, deterministic logic engine filled with absolute rules.
- **Why Both?** Combines the flexibility of Neural Networks with the reliability of Symbolic Logic.

## Slide 5: System Implementation - Under the Hood
- **ML Component:** Gemini for OCR/semantic parsing plus a local TF-IDF Naive Bayes fallback.
- **Knowledge Base:** Hardcoded arrays mapping `HARAM` and `MASHBOOH` keywords (`src/constants/halalRules.ts` and `src/utils/reasoningEngine.ts`).
- **Integration Logic:** The "Consensus Builder" keeps working offline and lets KR&R veto unsafe ML output.
- *Visual Suggestion: Add a flowchart here showing Image -> ML Extraction -> KR&R Scan -> ML Reasoning -> Final Consensus.*

## Slide 6: Overcoming AI Hallucinations
- **Scenario:** The ML model gets confused and says an item containing "E120" (Carmine) is HALAL.
- **The Override:** The KR&R Engine detects "E120" during its independent scan, intercepts the ML output, and forces a veto override, changing the verdict to HARAM with 100% confidence.

## Slide 7: Results and Evaluation
- **Performance:** Successfully processes complex, real-world label images.
- **Accuracy:** Local ML holdout evaluation is 36/36 and KR&R evaluation is 30/30 on the coursework datasets.
- **Safety Tests:** `No ingredients listed` becomes MASHBOOH; `pig fat`, `porcine gelatin`, `swine extract`, and `E-120` are caught as HARAM.
- **User Experience:** Provides plain-language explanations instead of just a binary yes/no.

## Slide 8: Limitations and Future Work
- **Limitations:** The KR&R rule base is brittle—if a new chemical is invented, a human must manually add it to the database.
- **Future Improvements:** Add halal-logo recognition, a 100+ product dataset, multilingual dictionaries, verified retailer/certification data, and an admin workflow where new rules are proposed for human review.

## Slide 9: Conclusion
- **Summary:** HalalScan demonstrates that hybrid AI architectures are the optimal solution for high-stakes compliance tasks.
- **Q&A**
