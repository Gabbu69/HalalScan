import { runRuleBasedInference, InferenceResult } from './reasoningEngine';
import { analyzeIngredientsWithGemini, analyzeImageWithGemini } from './geminiApi';

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
  const mlResult = await analyzeIngredientsWithGemini(productName, ingredients, madhab);
  integrationLogs.push(`ML Engine completed. AI verdict: ${mlResult.verdict}.`);

  return buildConsensus(mlResult, krrResult, integrationLogs);
};

export const runIntegratedImageAnalysis = async (imageBase64: string, madhab: string): Promise<IntegratedAnalysisResult> => {
  const integrationLogs: string[] = ['Initializing Integrated Vision Pipeline (ML Image Extraction -> KR&R -> ML Deductive)'];
  
  // Step 1: Vision Extraction & Initial ML Analysis
  integrationLogs.push('Dispatching image to Machine Learning Vision endpoint...');
  const mlResult = await analyzeImageWithGemini(imageBase64, madhab);
  integrationLogs.push(`ML Image Extraction completed. Identified ingredients: "${mlResult.ingredients}". AI verdict: ${mlResult.verdict}`);

  // Step 2: Feed extracted text into KR&R Rules
  integrationLogs.push('Routing extracted text to KR&R Reasoning Engine...');
  const krrResult = runRuleBasedInference(mlResult.ingredients || '');
  integrationLogs.push(`KR&R Engine completed. Rule status: ${krrResult.status}`);

  return buildConsensus(mlResult, krrResult, integrationLogs);
};
