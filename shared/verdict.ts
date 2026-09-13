export type ProductVerdict = 'HALAL COMPLIANT' | 'NON-COMPLIANT' | 'REQUIRES REVIEW';
export type IngredientEvidence = {
  ingredient: string; status: string; reason?: string; source?: string;
  api_status?: string; kb_status?: string; confidence?: number; rule_ids?: string[];
  matched_rules?: { id: string; title?: string; reason?: string; source?: string; status?: string }[];
};
export const hasUsableIngredients = (text: unknown): text is string => {
  if (typeof text !== 'string') return false;
  const clean = text.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ').trim();
  return clean.length >= 2 && !['no ingredients', 'no ingredients listed', 'ingredients unavailable', 'ingredients not available', 'ingredients not listed', 'unknown', 'unknown ingredients', 'not available', 'na', 'ingredients', 'image uploaded but ingredients could not be extracted'].includes(clean);
};
/** Missing evidence and unfamiliar statuses never produce a positive verdict. */
export function decideVerdict(text: unknown, rows: IngredientEvidence[]): ProductVerdict {
  if (rows.some(row => row.status === 'HARAM')) return 'NON-COMPLIANT';
  if (!hasUsableIngredients(text) || !rows.length || rows.some(row => row.status !== 'HALAL')) return 'REQUIRES REVIEW';
  return 'HALAL COMPLIANT';
}
export function normalizeVerdict(value: unknown): ProductVerdict {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (['HARAM', 'NON-COMPLIANT'].includes(normalized)) return 'NON-COMPLIANT';
  if (['HALAL', 'HALAL COMPLIANT'].includes(normalized)) return 'HALAL COMPLIANT';
  return 'REQUIRES REVIEW';
}
export const verdictCopy: Record<ProductVerdict, { reason: string; recommendation: string }> = {
  'NON-COMPLIANT': { reason: 'The available evidence identifies one or more non-compliant ingredients.', recommendation: 'Check the flagged ingredients and their sources before choosing this product.' },
  'REQUIRES REVIEW': { reason: 'There is not enough resolved ingredient evidence to complete this check.', recommendation: 'Review the full label. Ask the manufacturer or a qualified halal authority about unresolved ingredient sources.' },
  'HALAL COMPLIANT': { reason: 'All listed ingredients matched positive screening evidence. This is an ingredient check, not product certification.', recommendation: 'Compare this ingredient list with your package and check product certification separately.' },
};
