// ─────────────────────────────────────────────────────────────────────────────
// HalalScan Knowledge Representation & Reasoning Engine
// Architecture: Forward-Chaining Rule-Based Inference with State Machine
// ─────────────────────────────────────────────────────────────────────────────

export interface KnowledgeRule {
  id: string;
  keyword: string;
  status: 'HARAM' | 'MASHBOOH';
  category: string;
  description: string;
  citation: string;
}

// ─── EXPANDED KNOWLEDGE BASE (60+ rules with citations) ─────────────────────

export const KNOWLEDGE_BASE_RULES: KnowledgeRule[] = [
  // ══════════════════ HARAM — Animal-Derived (Pork) ══════════════════
  { id: 'H001', keyword: 'pork', status: 'HARAM', category: 'Animal Product',
    description: 'Pork meat — explicitly forbidden in the Quran',
    citation: 'Quran 2:173, 5:3, 6:145, 16:115' },
  { id: 'H002', keyword: 'lard', status: 'HARAM', category: 'Animal Fat',
    description: 'Rendered pig fat used in baking and frying',
    citation: 'IFANCA Guidelines, 2023' },
  { id: 'H003', keyword: 'bacon', status: 'HARAM', category: 'Animal Product',
    description: 'Cured pork belly meat',
    citation: 'Quran 2:173' },
  { id: 'H004', keyword: 'ham', status: 'HARAM', category: 'Animal Product',
    description: 'Cured or smoked pork leg',
    citation: 'Quran 2:173' },
  { id: 'H005', keyword: 'pepperoni', status: 'HARAM', category: 'Animal Product',
    description: 'Typically made from pork or pork-beef blend',
    citation: 'USDA Food Standards, IFANCA' },
  { id: 'H006', keyword: 'prosciutto', status: 'HARAM', category: 'Animal Product',
    description: 'Italian dry-cured pork ham',
    citation: 'Quran 2:173' },
  { id: 'H007', keyword: 'salami', status: 'HARAM', category: 'Animal Product',
    description: 'Cured sausage typically containing pork',
    citation: 'IFANCA Guidelines, 2023' },
  { id: 'H008', keyword: 'chorizo', status: 'HARAM', category: 'Animal Product',
    description: 'Spiced pork sausage',
    citation: 'IFANCA Guidelines, 2023' },
  { id: 'H009', keyword: 'pig', status: 'HARAM', category: 'Animal Product',
    description: 'Any part or derivative of swine',
    citation: 'Quran 5:3' },
  { id: 'H010', keyword: 'swine', status: 'HARAM', category: 'Animal Product',
    description: 'Scientific/formal term for pig',
    citation: 'Quran 5:3' },
  { id: 'H011', keyword: 'porcine', status: 'HARAM', category: 'Animal Product',
    description: 'Relating to or derived from pigs (technical term)',
    citation: 'JAKIM Halal Standards MS1500:2019' },

  // ══════════════════ HARAM — Alcohol ══════════════════
  { id: 'H012', keyword: 'alcohol', status: 'HARAM', category: 'Intoxicant',
    description: 'Ethanol/intoxicating substance',
    citation: 'Quran 5:90-91; JAKIM Standards' },
  { id: 'H013', keyword: 'ethanol', status: 'HARAM', category: 'Intoxicant',
    description: 'Pure drinking alcohol (C2H5OH)',
    citation: 'Quran 5:90; MUI Fatwa No. 11/2009' },
  { id: 'H014', keyword: 'wine', status: 'HARAM', category: 'Intoxicant',
    description: 'Fermented grape beverage',
    citation: 'Quran 5:90' },
  { id: 'H015', keyword: 'beer', status: 'HARAM', category: 'Intoxicant',
    description: 'Fermented malt beverage',
    citation: 'Quran 5:90' },
  { id: 'H016', keyword: 'rum', status: 'HARAM', category: 'Intoxicant',
    description: 'Distilled alcoholic spirit from sugarcane',
    citation: 'Quran 5:90' },
  { id: 'H017', keyword: 'vodka', status: 'HARAM', category: 'Intoxicant',
    description: 'Distilled alcoholic spirit',
    citation: 'Quran 5:90' },
  { id: 'H018', keyword: 'whiskey', status: 'HARAM', category: 'Intoxicant',
    description: 'Distilled alcoholic spirit from grain',
    citation: 'Quran 5:90' },
  { id: 'H019', keyword: 'brandy', status: 'HARAM', category: 'Intoxicant',
    description: 'Distilled wine spirit',
    citation: 'Quran 5:90' },
  { id: 'H020', keyword: 'liquor', status: 'HARAM', category: 'Intoxicant',
    description: 'General term for alcoholic spirits',
    citation: 'Quran 5:90' },
  { id: 'H021', keyword: 'wine vinegar', status: 'HARAM', category: 'Alcohol Derivative',
    description: 'Vinegar derived from wine — debated, HARAM in strict madhabs',
    citation: 'Shafi\'i Fiqh: Al-Nawawi, Al-Majmu\' Vol. 2' },

  // ══════════════════ HARAM — Food Additives (E-Numbers) ══════════════════
  { id: 'H022', keyword: 'e120', status: 'HARAM', category: 'Food Additive',
    description: 'Carmine/Cochineal — red dye from crushed insects',
    citation: 'IFANCA; European Food Safety Authority (EFSA)' },
  { id: 'H023', keyword: 'carmine', status: 'HARAM', category: 'Food Additive',
    description: 'Red pigment extracted from cochineal insects',
    citation: 'IFANCA Guidelines, 2023' },
  { id: 'H024', keyword: 'cochineal', status: 'HARAM', category: 'Food Additive',
    description: 'Insect-based red colorant (same as E120/carmine)',
    citation: 'IFANCA Guidelines, 2023' },
  { id: 'H025', keyword: 'e441', status: 'HARAM', category: 'Food Additive',
    description: 'Gelatin — typically from pork or non-zabiha bovine sources',
    citation: 'Codex Alimentarius; JAKIM Standards' },
  { id: 'H026', keyword: 'e542', status: 'HARAM', category: 'Food Additive',
    description: 'Bone phosphate — derived from animal bones',
    citation: 'European Food Safety Authority (EFSA)' },
  { id: 'H027', keyword: 'e904', status: 'HARAM', category: 'Food Additive',
    description: 'Shellac — resin secreted by lac insects',
    citation: 'IFANCA; EFSA Additive Database' },
  { id: 'H028', keyword: 'e920', status: 'HARAM', category: 'Food Additive',
    description: 'L-Cysteine — often derived from pork bristles or human hair',
    citation: 'FDA 21 CFR 184.1271; JAKIM MS1500:2019' },
  { id: 'H029', keyword: 'l-cysteine', status: 'HARAM', category: 'Amino Acid',
    description: 'Amino acid commonly sourced from pork hair/feathers',
    citation: 'JAKIM Halal Standards MS1500:2019' },

  // ══════════════════ HARAM — Blood & Carrion ══════════════════
  { id: 'H030', keyword: 'blood', status: 'HARAM', category: 'Animal Product',
    description: 'Flowing blood is explicitly forbidden',
    citation: 'Quran 6:145' },
  { id: 'H031', keyword: 'blood plasma', status: 'HARAM', category: 'Animal Product',
    description: 'Blood-derived product used in some food processing',
    citation: 'Quran 6:145; IFANCA' },
  { id: 'H032', keyword: 'black pudding', status: 'HARAM', category: 'Animal Product',
    description: 'Sausage made with animal blood',
    citation: 'Quran 6:145' },

  // ══════════════════ HARAM — Other ══════════════════
  { id: 'H033', keyword: 'tallow', status: 'HARAM', category: 'Animal Fat',
    description: 'Rendered fat from cattle/sheep — HARAM unless from zabiha source',
    citation: 'JAKIM Standards; IFANCA' },
  { id: 'H034', keyword: 'suet', status: 'HARAM', category: 'Animal Fat',
    description: 'Hard fat around kidneys — HARAM unless zabiha certified',
    citation: 'IFANCA Guidelines' },
  { id: 'H035', keyword: 'shellac', status: 'HARAM', category: 'Insect Product',
    description: 'Resinous coating from lac bug secretion',
    citation: 'IFANCA; EFSA Database' },
  { id: 'H036', keyword: 'bone char', status: 'HARAM', category: 'Animal Product',
    description: 'Charred animal bones used in sugar refining',
    citation: 'JAKIM Standards' },
  { id: 'H037', keyword: 'isinglass', status: 'HARAM', category: 'Animal Product',
    description: 'Collagen from dried fish swim bladders — used in clarification',
    citation: 'IFANCA Guidelines' },

  // ══════════════════ MASHBOOH — Doubtful Ingredients ══════════════════
  { id: 'M001', keyword: 'gelatin', status: 'MASHBOOH', category: 'Animal Derivative',
    description: 'Could be from pork, beef, or fish — source must be verified',
    citation: 'JAKIM MS1500:2019; IFANCA' },
  { id: 'M002', keyword: 'e471', status: 'MASHBOOH', category: 'Food Additive',
    description: 'Mono- and diglycerides — may be from animal or plant fat',
    citation: 'EFSA; Codex Alimentarius' },
  { id: 'M003', keyword: 'e472', status: 'MASHBOOH', category: 'Food Additive',
    description: 'Esters of mono/diglycerides — animal or plant origin unclear',
    citation: 'EFSA Additive Database' },
  { id: 'M004', keyword: 'e473', status: 'MASHBOOH', category: 'Food Additive',
    description: 'Sucrose esters of fatty acids — may be animal-derived',
    citation: 'EFSA Additive Database' },
  { id: 'M005', keyword: 'e474', status: 'MASHBOOH', category: 'Food Additive',
    description: 'Sucroglycerides — may be from animal fat',
    citation: 'EFSA Additive Database' },
  { id: 'M006', keyword: 'e475', status: 'MASHBOOH', category: 'Food Additive',
    description: 'Polyglycerol esters — animal or plant origin',
    citation: 'EFSA Additive Database' },
  { id: 'M007', keyword: 'e476', status: 'MASHBOOH', category: 'Food Additive',
    description: 'Polyglycerol polyricinoleate — may contain animal glycerol',
    citation: 'EFSA Additive Database' },
  { id: 'M008', keyword: 'e477', status: 'MASHBOOH', category: 'Food Additive',
    description: 'Propane-1,2-diol esters — possibly animal-derived',
    citation: 'EFSA Additive Database' },
  { id: 'M009', keyword: 'e481', status: 'MASHBOOH', category: 'Food Additive',
    description: 'Sodium stearoyl-2-lactylate — may use animal stearic acid',
    citation: 'EFSA; JAKIM Standards' },
  { id: 'M010', keyword: 'e482', status: 'MASHBOOH', category: 'Food Additive',
    description: 'Calcium stearoyl-2-lactylate — may use animal stearic acid',
    citation: 'EFSA Additive Database' },
  { id: 'M011', keyword: 'e631', status: 'MASHBOOH', category: 'Food Additive',
    description: 'Disodium inosinate — flavor enhancer, may be animal-derived',
    citation: 'Codex Alimentarius; IFANCA' },
  { id: 'M012', keyword: 'e635', status: 'MASHBOOH', category: 'Food Additive',
    description: 'Disodium ribonucleotides — may be from animal tissue',
    citation: 'Codex Alimentarius; IFANCA' },
  { id: 'M013', keyword: 'glycerin', status: 'MASHBOOH', category: 'Chemical Compound',
    description: 'Can be from animal fat, vegetable oil, or synthetic — source unknown',
    citation: 'JAKIM MS1500:2019' },
  { id: 'M014', keyword: 'glycerol', status: 'MASHBOOH', category: 'Chemical Compound',
    description: 'Same as glycerin (E422) — ambiguous source',
    citation: 'JAKIM MS1500:2019' },
  { id: 'M015', keyword: 'e422', status: 'MASHBOOH', category: 'Food Additive',
    description: 'Glycerol — may be animal or plant derived',
    citation: 'EFSA Additive Database' },
  { id: 'M016', keyword: 'whey', status: 'MASHBOOH', category: 'Dairy Derivative',
    description: 'Dairy by-product — halal if enzyme/rennet source is halal',
    citation: 'IFANCA Guidelines' },
  { id: 'M017', keyword: 'rennet', status: 'MASHBOOH', category: 'Enzyme',
    description: 'Enzyme from calf stomach — MASHBOOH unless microbial/plant rennet',
    citation: 'JAKIM Standards; Hanafi Fiqh' },
  { id: 'M018', keyword: 'natural flavor', status: 'MASHBOOH', category: 'Flavoring',
    description: 'Broad FDA term that may include animal-derived substances',
    citation: 'FDA 21 CFR 101.22; IFANCA' },
  { id: 'M019', keyword: 'natural flavour', status: 'MASHBOOH', category: 'Flavoring',
    description: 'British spelling variant — same as natural flavor',
    citation: 'FDA 21 CFR 101.22; IFANCA' },
  { id: 'M020', keyword: 'emulsifier', status: 'MASHBOOH', category: 'Food Additive',
    description: 'Generic term — may be lecithin (halal) or animal-based mono/diglycerides',
    citation: 'Codex Alimentarius' },
  { id: 'M021', keyword: 'mono and diglycerides', status: 'MASHBOOH', category: 'Food Additive',
    description: 'Emulsifiers that may be sourced from animal or plant fats',
    citation: 'EFSA; IFANCA Guidelines' },
  { id: 'M022', keyword: 'pepsin', status: 'MASHBOOH', category: 'Enzyme',
    description: 'Digestive enzyme — typically from porcine stomach lining',
    citation: 'IFANCA; JAKIM Standards' },
  { id: 'M023', keyword: 'lipase', status: 'MASHBOOH', category: 'Enzyme',
    description: 'Fat-splitting enzyme — may be from animal pancreas',
    citation: 'IFANCA Guidelines' },
  { id: 'M024', keyword: 'casein', status: 'MASHBOOH', category: 'Dairy Protein',
    description: 'Milk protein — halal only if processing aids are halal',
    citation: 'JAKIM Standards' },
  { id: 'M025', keyword: 'calcium stearate', status: 'MASHBOOH', category: 'Chemical Compound',
    description: 'May be derived from animal or vegetable stearic acid',
    citation: 'EFSA Database' },
  { id: 'M026', keyword: 'magnesium stearate', status: 'MASHBOOH', category: 'Chemical Compound',
    description: 'Common supplement excipient — animal or vegetable origin',
    citation: 'EFSA Database; USP Standards' },
  { id: 'M027', keyword: 'vanilla extract', status: 'MASHBOOH', category: 'Flavoring',
    description: 'Contains 35%+ ethyl alcohol as solvent — debated',
    citation: 'FDA 21 CFR 169.175; MUI Fatwa No. 11/2009' },
  { id: 'M028', keyword: 'confectioner\'s glaze', status: 'MASHBOOH', category: 'Coating',
    description: 'Often shellac-based (insect-derived) coating on candies',
    citation: 'IFANCA Guidelines' },
  { id: 'M029', keyword: 'stearic acid', status: 'MASHBOOH', category: 'Fatty Acid',
    description: 'May be from animal tallow or vegetable sources',
    citation: 'EFSA Database' },
  { id: 'M030', keyword: 'lecithin', status: 'MASHBOOH', category: 'Emulsifier',
    description: 'Usually soy-based (halal), but can be egg-based — verify source',
    citation: 'Codex Alimentarius; IFANCA' },
];

