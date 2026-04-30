export const KNOWLEDGE_BASE = {
  haramKeywords: [
    // --- Pork & Pork Derivatives ---
    'pork', 'lard', 'bacon', 'ham', 'prosciutto', 'pepperoni', 'chorizo',
    'pig fat', 'pork gelatin', 'pork enzymes', 'pancetta',
    // --- Alcohol ---
    'alcohol', 'ethanol', 'wine', 'beer', 'rum', 'vodka', 'whiskey',
    'brandy', 'liqueur', 'sake', 'mirin',
    // --- Blood Products ---
    'blood', 'blood plasma', 'black pudding',
    // --- Insect-Derived (Non-Halal by Majority) ---
    'carmine', 'e120', 'cochineal', 'shellac', 'e904',
    // --- E-Numbers (Confirmed Haram Sources) ---
    'e441',  // Gelatin (pork-sourced by default in EU/US)
    'e542',  // Bone phosphate (often pork)
    'e920',  // L-Cysteine (commonly from pig bristles or human hair)
    // --- Carnivorous / Predatory Animals ---
    'crocodile', 'frog', 'snake',
  ],
  mashboohKeywords: [
    // --- Ambiguous Gelatin & Emulsifiers ---
    'gelatin', 'gelatine',
    'e471', 'e472', 'e472a', 'e472b', 'e472c', 'e472e',
    'e473', 'e474', 'e475', 'e476', 'e477', 'e481', 'e482', 'e483',
    // --- Glycerides & Fatty Acid Esters ---
    'glycerin', 'glycerol', 'mono and diglycerides', 'monoglycerides', 'diglycerides',
    'e570',  // Stearic acid (animal or plant)
    'calcium stearate', 'magnesium stearate',
    // --- Whey & Dairy Processing ---
    'whey', 'whey powder', 'casein', 'rennet',
    // --- Vague / Unknown-Source Labels ---
    'natural flavor', 'natural flavors', 'natural flavoring', 'natural flavouring',
    'artificial flavor', 'emulsifier', 'stabilizer',
    // --- Other Doubtful Additives ---
    'e153',  // Vegetable carbon (processing may involve bone char)
    'e422',  // Glycerol (source unknown)
    'e470', 'e470a', 'e470b',  // Fatty acid salts
    'e491', 'e492', 'e493', 'e494', 'e495',  // Sorbitan esters
    'l-cysteine', 'lecithin', 'e322',  // Lecithin (soy vs animal)
    'pepsin', 'lipase', 'trypsin',  // Enzymes (animal or microbial?)
    'confectioner\'s glaze', 'pharmaceutical glaze',
  ]
};

export type InferenceResult = {
  status: 'HALAL' | 'HARAM' | 'MASHBOOH' | 'UNKNOWN';
  flags: { ingredient: string; type: 'HARAM' | 'MASHBOOH' }[];
  logicPath: string[];
};

export const runRuleBasedInference = (ingredientsText: string): InferenceResult => {
  if (!ingredientsText) {
    return { status: 'UNKNOWN', flags: [], logicPath: ['No ingredients provided.'] };
  }
  
  const text = ingredientsText.toLowerCase();
  const flags: { ingredient: string; type: 'HARAM' | 'MASHBOOH' }[] = [];
  const logicPath: string[] = ['Initiating KR&R scan against Knowledge Base.'];
  
  let status: 'HALAL' | 'HARAM' | 'MASHBOOH' = 'HALAL';

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  KNOWLEDGE_BASE.haramKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i');
    if (regex.test(text)) {
      flags.push({ ingredient: keyword, type: 'HARAM' });
      logicPath.push(`Rule matched: found HARAM keyword "${keyword}". Status escalated to HARAM.`);
      status = 'HARAM';
    }
  });

  KNOWLEDGE_BASE.mashboohKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i');
    if (regex.test(text)) {
      flags.push({ ingredient: keyword, type: 'MASHBOOH' });
      logicPath.push(`Rule matched: found MASHBOOH keyword "${keyword}".`);
      if (status !== 'HARAM') {
         status = 'MASHBOOH';
         logicPath.push(`Status set to MASHBOOH.`);
      }
    }
  });

  if (status === 'HALAL') {
      logicPath.push('No violations found in rule-based inference. Preliminary status: HALAL.');
  }

  return { flags, status, logicPath };
};
