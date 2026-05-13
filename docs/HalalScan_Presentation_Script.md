# HalalScan Simple Presentation Script

Use this script with `HalalScan_Final_Presentation.pptx`.

Total target time: about 8 to 10 minutes.

## Speaker Split

- Speaker 1 / Leader: Slides 1, 2, and 12
- Speaker 2 / ML + Knowledge Base: Slides 3, 4, 5, and 6
- Speaker 3 / Reasoning + System Integration: Slides 7, 8, 9, 10, and 11

## Slide 1 - Title

Speaker 1 / Leader:

Good day everyone. We are presenting our project, HalalScan.

HalalScan is an AI system that gives a simple product-level halal or haram result while still showing ingredient warnings when a source needs review.

Our project uses machine learning, a halal knowledge base, and a reasoning engine.

The main goal is not only to give an answer, but also to explain why the system gave that answer.

## Slide 2 - Problem

Speaker 1 / Leader:

The problem is that food labels can be hard to understand.

Some ingredients are easy, like rice or salt.

But some ingredients are not easy, like E-numbers, gelatin, enzymes, alcohol flavoring, or pork derivatives.

A normal user may not know if those ingredients are halal or haram.

So our goal is to make the result simple for users, but still show clear proof for the professor.

Handoff:

Now Speaker 2 will explain how our AI system works.

## Slide 3 - AI Approach

Speaker 2:

HalalScan uses one main API called `/api/analyze`.

The user can enter ingredients manually, scan a barcode, or use OCR from a food label image.

After the input is collected, the system checks the ingredients using machine learning, the knowledge base, and the reasoning engine.

The final result includes a verdict, reason, recommendation, triggered rules, and certifier information.

## Slide 4 - ML Implementation

Speaker 2:

For the machine learning part, our main classifier is the RapidAPI Halal Food Checker.

If the RapidAPI key is available, the system can use the live API.

But if the key is missing, the project still works.

We added a local TF-IDF Naive Bayes fallback model.

This is important because our classroom demo and tests can run even without paid API keys.

## Slide 5 - Knowledge Base

Speaker 2:

The knowledge base is the source of truth for halal rules.

It has 67 structured rules.

Each rule can include a status, category, keywords, E-number triggers, reason, and source.

The system also recognizes certifying bodies like JAKIM, MUI, IFANCA, HFA, and ESMA.

This helps the system explain the result, instead of only guessing.

## Slide 6 - Rule Examples

Speaker 2:

Here are simple examples of the rules.

E120, also called carmine, is marked as haram.

Gelatin is marked as doubtful when the source is unknown.

Sugar and salt are halal examples.

Certifiers like JAKIM and IFANCA are helpful evidence, but they do not override a haram ingredient.

Handoff:

Now Speaker 3 will explain how the reasoning engine makes the final decision.

## Slide 7 - Reasoning Engine

Speaker 3:

The reasoning engine follows a fixed priority.

The product-level priority is simple: haram first, otherwise halal.

This means the highest-risk evidence wins.

For example, if a product has E120, the final result becomes non-compliant or haram.

Even if the certifier is recognized, the haram ingredient still wins.

This makes the decision consistent and easy to explain.

## Slide 8 - System Integration

Speaker 3:

This slide shows how the system parts work together.

The React app sends the scan to the API.

The backend checks machine learning results, knowledge base rules, certifier information, and scan history.

The Vercel API routes match the backend behavior for deployment.

The result page also shows evidence logs for ML, knowledge base, reasoning, and system integration.

## Slide 9 - Demo Cases

Speaker 3:

We prepared three simple demo cases.

First, rice, oil, and salt with JAKIM should return halal compliant.

Second, sugar and E120 with JAKIM should return non-compliant or haram.

Third, gelatin and natural flavors with IFANCA should return halal at the product level while still showing source-dependent ingredient warnings.

These three examples show the product badges and the evidence table: halal, haram, and halal with source-dependent ingredient warnings.

## Slide 10 - Evaluation

Speaker 3:

For evaluation, we ran reproducible tests.

The knowledge-based reasoning test passed 30 out of 30 cases.

The local machine learning fallback passed 36 out of 36 holdout cases.

The backend tests passed 21 out of 21.

We also tested linting, Vercel API behavior, badge display, and production build.

One important note is that these perfect scores are for curated classroom tests.

They are not a guarantee for real-world halal certification.

## Slide 11 - Limitations

Speaker 3:

Our project is ready for grading, but it still has limitations.

Google Vision and RapidAPI need credentials for live external calls.

The certifier check recognizes names, but it does not prove that a real certificate is authentic.

The RAG chat feature explains rules, but it does not make final product verdicts.

The final verdict still comes from `/api/analyze`.

Future improvements can include certificate lookup, more languages, and more real-world test data.

Handoff:

Now our leader will close the presentation.

## Slide 12 - Closing

Speaker 1 / Leader:

To conclude, HalalScan meets the project rubric.

It has a project proposal, machine learning implementation, knowledge base, reasoning engine, system integration, and report evidence.

The most important point is this:

The system does not only say halal or haram.

It also shows why.

Thank you.

## Quick Practice Tips

- Speak slowly.
- Do not read too fast.
- Each person should explain only their assigned slides.
- If you forget a line, just explain the main idea in your own words.
- For the demo slide, only remember three examples: rice is halal, E120 is haram, and gelatin stays halal at the product level while showing source warnings.