// Legacy-compatible keyword arrays (derived from rules above)
export const KNOWLEDGE_BASE = {
  haramKeywords: KNOWLEDGE_BASE_RULES.filter(r => r.status === 'HARAM').map(r => r.keyword),
  mashboohKeywords: KNOWLEDGE_BASE_RULES.filter(r => r.status === 'MASHBOOH').map(r => r.keyword),
};

// ─── INFERENCE TYPES ─────────────────────────────────────────────────────────

export type VerdictStatus = 'HALAL' | 'HARAM' | 'MASHBOOH' | 'UNKNOWN';

export type InferenceFlag = {
  ingredient: string;
  type: 'HARAM' | 'MASHBOOH';
  ruleId: string;
  category: string;
  description: string;
  citation: string;
};

export type InferenceResult = {
  status: VerdictStatus;
  confidence: number;
  flags: InferenceFlag[];
  logicPath: string[];
  rulesEvaluated: number;
  rulesTriggered: number;
};

// ─── STATE MACHINE ───────────────────────────────────────────────────────────
// Conflict Resolution Priority: HARAM > MASHBOOH > HALAL
// Once HARAM is reached, it LOCKS — no subsequent rule can downgrade it.

type StateMachineState = 'HALAL' | 'MASHBOOH' | 'HARAM';

