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

  // ── Consensus Logic with KR&R Override Authority ──

  if (krrResult.status === 'HARAM' && mlResult.verdict !== 'HARAM') {
    // CRITICAL VETO: KR&R has absolute override authority for HARAM
    integrationLogs.push(`CRITICAL VETO: KR&R Engine detected ${krrResult.flags.filter(f => f.type === 'HARAM').length} HARAM violation(s).`);
    integrationLogs.push(`ML Engine returned "${mlResult.verdict}" — OVERRIDDEN by KR&R deterministic logic.`);
    
    const haramFlags = krrResult.flags.filter(f => f.type === 'HARAM');
    const flagDetails = haramFlags.map(f => `${f.ingredient} (${f.description}, ${f.citation})`).join('; ');
    
    finalVerdict = 'HARAM';
    finalReason = `KR&R Rule-based violation: ${flagDetails}. ${finalReason}`;
    finalConfidence = Math.max(krrResult.confidence, 95);
    
    integrationLogs.push(`Verdict forced to HARAM with confidence ${finalConfidence}%. Rules: ${haramFlags.map(f => f.ruleId).join(', ')}.`);
  } else if (krrResult.status === 'MASHBOOH' && mlResult.verdict === 'HALAL') {
    // ESCALATION: KR&R detected doubtful ingredients ML missed
    integrationLogs.push(`ESCALATION: KR&R detected ${krrResult.flags.filter(f => f.type === 'MASHBOOH').length} MASHBOOH indicator(s).`);
    integrationLogs.push(`ML Engine returned "HALAL" — overridden to MASHBOOH by KR&R precautionary principle.`);
    
    const mashFlags = krrResult.flags.filter(f => f.type === 'MASHBOOH');
    const flagDetails = mashFlags.map(f => `${f.ingredient} (${f.description})`).join('; ');
    
    finalVerdict = 'MASHBOOH';
    finalReason = `Doubtful ingredients detected: ${flagDetails}. ${finalReason}`;
    finalConfidence = Math.max(40, Math.min(krrResult.confidence, (finalConfidence || 100) - 15));
    
    integrationLogs.push(`Verdict set to MASHBOOH with adjusted confidence ${finalConfidence}%.`);
  } else if (krrResult.status === mlResult.verdict) {
    // CONSENSUS: Both engines agree
    integrationLogs.push(`CONSENSUS REACHED: ML (${mlResult.verdict}) and KR&R (${krrResult.status}) are in agreement.`);
    integrationLogs.push(`Combined confidence: ML=${mlResult.confidence || 'N/A'}%, KR&R=${krrResult.confidence}%.`);
    
    // Use the higher confidence when both agree
    finalConfidence = Math.max(finalConfidence || 0, krrResult.confidence);
  } else {
    // PARTIAL AGREEMENT: Different verdicts but no critical override needed
    integrationLogs.push(`PARTIAL: ML=${mlResult.verdict}, KR&R=${krrResult.status}. Using ML verdict (no critical KR&R override triggered).`);
  }

  integrationLogs.push(`FINAL: Verdict=${finalVerdict}, Confidence=${finalConfidence}%, Flagged=${finalFlags.length} ingredient(s).`);

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
  integrationLogs.push(`KR&R Engine completed. Status: ${krrResult.status}. ${krrResult.rulesTriggered}/${krrResult.rulesEvaluated} rules triggered.`);

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
  integrationLogs.push(`KR&R Engine completed. Rule status: ${krrResult.status}. ${krrResult.rulesTriggered}/${krrResult.rulesEvaluated} rules triggered.`);

  return buildConsensus(mlResult, krrResult, integrationLogs);
};
