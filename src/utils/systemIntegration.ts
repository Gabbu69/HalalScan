import { runRuleBasedInference, InferenceResult } from './reasoningEngine';
import { analyzeProductWithGemini, analyzeImageWithGemini } from './geminiApi';
import { scoreIngredients } from './mlModel';

export type IntegratedAnalysisResult = {
  finalVerdict: 'HALAL' | 'HARAM' | 'MASHBOOH';
  confidence: number;
  reason: string;
  flagged_ingredients: string[];
  recommendation: string;
  name?: string;
  ingredients?: string;
  architectureDetails: {
    krrAnalysis: InferenceResult;
    mlAnalysis: any;
    integrationLogic: string[];
  };
};

const buildConsensus = (mlResult: any, krrResult: InferenceResult, integrationLogs: string[]): IntegratedAnalysisResult => {
  let finalVerdict = mlResult.verdict;
  let finalReason = mlResult.reason;
  let finalConfidence = mlResult.confidence;
  let finalFlags = Array.from(new Set([...(mlResult.flagged_ingredients || []), ...krrResult.flags.map(f => f.ingredient)]));

  if (krrResult.status === 'HARAM' && mlResult.verdict !== 'HARAM') {
    integrationLogs.push('CRITICAL: KR&R explicitly detected HARAM violation overriding ML assessment.');
    finalVerdict = 'HARAM';
    finalReason = `Rule-based violation found (${krrResult.flags.map(f=>f.ingredient).join(', ')}). ` + finalReason;
    finalConfidence = 100;
  } else if (krrResult.status === 'MASHBOOH' && mlResult.verdict === 'HALAL') {
    integrationLogs.push('NOTICE: KR&R detected MASHBOOH warning. Overriding ML HALAL assessment.');
    finalVerdict = 'MASHBOOH';
    finalReason = `Rule-based doubtful ingredient found (${krrResult.flags.map(f=>f.ingredient).join(', ')}). ` + finalReason;
    finalConfidence = Math.max(50, (finalConfidence || 100) - 20);
  } else {
    integrationLogs.push('System reached consensus smoothly. ML assessment aligns with KR&R evaluation.');
  }

  return {
    finalVerdict,
    confidence: finalConfidence,
    reason: finalReason,
    flagged_ingredients: finalFlags,
    recommendation: mlResult.recommendation || '',
    name: mlResult.name || '',
    ingredients: mlResult.ingredients || '',
    architectureDetails: {
      krrAnalysis: krrResult,
      mlAnalysis: mlResult,
      integrationLogic: integrationLogs
    }
  };
};

export const runIntegratedAnalysis = async (productName: string, ingredients: string, madhab: string): Promise<IntegratedAnalysisResult> => {
  const integrationLogs: string[] = [];
  integrationLogs.push('Initializing System Integration (ML + KR&R).');

  const krrResult = runRuleBasedInference(ingredients);
  integrationLogs.push(`KR&R Engine completed. Preliminary status: ${krrResult.status}.`);

  integrationLogs.push('Dispatching payload to Machine Learning Inferencing endpoint...');
  let mlResult;
  try {
    mlResult = await analyzeProductWithGemini(productName, ingredients, madhab);
    integrationLogs.push(`ML Engine completed. AI verdict: ${mlResult.verdict}.`);
  } catch (error) {
    integrationLogs.push(`WARNING: ML API unreachable. Engaging Offline Fallback Model (Naive Bayes)...`);
    const fallbackResult = scoreIngredients(ingredients);
    mlResult = {
      verdict: fallbackResult.verdict,
      confidence: Math.round(fallbackResult.confidence * 100),
      reason: `(Offline Fallback Active) Local statistical model evaluated text. Key influencing terms: ${fallbackResult.influencingTerms.join(', ')}.`,
      flagged_ingredients: [],
      recommendation: "System running locally. Rule-based evaluation is accurate, but ML context may be limited.",
      name: productName,
      ingredients: ingredients
    };
    integrationLogs.push(`Offline Fallback completed. Local AI verdict: ${mlResult.verdict}.`);
  }

  return buildConsensus(mlResult, krrResult, integrationLogs);
};

export const runIntegratedImageAnalysis = async (imageBase64: string, madhab: string): Promise<IntegratedAnalysisResult> => {
  const integrationLogs: string[] = ['Initializing Integrated Vision Pipeline (ML Image Extraction -> KR&R -> ML Deductive)'];
  
  // Step 1: Vision Extraction & Initial ML Analysis
  integrationLogs.push('Dispatching image to Machine Learning Vision endpoint...');
  let mlResult;
  try {
    mlResult = await analyzeImageWithGemini(imageBase64, madhab);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gemini vision API is unavailable.';
    integrationLogs.push(`WARNING: Vision ML unavailable. ${message}`);
    integrationLogs.push('Offline image fallback engaged. OCR cannot run locally, so the user must paste ingredients for full KR&R analysis.');

    const krrResult = runRuleBasedInference('');
    return {
      finalVerdict: 'MASHBOOH',
      confidence: 50,
      reason: 'Offline image scan mode is active because Gemini vision is not configured. The app cannot extract ingredients from this photo locally, so this result is marked doubtful until the ingredient text is entered.',
      flagged_ingredients: [],
      recommendation: 'Use the scanner text box to paste the ingredients, or add GEMINI_API_KEY to enable photo OCR analysis.',
      name: 'Photo Scan (Offline OCR Unavailable)',
      ingredients: 'Image uploaded, but ingredients could not be extracted without Gemini vision.',
      architectureDetails: {
        krrAnalysis: krrResult,
        mlAnalysis: {
          verdict: 'MASHBOOH',
          confidence: 50,
          reason: 'Gemini vision unavailable; no local OCR model is bundled.',
          flagged_ingredients: [],
          recommendation: 'Paste ingredients manually for local ML + KR&R analysis.'
        },
        integrationLogic: integrationLogs
      }
    };
  }
  integrationLogs.push(`ML Image Extraction completed. Identified ingredients: "${mlResult.ingredients}". AI verdict: ${mlResult.verdict}`);

  // Step 2: Feed extracted text into KR&R Rules
  integrationLogs.push('Routing extracted text to KR&R Reasoning Engine...');
  const krrResult = runRuleBasedInference(mlResult.ingredients || '');
  integrationLogs.push(`KR&R Engine completed. Rule status: ${krrResult.status}`);

  return buildConsensus(mlResult, krrResult, integrationLogs);
};
