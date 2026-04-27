export const KNOWLEDGE_BASE = {
  haramKeywords: ['pork', 'lard', 'carmine', 'e120', 'cochineal', 'blood', 'alcohol', 'wine', 'beer', 'rum', 'bacon', 'ham'],
  mashboohKeywords: ['gelatin', 'e471', 'e472', 'e481', 'glycerin', 'glycerol', 'whey', 'rennet', 'natural flavor', 'emulsifier']
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

  KNOWLEDGE_BASE.haramKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      flags.push({ ingredient: keyword, type: 'HARAM' });
      logicPath.push(`Rule matched: found HARAM keyword "${keyword}". Status escalated to HARAM.`);
      status = 'HARAM';
    }
  });

  KNOWLEDGE_BASE.mashboohKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
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