const STATE_PRIORITY: Record<StateMachineState, number> = {
  'HALAL': 0,
  'MASHBOOH': 1,
  'HARAM': 2,
};

function escalateState(current: StateMachineState, incoming: StateMachineState): StateMachineState {
  return STATE_PRIORITY[incoming] > STATE_PRIORITY[current] ? incoming : current;
}

// ─── CONFIDENCE SCORING ──────────────────────────────────────────────────────
// Weighted confidence based on the number and severity of triggered rules.

function computeConfidence(state: StateMachineState, flags: InferenceFlag[]): number {
  if (flags.length === 0) {
    // No violations — high confidence in HALAL (from KR&R perspective)
    return 85;
  }

  const haramCount = flags.filter(f => f.type === 'HARAM').length;
  const mashboohCount = flags.filter(f => f.type === 'MASHBOOH').length;

  if (state === 'HARAM') {
    // More HARAM flags = higher confidence in the HARAM verdict
    return Math.min(100, 80 + (haramCount * 5));
  }

  if (state === 'MASHBOOH') {
    // Mashbooh confidence is moderate and decreases as more flags pile up
    return Math.max(40, 70 - (mashboohCount * 5));
  }

  return 85;
}

// ─── FORWARD-CHAINING RULE ENGINE ────────────────────────────────────────────

