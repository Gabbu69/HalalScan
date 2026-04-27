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
- **Core Feature:** Real-time dietary analysis via text and image (OCR).
- **The Innovation:** A Hybrid Neuro-Symbolic approach.

## Slide 4: AI Approach (Neuro-Symbolic Architecture)
- **Neural (ML):** Uses generative AI (LLM/LVM) to handle unstructured data, extract text from messy images, and provide semantic understanding.
- **Symbolic (KR&R):** Uses a strict, deterministic logic engine filled with absolute rules.
- **Why Both?** Combines the flexibility of Neural Networks with the reliability of Symbolic Logic.

## Slide 5: System Implementation - Under the Hood
- **ML Component:** Integration with the Google Gemini Multimodal API.
- **Knowledge Base:** Hardcoded arrays mapping `HARAM` and `MASHBOOH` keywords (`src/constants/halalRules.ts`).
- **Integration Logic:** The "Consensus Builder".
- *Visual Suggestion: Add a flowchart here showing Image -> ML Extraction -> KR&R Scan -> ML Reasoning -> Final Consensus.*

## Slide 6: Overcoming AI Hallucinations
- **Scenario:** The ML model gets confused and says an item containing "E120" (Carmine) is HALAL.
- **The Override:** The KR&R Engine detects "E120" during its independent scan, intercepts the ML output, and forces a veto override, changing the verdict to HARAM with 100% confidence.

## Slide 7: Results and Evaluation
- **Performance:** Successfully processes complex, real-world label images.
- **Accuracy:** Zero false-positive rate for known forbidden ingredients due to the KR&R veto system.
- **User Experience:** Provides plain-language explanations instead of just a binary yes/no.

## Slide 8: Limitations and Future Work
- **Limitations:** The KR&R rule base is brittle—if a new chemical is invented, a human must manually add it to the database.
- **Future Improvements:** Implement an agentic workflow where the ML model reads FDA/Halal certification updates and proposes new rules for human review.

## Slide 9: Conclusion
- **Summary:** HalalScan demonstrates that hybrid AI architectures are the optimal solution for high-stakes compliance tasks.
- **Q&A**
