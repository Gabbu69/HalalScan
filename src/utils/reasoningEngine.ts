// src/utils/reasoningEngine.ts
import {
  evaluateIngredientAgainstCanonicalRules,
  splitIngredients,
  STATUS_PRIORITY,
  type CanonicalRuleStatus,
} from './canonicalKnowledgeBase';

const normalizeInputText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/\be[\s-]+(?=\d)/g, 'e');

const INSUFFICIENT_INGREDIENT_PATTERNS = [
  /^no ingredients?$/,
  /^no ingredients? listed$/,
  /^no ingredients? available$/,
  /^ingredients? unavailable$/,
  /^ingredients? not available$/,
  /^ingredients? not listed$/,
  /^ingredients? not provided$/,
  /^ingredients? not found$/,
  /^ingredients? unknown$/,
  /^unknown$/,
  /^unknown ingredients?$/,
  /^not available$/,
  /^n\/?a$/,
];

export const hasUsableIngredientText = (ingredientsText: string) => {
  const normalized = normalizeInputText(ingredientsText)
    .replace(/[^a-z0-9/\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return Boolean(normalized) && !INSUFFICIENT_INGREDIENT_PATTERNS.some(pattern => pattern.test(normalized));
};

const OCR_HARAM_PATTERNS: Array<{ ingredient: string; ruleId: string; patterns: RegExp[] }> = [
  {
    ingredient: 'pork',
    ruleId: 'R022',
    patterns: [
      /(^|[^a-z0-9])p\s*[o0]\s*r\s*[kx]([^a-z0-9]|$)/i,
      /(^|[^a-z0-9])p\s*[o0]\s*r\s*[kx]\s*(?:&|and|n)?\s*b\s*e\s*a\s*n\s*s?([^a-z0-9]|$)/i,
      /(^|[^a-z0-9])p\s*[o0]\s*r\s*[kx]\s*b\s*e\s*a\s*n\s*s?([^a-z0-9]|$)/i,
    ],
  },
  {
    ingredient: 'bacon',
    ruleId: 'R024',
    patterns: [
      /(^|[^a-z0-9])b\s*[a4]\s*c\s*[o0]\s*n([^a-z0-9]|$)/i,
    ],
  },
  {
    ingredient: 'ham',
    ruleId: 'R024',
    patterns: [
      /(^|[^a-z0-9])h\s*[a4]\s*m([^a-z0-9]|$)/i,
    ],
  },
];

export type InferenceResult = {
  status: 'HALAL' | 'HARAM' | 'MASHBOOH' | 'UNKNOWN';
  confidence: number;
  flags: { ingredient: string; type: 'HARAM' | 'MASHBOOH' | 'HALAL'; ruleId?: string }[];
  logicPath: string[];
};

const mapCanonicalStatus = (status: CanonicalRuleStatus): InferenceResult['status'] => {
  if (status === 'DOUBTFUL') return 'MASHBOOH';
  if (status === 'INFO') return 'UNKNOWN';
  return status;
};

export const runRuleBasedInference = (ingredientsText: string): InferenceResult => {
  if (!ingredientsText || !hasUsableIngredientText(ingredientsText)) {
    return {
      status: 'MASHBOOH',
      confidence: 0.55,
      flags: [{ ingredient: 'insufficient ingredient information', type: 'MASHBOOH', ruleId: 'INSUFFICIENT_DATA' }],
      logicPath: [
        '[FORWARD CHAINING INIT] No usable ingredient facts were provided.',
        'Resolution: insufficient data is treated as MASHBOOH until the product label can be verified.',
      ],
    };
  }

  const text = normalizeInputText(ingredientsText);
  const tokens = text.match(/\b[a-z0-9-]+\b/g) || [];
  const flags: InferenceResult['flags'] = [];
  const logicPath: string[] = ['[FORWARD CHAINING INIT] Extracting ingredient facts from canonical knowledge-base input.'];

  const extractedIngredients = Array.from(new Set(tokens));
  logicPath.push(`Extracted facts: ${extractedIngredients.length} tokens found.`);

  const ingredientResults = splitIngredients(ingredientsText).map(ingredient =>
    evaluateIngredientAgainstCanonicalRules(ingredient)
  );
  logicPath.push(`Canonical ingredient facts: ${ingredientResults.length} ingredient segments evaluated.`);

  ingredientResults.forEach(result => {
    result.matched_rules.forEach(rule => {
      const mappedStatus = mapCanonicalStatus(rule.status);
      if (mappedStatus !== 'UNKNOWN') {
        flags.push({
          ingredient: result.ingredient,
          type: mappedStatus,
          ruleId: rule.id,
        });
      }
      logicPath.push(`Rule match [${rule.id}]: "${result.ingredient}" -> ${rule.status} (${rule.title}).`);
    });
  });

  OCR_HARAM_PATTERNS.forEach(rule => {
    const alreadyFlagged = flags.some(flag => flag.ingredient === rule.ingredient && flag.type === 'HARAM');
    if (!alreadyFlagged && rule.patterns.some(pattern => pattern.test(text))) {
      flags.push({ ingredient: rule.ingredient, type: 'HARAM', ruleId: rule.ruleId });
      logicPath.push(`OCR-tolerant rule match [${rule.ruleId}]: Found HARAM keyword variant "${rule.ingredient}".`);
    }
  });

  logicPath.push('[CONFLICT RESOLUTION] Evaluating derived facts against priority tiers (HARAM > DOUBTFUL/MASHBOOH > UNKNOWN > HALAL).');

  const strongestResult = ingredientResults.reduce<CanonicalRuleStatus>((strongest, result) =>
    STATUS_PRIORITY[result.status] > STATUS_PRIORITY[strongest] ? result.status : strongest
  , 'HALAL');
  const hasOcrHaram = flags.some(flag => flag.type === 'HARAM');
  const hasHaram = strongestResult === 'HARAM' || hasOcrHaram;
  const hasDoubtful = strongestResult === 'DOUBTFUL';
  const explicitHalalCount = ingredientResults.filter(result => result.status === 'HALAL').length;

  let finalStatus: InferenceResult['status'] = 'HALAL';
  let confidence = 0.75;

  if (hasHaram) {
    finalStatus = 'HARAM';
    confidence = 0.98;
    logicPath.push('Resolution: HARAM tier prioritized. Verdict: HARAM.');
  } else if (hasDoubtful) {
    finalStatus = 'MASHBOOH';
    confidence = 0.9;
    logicPath.push('Resolution: DOUBTFUL/MASHBOOH tier prioritized. Verdict: MASHBOOH.');
    logicPath.push('Uncertainty handling: source-dependent ingredients require verification.');
  } else {
    confidence = Math.min(0.75 + (explicitHalalCount / Math.max(ingredientResults.length, 1)) * 0.2, 0.95);
    logicPath.push('Resolution: no HARAM or DOUBTFUL canonical rules fired. Verdict: HALAL for local KR&R screening.');
  }

  return {
    status: finalStatus,
    confidence: parseFloat(confidence.toFixed(2)),
    flags,
    logicPath,
  };
};
