# HalalScan

HalalScan is a modern React application built to help users quickly scan and identify Halal products. It utilizes a combination of QR/barcode scanning and AI-powered analysis to provide accurate and immediate feedback on product ingredients and status.

## Features

- **Product Scanning**: Built-in barcode and QR code scanner using `html5-qrcode`.
- **AI-Powered Analysis**: Integrates with Google GenAI for intelligent product assessment.
- **Local ML Fallback**: TF-IDF weighted Naive Bayes classifier for offline ingredient scoring.
- **Knowledge-Based Reasoning**: Rule engine checks E-numbers, pork derivatives, alcohol, enzymes, and doubtful additives with an explainable logic trace.
- **Modern UI**: Styled with Tailwind CSS for a sleek, responsive, and accessible interface.
- **Fast & Optimized**: Bootstrapped with Vite and React 19 for blazing-fast development and optimized production builds.

## Tech Stack

- **Frontend Framework**: React 19, React Router DOM
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (v4)
- **State Management**: Zustand
- **Hardware Integration**: html5-qrcode
- **AI Integration**: Google GenAI (`@google/genai`)

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Gabbu69/HalalScan.git
   cd HalalScan
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Environment Setup:
   Copy the example environment file and add your credentials.
   ```bash
   cp .env.example .env
   ```
   *Make sure to add your `GEMINI_API_KEY` to the `.env` file.*

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be running at `http://localhost:3000`.

## Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run preview`: Previews the production build locally.
- `npm run lint`: Runs TypeScript type checking.
- `npm run evaluate`: Runs local ML and KR&R evaluation reports.

## Vercel Deployment

Add a fresh Gemini key in **Vercel Project Settings -> Environment Variables**:

```text
GEMINI_API_KEY = your_fresh_google_ai_studio_key
```

Supported server-side aliases are `GOOGLE_API_KEY` and `GOOGLE_GENERATIVE_AI_API_KEY`, but `GEMINI_API_KEY` is recommended. After adding the key, redeploy the project. You can check deployment configuration at:

```text
https://your-vercel-domain.vercel.app/api/health
```

The response should show `"configured": true` under `gemini`.

## Contributing

Please ensure you create a new branch for any feature or bugfix before submitting a pull request. Make sure to run `npm run lint` and verify your changes locally.
