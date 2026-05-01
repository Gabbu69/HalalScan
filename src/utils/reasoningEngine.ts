// src/utils/reasoningEngine.ts
import { ENUMBERS_LIST, HALAL_RULES } from '../constants/halalRules';

export const KNOWLEDGE_BASE = {
  haramKeywords: [
    'pork', 'lard', 'bacon', 'ham', 'pepperoni', 'chorizo', 'pork fat', 'pork gelatin',
    'pork belly', 'pork blood', 'pork enzymes', 'pork rinds', 'prosciutto', 'pancetta',
    'guanciale', 'mortadella', 'coppa', 'speck', 'jamon', 'jamon serrano', 'serrano ham',
    'chicharron',
    'alcohol', 'ethanol', 'wine', 'beer', 'rum', 'vodka', 'whiskey', 'brandy', 'liqueur',
    'bourbon', 'sake', 'sherry', 'marsala', 'cognac', 'mirin',
    'blood', 'carmine', 'cochineal', 'shellac', 'bone phosphate', 'l-cysteine'
  ],
  mashboohKeywords: [
    'gelatin', 'gelatine', 'glycerin', 'glycerol', 'mono and diglycerides', 'monoglycerides', 'diglycerides',
    'calcium stearate', 'magnesium stearate', 'whey', 'rennet', 'natural flavors', 'artificial flavor',
    'emulsifier', 'stabilizer', 'lecithin', 'soy lecithin', 'confectioner\'s glaze',
    'confectioners glaze', 'pepsin', 'lipase', 'trypsin'
  ]
};

export type InferenceResult = {
  status: 'HALAL' | 'HARAM' | 'MASHBOOH' | 'UNKNOWN';
  confidence: number;
  flags: { ingredient: string; type: 'HARAM' | 'MASHBOOH' | 'HALAL'; ruleId?: string }[];
  logicPath: string[];
};

export const runRuleBasedInference = (ingredientsText: string): InferenceResult => {
  if (!ingredientsText) {
    return { status: 'UNKNOWN', confidence: 0, flags: [], logicPath: ['No base facts provided.'] };
  }
  
  const normalizeText = (value: string) => value
    .toLowerCase()
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/\be[\s-]+(?=\d)/g, 'e');

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hasExactTerm = (source: string, term: string) => {
    const normalizedTerm = escapeRegExp(normalizeText(term));
    return new RegExp(`(^|[^a-z0-9])${normalizedTerm}([^a-z0-9]|$)`, 'i').test(source);
  };

  const text = normalizeText(ingredientsText);
  const tokens = text.match(/\b[a-z0-9-]+\b/g) || [];
  const flags: InferenceResult['flags'] = [];
  const logicPath: string[] = ['[FORWARD CHAINING INIT] Extracting base facts from ingredients.'];
  
  // Forward Chaining Step 1: Base Facts Extraction
  const extractedIngredients = Array.from(new Set(tokens));
  logicPath.push(`Extracted facts: ${extractedIngredients.length} tokens found.`);

  // Forward Chaining Step 2: Apply Rules (Derive Conclusions)
  let haramScore = 0;
  let mashboohScore = 0;
  let halalScore = 0;

  // Check E-Numbers
  ENUMBERS_LIST.HARAM.forEach(enumNum => {
    if (hasExactTerm(text, enumNum)) {
      flags.push({ ingredient: enumNum, type: 'HARAM', ruleId: 'R001' });
      logicPath.push(`Rule match [R001]: Found Haram E-Number ${enumNum}.`);
      haramScore += 100; // High weight for definitive haram
    }
  });

  ENUMBERS_LIST.MASHBOOH.forEach(enumNum => {
    if (hasExactTerm(text, enumNum)) {
      flags.push({ ingredient: enumNum, type: 'MASHBOOH', ruleId: 'R002' });
      logicPath.push(`Rule match [R002]: Found Mashbooh E-Number ${enumNum}.`);
      mashboohScore += 50;
    }
  });

  ENUMBERS_LIST.HALAL.forEach(enumNum => {
    if (hasExactTerm(text, enumNum)) {
      flags.push({ ingredient: enumNum, type: 'HALAL', ruleId: 'R003' });
      logicPath.push(`Rule match [R003]: Found Halal E-Number ${enumNum}.`);
      halalScore += 10;
    }
  });

  // Check Keywords
  KNOWLEDGE_BASE.haramKeywords.forEach(keyword => {
    if (hasExactTerm(text, keyword)) {
      flags.push({ ingredient: keyword, type: 'HARAM', ruleId: 'R008' });
      logicPath.push(`Rule match [R008/etc]: Found Haram keyword "${keyword}".`);
      haramScore += 100;
    }
  });

  KNOWLEDGE_BASE.mashboohKeywords.forEach(keyword => {
    if (hasExactTerm(text, keyword)) {
      flags.push({ ingredient: keyword, type: 'MASHBOOH', ruleId: 'R013' });
      logicPath.push(`Rule match: Found Mashbooh keyword "${keyword}". Status ambiguous.`);
      mashboohScore += 40;
    }
  });

  // Forward Chaining Step 3: Conflict Resolution & Confidence Scoring
  logicPath.push('[CONFLICT RESOLUTION] Evaluating derived facts against priority tiers (HARAM > MASHBOOH > HALAL).');
  
  let finalStatus: 'HALAL' | 'HARAM' | 'MASHBOOH' = 'HALAL';
  let confidence = 1.0;

  if (haramScore > 0) {
    finalStatus = 'HARAM';
    confidence = Math.min(0.8 + (haramScore / 500), 1.0);
    logicPath.push(`Resolution: HARAM tier prioritized. Score: ${haramScore}. Verdict: HARAM.`);
  } else if (mashboohScore > 0) {
    finalStatus = 'MASHBOOH';
    // Uncertainty handling: More mashbooh ingredients = higher confidence in it being mashbooh
    confidence = Math.min(0.6 + (mashboohScore / 200), 0.95);
    logicPath.push(`Resolution: MASHBOOH tier prioritized. Score: ${mashboohScore}. Verdict: MASHBOOH.`);
    logicPath.push(`Uncertainty Handling: Multiple ambiguous ingredients detected, require verification.`);
  } else {
    finalStatus = 'HALAL';
    confidence = Math.min(0.7 + (halalScore / 100), 0.99); // Cannot be 100% without certification
    logicPath.push('Resolution: No Haram/Mashbooh conflicts. Verdict: HALAL.');
  }

  return { 
    status: finalStatus, 
    confidence: parseFloat(confidence.toFixed(2)),
    flags, 
    logicPath 
  };
};
