import { hasUsableIngredientText, runRuleBasedInference, InferenceResult } from './reasoningEngine';
import { analyzeProductWithGemini, analyzeImageWithGemini } from './geminiApi';
import { scoreIngredients } from './mlModel';

export type ProposalVerdict = 'HALAL COMPLIANT' | 'NON-COMPLIANT' | 'REQUIRES REVIEW';
export type LegacyVerdict = 'HALAL' | 'HARAM' | 'MASHBOOH';

export type IntegratedAnalysisResult = {
  id?: string;
  finalVerdict: ProposalVerdict | LegacyVerdict;
  confidence: number;
  reason: string;
  flagged_ingredients: string[];
  recommendation: string;
  name?: string;
  brand?: string;
  image?: string | null;
  barcode?: string;
  ingredients?: string;
  certification?: any;
  ingredient_results?: any[];
  triggered_rules?: string[];
  architectureDetails: {
    krrAnalysis: InferenceResult | any;
    mlAnalysis: any;
    integrationLogic: string[];
  };
};

type BackendAnalyzePayload = {
  productName?: string;
  brand?: string;
  image?: string | null;
  barcode?: string;
  ingredients?: string;
  ocrText?: string;
  certifyingBody?: string;
};

const buildConsensus = (mlResult: any, krrResult: InferenceResult, integrationLogs: string[]): IntegratedAnalysisResult => {
  let finalVerdict = mlResult.verdict;
  let finalReason = mlResult.reason;
  let finalConfidence = mlResult.confidence;
  const finalFlags = Array.from(new Set([...(mlResult.flagged_ingredients || []), ...krrResult.flags.map(f => f.ingredient)]));

  // ── Consensus Logic with KR&R Override Authority ──

  if (krrResult.status === 'HARAM' && mlResult.verdict !== 'HARAM') {
    // CRITICAL VETO: KR&R has absolute override authority for HARAM
    integrationLogs.push(`CRITICAL VETO: KR&R Engine detected ${krrResult.flags.filter(f => f.type === 'HARAM').length} HARAM violation(s).`);
    integrationLogs.push(`ML Engine returned "${mlResult.verdict}" — OVERRIDDEN by KR&R deterministic logic.`);
    
    const haramFlags = krrResult.flags.filter(f => f.type === 'HARAM');
    const flagDetails = haramFlags.map(f => `${f.ingredient} (${f.description}, ${f.citation})`).join('; ');
    
    finalVerdict = 'HARAM';
<<<<<<< HEAD
    finalReason = `KR&R Rule-based violation: ${flagDetails}. ${finalReason}`;
    finalConfidence = Math.max(krrResult.confidence, 95);
    
    integrationLogs.push(`Verdict forced to HARAM with confidence ${finalConfidence}%. Rules: ${haramFlags.map(f => f.ruleId).join(', ')}.`);
=======
    finalReason = `Rule-based violation found (${krrResult.flags.map(f => f.ingredient).join(', ')}). ` + finalReason;
    finalConfidence = 100;
>>>>>>> e3afe0f9ccf5d047b4e9d43239da8e0792adb203
  } else if (krrResult.status === 'MASHBOOH' && mlResult.verdict === 'HALAL') {
    // ESCALATION: KR&R detected doubtful ingredients ML missed
    integrationLogs.push(`ESCALATION: KR&R detected ${krrResult.flags.filter(f => f.type === 'MASHBOOH').length} MASHBOOH indicator(s).`);
    integrationLogs.push(`ML Engine returned "HALAL" — overridden to MASHBOOH by KR&R precautionary principle.`);
    
    const mashFlags = krrResult.flags.filter(f => f.type === 'MASHBOOH');
    const flagDetails = mashFlags.map(f => `${f.ingredient} (${f.description})`).join('; ');
    
    finalVerdict = 'MASHBOOH';
<<<<<<< HEAD
    finalReason = `Doubtful ingredients detected: ${flagDetails}. ${finalReason}`;
    finalConfidence = Math.max(40, Math.min(krrResult.confidence, (finalConfidence || 100) - 15));
    
    integrationLogs.push(`Verdict set to MASHBOOH with adjusted confidence ${finalConfidence}%.`);
  } else if (krrResult.status === mlResult.verdict) {
    // CONSENSUS: Both engines agree
    integrationLogs.push(`CONSENSUS REACHED: ML (${mlResult.verdict}) and KR&R (${krrResult.status}) are in agreement.`);
    integrationLogs.push(`Combined confidence: ML=${mlResult.confidence || 'N/A'}%, KR&R=${krrResult.confidence}%.`);
    
    // Use the higher confidence when both agree
    finalConfidence = Math.max(finalConfidence || 0, krrResult.confidence);
=======
    finalReason = `Rule-based doubtful ingredient found (${krrResult.flags.map(f => f.ingredient).join(', ')}). ` + finalReason;
    finalConfidence = Math.max(50, (finalConfidence || 100) - 20);
>>>>>>> e3afe0f9ccf5d047b4e9d43239da8e0792adb203
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

const adaptBackendResult = (data: any): IntegratedAnalysisResult => ({
  id: data.id,
  finalVerdict: data.final_verdict,
  confidence: data.confidence,
  reason: data.reason,
  flagged_ingredients: data.flagged_ingredients || [],
  recommendation: data.recommendation || '',
  name: data.product?.name || data.name || 'Analysis Result',
  brand: data.product?.brand || data.brand || 'Unknown Brand',
  image: data.product?.image || null,
  barcode: data.product?.barcode || data.barcode || '',
  ingredients: data.ingredients || '',
  certification: data.certifying_body,
  ingredient_results: data.ingredient_results || [],
  triggered_rules: data.triggered_rules || [],
  architectureDetails: data.architectureDetails || {
    krrAnalysis: {
      status: data.final_verdict,
      flags: [],
      logicPath: []
    },
    mlAnalysis: {
      provider: 'RapidAPI Halal Food Checker',
      ingredient_results: data.ingredient_results || []
    },
    integrationLogic: []
  }
});

const callBackendAnalyze = async (payload: BackendAnalyzePayload): Promise<IntegratedAnalysisResult> => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Flask analysis backend failed.');
  }

  return adaptBackendResult(await response.json());
};

