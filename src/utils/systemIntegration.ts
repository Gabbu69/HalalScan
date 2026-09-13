import { CANONICAL_CERTIFYING_BODIES, evaluateIngredientAgainstCanonicalRules, splitIngredients } from './canonicalKnowledgeBase';
import { decideVerdict, hasUsableIngredients, normalizeVerdict, verdictCopy, type IngredientEvidence, type ProductVerdict } from '../../shared/verdict';
import { fetchJson } from './requests';
export type ProposalVerdict = ProductVerdict;
export type LegacyVerdict = 'HALAL' | 'HARAM' | 'MASHBOOH';
export type IntegratedAnalysisResult = {
  id?: string; finalVerdict: ProductVerdict; confidence: number; reason: string;
  flagged_ingredients: string[]; recommendation: string; name?: string;
  brand?: string; image?: string | null; barcode?: string; ingredients?: string;
  certification?: any; ingredient_results?: IngredientEvidence[]; triggered_rules?: string[];
  rubric_evidence?: any; evidenceMode: 'local-rules' | 'server-rules' | 'online-services';
  architectureDetails: { krrAnalysis: any; mlAnalysis: any; integrationLogic: string[] };
};
export function runLocalAnalysis(name: string, ingredients: string, certifyingBody = ''): IntegratedAnalysisResult {
  const rows: IngredientEvidence[] = hasUsableIngredients(ingredients) ? splitIngredients(ingredients).map(ingredient => {
    const result = evaluateIngredientAgainstCanonicalRules(ingredient);
    return { ...result, kb_status: result.status, api_status: 'UNAVAILABLE', source: 'knowledge-base', rule_ids: result.matched_rules.map(rule => rule.id) };
  }) : [];
  const finalVerdict = decideVerdict(ingredients, rows);
  const recognized = CANONICAL_CERTIFYING_BODIES.some(body => [body.name, ...body.aliases].some(alias => alias.toLowerCase() === certifyingBody.trim().toLowerCase()));
  return {
    finalVerdict, ...verdictCopy[finalVerdict], confidence: 0, name, ingredients,
    flagged_ingredients: rows.filter(row => row.status !== 'HALAL').map(row => row.ingredient),
    ingredient_results: rows, triggered_rules: [...new Set(rows.flatMap(row => row.rule_ids || []))],
    certification: { input: certifyingBody, recognized, status: recognized ? 'BODY RECOGNIZED' : 'NOT VERIFIED', reason: 'A body-name reference does not verify this product or its certificate.' },
    evidenceMode: 'local-rules',
    architectureDetails: { krrAnalysis: { status: finalVerdict, ingredientResults: rows }, mlAnalysis: { provider: 'Not used for local verdicts' }, integrationLogic: ['Local canonical ingredient rules. Unknown evidence requires verification.'] },
  };
}
export function adaptBackendResult(data: any): IntegratedAnalysisResult {
  if (!data || !Array.isArray(data.ingredient_results) || typeof data.ingredients !== 'string') throw new Error('The analysis service returned incomplete data.');
  const rows: IngredientEvidence[] = data.ingredient_results.filter((row: any) => row && typeof row.ingredient === 'string' && typeof row.status === 'string');
  let verdict = decideVerdict(data.ingredients, rows);
  if (verdict !== 'NON-COMPLIANT' && (normalizeVerdict(data.final_verdict) === 'REQUIRES REVIEW' || rows.length !== data.ingredient_results.length)) verdict = 'REQUIRES REVIEW';
  if (normalizeVerdict(data.final_verdict) === 'NON-COMPLIANT') verdict = 'NON-COMPLIANT';
  return {
    id: data.id, finalVerdict: verdict, ...verdictCopy[verdict], confidence: Number(data.confidence) || 0,
    name: data.product?.name || data.name || 'Ingredient check', brand: data.product?.brand || '',
    image: data.product?.image || null, barcode: data.product?.barcode || '', ingredients: data.ingredients,
    flagged_ingredients: rows.filter(row => row.status !== 'HALAL').map(row => row.ingredient),
    certification: data.certifying_body, ingredient_results: rows, triggered_rules: data.triggered_rules || [], rubric_evidence: data.rubric_evidence,
    evidenceMode: rows.some(row => ['HALAL', 'HARAM', 'DOUBTFUL', 'UNKNOWN'].includes(row.api_status || '')) ? 'online-services' : 'server-rules',
    architectureDetails: data.architectureDetails || { krrAnalysis: {}, mlAnalysis: {}, integrationLogic: [] },
  };
}
async function analyze(payload: Record<string, unknown>, signal?: AbortSignal) {
  return adaptBackendResult(await fetchJson('/api/analyze', { method: 'POST', body: JSON.stringify(payload), signal }, 25000));
}
export async function runIntegratedAnalysis(name: string, ingredients: string, _madhab = 'General', certifyingBody = '', options: { barcode?: string; brand?: string; image?: string | null; signal?: AbortSignal } = {}) {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return runLocalAnalysis(name, ingredients, certifyingBody);
    return await analyze({ productName: name, ingredients, certifyingBody, barcode: options.barcode, brand: options.brand }, options.signal);
  } catch (error) {
    if (options.signal?.aborted) throw error;
    return runLocalAnalysis(name, ingredients, certifyingBody);
  }
}
export async function runIntegratedBarcodeAnalysis(barcode: string, _madhab = 'General', certifyingBody = '', signal?: AbortSignal) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) throw new Error('Barcode lookup needs a connection. Enter the ingredients or open a saved result.');
  try { return await analyze({ barcode, certifyingBody }, signal); }
  catch (error) {
    if (signal?.aborted) throw error;
    throw new Error('The product lookup could not finish. Try again, or check the label using a photo or typed ingredients.');
  }
}
export async function runIntegratedImageAnalysis(_image: string, madhab = 'General', text = '', certifyingBody = '', signal?: AbortSignal) {
  if (!hasUsableIngredients(text)) return runLocalAnalysis('Label photo', '', certifyingBody);
  return runIntegratedAnalysis('Label photo', text, madhab, certifyingBody, { signal });
}
