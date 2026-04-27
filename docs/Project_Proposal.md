# Project Proposal: HalalScan - A Neuro-Symbolic AI System for Dietary Compliance

## 1. Problem Formulation
In an increasingly globalized food supply chain, identifying whether a consumer product complies with specific dietary laws—such as Islamic Halal dietary restrictions—has become exceedingly difficult. Modern food labels contain complex chemical names, E-numbers (e.g., E120 for carmine, E471 for emulsifiers), and vague terms like "natural flavors" which may or may not be derived from animal sources or alcohol.

Consumers often struggle to manually verify these ingredients. While simple machine learning text classifiers can categorize ingredients, they are prone to "hallucinations" and fail to provide the absolute certainty required for religious dietary compliance. 

The objective of this project is to design an end-to-end AI system, **HalalScan**, that automates dietary compliance analysis by accurately extracting ingredient lists from product images and text, and evaluating them against strict logical dietary rules.

## 2. Dataset and Inputs
The system relies on real-time consumer inputs rather than a static pre-compiled dataset, acting as an interactive inference engine. The primary data inputs include:
- **Raw Text / Queries**: Direct user input querying specific ingredients or products.
- **Images (OCR Pipeline)**: User-uploaded images of physical product ingredient labels.

To supplement real-time analysis, the system will utilize knowledge from:
- **Islamic Dietary Jurisprudence (Fiqh)**: A structured set of absolute rules defining what is Halal (permissible), Haram (forbidden), and Mashbooh (doubtful).
- **Food Science Taxonomies**: Mapping E-numbers and chemical compounds to their biological origins.

## 3. AI Approach: Neuro-Symbolic Architecture
To solve the problem of LLM hallucinations while maintaining the flexibility of neural networks for unstructured data extraction, this project proposes a **Hybrid Neuro-Symbolic AI Architecture**.

The system integrates two distinct AI paradigms:
1. **Machine Learning (Neural Model)**: 
   - A Large Language/Vision Model (LLM/LVM) is used to perform Optical Character Recognition (OCR) on product images, extract messy unstructured text, and provide preliminary semantic analysis and contextual recommendations.
2. **Knowledge Representation and Reasoning (KR&R Engine)**:
   - A symbolic logic engine (Knowledge Base) containing absolute, deterministic rules (e.g., "If ingredient includes 'E120', then status is HARAM").

**System Integration Mechanism**:
The system will run both the ML model and the KR&R engine in parallel or in a pipeline. The integration layer will act as a consensus builder: the flexible ML model provides context and recommendations, but the deterministic KR&R engine retains override authority. If the ML model hallucinates a "HALAL" verdict for an ingredient explicitly forbidden in the Knowledge Base, the KR&R engine will trigger a strict veto, guaranteeing compliance and safety.