const runLegacyIntegratedAnalysis = async (productName: string, ingredients: string, madhab: string): Promise<IntegratedAnalysisResult> => {
  const integrationLogs: string[] = [];
  integrationLogs.push('Initializing fallback System Integration (Gemini/local ML + KR&R).');

  const krrResult = runRuleBasedInference(ingredients);
  integrationLogs.push(`KR&R Engine completed. Status: ${krrResult.status}. ${krrResult.rulesTriggered}/${krrResult.rulesEvaluated} rules triggered.`);

  if (!hasUsableIngredientText(ingredients)) {
    integrationLogs.push('Input quality guard activated. No usable ingredient list was available, so external ML was skipped.');
    const mlResult = {
      verdict: 'MASHBOOH',
      confidence: 55,
      reason: 'Insufficient ingredient information is available. The system cannot confirm halal status without a readable ingredients list.',
      flagged_ingredients: krrResult.flags.map(flag => flag.ingredient),
      recommendation: 'Scan the ingredients photo or paste the label text before consuming. Until verified, treat this product as doubtful.',
      name: productName,
      ingredients
    };

    return buildConsensus(mlResult, krrResult, integrationLogs);
  }

  integrationLogs.push('Dispatching payload to fallback Machine Learning endpoint...');
  let mlResult;
  try {
    mlResult = await analyzeProductWithGemini(productName, ingredients, madhab);
    integrationLogs.push(`Fallback ML Engine completed. AI verdict: ${mlResult.verdict}.`);
  } catch (error) {
    integrationLogs.push('WARNING: Fallback ML API unreachable. Engaging Offline Fallback Model (Naive Bayes).');
    const fallbackResult = scoreIngredients(ingredients);
    mlResult = {
      verdict: fallbackResult.verdict,
      confidence: Math.round(fallbackResult.confidence * 100),
      reason: `(Offline Fallback Active) Local statistical model evaluated text. Key influencing terms: ${fallbackResult.influencingTerms.join(', ')}.`,
      flagged_ingredients: [],
      recommendation: 'System running locally. Rule-based evaluation is accurate, but ML context may be limited.',
      name: productName,
      ingredients
    };
    integrationLogs.push(`Offline Fallback completed. Local AI verdict: ${mlResult.verdict}.`);
  }

  return buildConsensus(mlResult, krrResult, integrationLogs);
};