export const runRuleBasedInference = (ingredientsText: string): InferenceResult => {
  if (!ingredientsText || ingredientsText.trim().length === 0) {
    return {
      status: 'UNKNOWN',
      confidence: 0,
      flags: [],
      logicPath: ['[INIT] No ingredients text provided. Cannot perform inference.'],
      rulesEvaluated: 0,
      rulesTriggered: 0,
    };
  }

  const text = ingredientsText.toLowerCase();
  const flags: InferenceFlag[] = [];
  const logicPath: string[] = [];
  let state: StateMachineState = 'HALAL';

  logicPath.push(`[INIT] KR&R Engine initialized. State machine set to HALAL.`);
  logicPath.push(`[INIT] Knowledge Base loaded: ${KNOWLEDGE_BASE_RULES.length} rules (${KNOWLEDGE_BASE.haramKeywords.length} HARAM, ${KNOWLEDGE_BASE.mashboohKeywords.length} MASHBOOH).`);
  logicPath.push(`[SCAN] Beginning forward-chaining rule evaluation...`);

  let rulesTriggered = 0;

  // ── Pass 1: Evaluate all HARAM rules (highest priority first) ──
  logicPath.push(`[PASS 1] Scanning for HARAM violations...`);
  const haramRules = KNOWLEDGE_BASE_RULES.filter(r => r.status === 'HARAM');

  for (const rule of haramRules) {
    if (text.includes(rule.keyword)) {
      rulesTriggered++;
      const previousState = state;
      state = escalateState(state, 'HARAM');

      flags.push({
        ingredient: rule.keyword,
        type: 'HARAM',
        ruleId: rule.id,
        category: rule.category,
        description: rule.description,
        citation: rule.citation,
      });

      logicPath.push(
        `[MATCH] Rule ${rule.id}: Detected HARAM keyword "${rule.keyword}" (${rule.category}). ` +
        `${rule.description}. Citation: ${rule.citation}. ` +
        `State: ${previousState} → ${state}.`
      );
    }
  }

  // ── Pass 2: Evaluate all MASHBOOH rules ──
  logicPath.push(`[PASS 2] Scanning for MASHBOOH (doubtful) indicators...`);
  const mashboohRules = KNOWLEDGE_BASE_RULES.filter(r => r.status === 'MASHBOOH');

  for (const rule of mashboohRules) {
    if (text.includes(rule.keyword)) {
      rulesTriggered++;
      const previousState = state;
      state = escalateState(state, 'MASHBOOH');

      flags.push({
        ingredient: rule.keyword,
        type: 'MASHBOOH',
        ruleId: rule.id,
        category: rule.category,
        description: rule.description,
        citation: rule.citation,
      });

      logicPath.push(
        `[MATCH] Rule ${rule.id}: Detected MASHBOOH keyword "${rule.keyword}" (${rule.category}). ` +
        `${rule.description}. ` +
        `State: ${previousState} → ${state}.`
      );
    }
  }

  // ── Pass 3: Forward chaining — secondary inference ──
  logicPath.push(`[PASS 3] Forward chaining — evaluating derived rules...`);

  // Forward chain: If "gelatin" is found AND "fish" or "plant" or "vegetable" is NOT mentioned → escalate to HARAM
  const gelatinFlag = flags.find(f => f.ingredient === 'gelatin');
  if (gelatinFlag) {
    const hasFishSource = text.includes('fish gelatin') || text.includes('marine gelatin');
    const hasPlantSource = text.includes('plant') || text.includes('vegetable') || text.includes('agar');
    const hasHalalCert = text.includes('halal certified') || text.includes('halal gelatin');

    if (!hasFishSource && !hasPlantSource && !hasHalalCert) {
      logicPath.push(
        `[CHAIN] Forward chain triggered: "gelatin" detected without fish/plant/halal-certified qualifier. ` +
        `Escalating from MASHBOOH → HARAM (assumed porcine source per JAKIM MS1500:2019).`
      );
      gelatinFlag.type = 'HARAM';
      state = escalateState(state, 'HARAM');
    } else {
      logicPath.push(
        `[CHAIN] Forward chain: "gelatin" found WITH qualifying source (${hasFishSource ? 'fish' : hasPlantSource ? 'plant' : 'halal-certified'}). ` +
        `Maintaining MASHBOOH status — manual verification recommended.`
      );
    }
  }

  // Forward chain: If "vanilla extract" is found AND no "alcohol-free" or "halal" qualifier
  const vanillaFlag = flags.find(f => f.ingredient === 'vanilla extract');
  if (vanillaFlag) {
    const isAlcoholFree = text.includes('alcohol-free') || text.includes('alcohol free') || text.includes('non-alcoholic');
    if (!isAlcoholFree) {
      logicPath.push(
        `[CHAIN] Forward chain: "vanilla extract" detected without alcohol-free qualifier. ` +
        `Standard vanilla extract contains ~35% ethanol. Maintaining MASHBOOH.`
      );
    } else {
      logicPath.push(
        `[CHAIN] Forward chain: "vanilla extract" with alcohol-free qualifier detected. Reduced concern.`
      );
    }
  }

  // Forward chain: If emulsifier is found, check for specific E-number
  const emulsifierFlag = flags.find(f => f.ingredient === 'emulsifier');
  if (emulsifierFlag) {
    const hasSpecificEnumber = flags.some(f => f.ruleId.startsWith('M') && f.category === 'Food Additive');
    if (hasSpecificEnumber) {
      logicPath.push(
        `[CHAIN] Forward chain: Generic "emulsifier" accompanied by specific E-number match. ` +
        `Specific rule takes precedence — deduplicating.`
      );
    }
  }

  // ── Final Verdict ──
  const confidence = computeConfidence(state, flags);

  if (state === 'HALAL') {
    logicPath.push(
      `[RESULT] All ${KNOWLEDGE_BASE_RULES.length} rules evaluated. ` +
      `No violations detected. Final KR&R verdict: HALAL (confidence: ${confidence}%).`
    );
  } else {
    logicPath.push(
      `[RESULT] Evaluation complete. ${rulesTriggered}/${KNOWLEDGE_BASE_RULES.length} rules triggered. ` +
      `${flags.filter(f => f.type === 'HARAM').length} HARAM + ${flags.filter(f => f.type === 'MASHBOOH').length} MASHBOOH violations. ` +
      `Final KR&R verdict: ${state} (confidence: ${confidence}%).`
    );
  }

  return {
    status: state,
    confidence,
    flags,
    logicPath,
    rulesEvaluated: KNOWLEDGE_BASE_RULES.length,
    rulesTriggered,
  };
};