export const runIntegratedAnalysis = async (
  productName: string,
  ingredients: string,
  madhab: string,
  certifyingBody = '',
  options: { barcode?: string; brand?: string; image?: string | null } = {}
): Promise<IntegratedAnalysisResult> => {
  try {
    return await callBackendAnalyze({
      productName,
      ingredients,
      certifyingBody,
      barcode: options.barcode,
      brand: options.brand,
      image: options.image
    });
  } catch (error) {
    console.warn('Flask backend unavailable; using legacy frontend analysis fallback:', error);
    return runLegacyIntegratedAnalysis(productName, ingredients, madhab);
  }
};

export const runIntegratedBarcodeAnalysis = async (
  barcode: string,
  madhab: string,
  certifyingBody = ''
): Promise<IntegratedAnalysisResult> => {
  try {
    return await callBackendAnalyze({ barcode, certifyingBody });
  } catch (error) {
    console.warn('Flask barcode analysis unavailable; falling back to unknown-product local analysis:', error);
    return runLegacyIntegratedAnalysis('Unknown Barcode Product', 'No ingredients listed.', madhab);
  }
};

export const runIntegratedImageAnalysis = async (
  imageBase64: string,
  madhab: string,
  localOcrText?: string,
  certifyingBody = ''
): Promise<IntegratedAnalysisResult> => {
  if (localOcrText?.trim()) {
    try {
      return await callBackendAnalyze({
        productName: 'Photo Scan',
        ocrText: localOcrText.trim(),
        certifyingBody,
        image: imageBase64.startsWith('data:image') ? imageBase64 : null
      });
    } catch (error) {
      console.warn('Flask image-text analysis unavailable; using legacy image fallback:', error);
    }
  }

  const integrationLogs: string[] = ['Initializing fallback Integrated Vision Pipeline (Gemini Image -> KR&R).'];
  integrationLogs.push('Dispatching image to fallback Machine Learning Vision endpoint...');
  let mlResult;
  try {
    mlResult = await analyzeImageWithGemini(imageBase64, madhab);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gemini vision API is unavailable.';
    integrationLogs.push(`WARNING: Vision ML unavailable. ${message}`);

    if (localOcrText?.trim()) {
      const extractedText = localOcrText.trim();
      integrationLogs.push(`Offline browser OCR fallback extracted text: "${extractedText}".`);
      integrationLogs.push('Routing local OCR text through KR&R and local ML fallback.');

      const krrResult = runRuleBasedInference(extractedText);
      const fallbackResult = scoreIngredients(extractedText);
      const influencingTerms = fallbackResult.influencingTerms.join(', ') || 'OCR text matched the rule base';
      mlResult = {
        verdict: fallbackResult.verdict,
        confidence: Math.round(fallbackResult.confidence * 100),
        reason: `(Offline OCR Active) Local browser OCR extracted label text and the local statistical model evaluated it. Key influencing terms: ${influencingTerms}.`,
        flagged_ingredients: [],
        recommendation: 'Verify the extracted text against the package label. If the label contains pork, alcohol, or a haram E-number, avoid the product.',
        name: 'Photo Scan (Local OCR)',
        ingredients: extractedText
      };

      return buildConsensus(mlResult, krrResult, integrationLogs);
    }

    const krrResult = runRuleBasedInference('');
    return {
      finalVerdict: 'MASHBOOH',
      confidence: 50,
      reason: 'Image scan fallback is active, but no usable OCR text was available. The result is marked doubtful until ingredient text is entered.',
      flagged_ingredients: [],
      recommendation: 'Paste ingredients manually or configure the Flask Google Vision backend.',
      name: 'Photo Scan (OCR Unavailable)',
      ingredients: 'Image uploaded, but ingredients could not be extracted.',
      architectureDetails: {
        krrAnalysis: krrResult,
        mlAnalysis: {
          verdict: 'MASHBOOH',
          confidence: 50,
          reason: 'No OCR text available.',
          flagged_ingredients: [],
          recommendation: 'Paste ingredients manually for analysis.'
        },
        integrationLogic: integrationLogs
      }
    };
  }
  integrationLogs.push(`Fallback ML Image Extraction completed. Identified ingredients: "${mlResult.ingredients}". AI verdict: ${mlResult.verdict}`);

  integrationLogs.push('Routing extracted text to KR&R Reasoning Engine...');
  const krrResult = runRuleBasedInference(mlResult.ingredients || '');
  integrationLogs.push(`KR&R Engine completed. Rule status: ${krrResult.status}. ${krrResult.rulesTriggered}/${krrResult.rulesEvaluated} rules triggered.`);

  return buildConsensus(mlResult, krrResult, integrationLogs);
};

