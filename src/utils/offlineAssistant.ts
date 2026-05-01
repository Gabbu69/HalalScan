import { scoreIngredients } from './mlModel';
import { runRuleBasedInference } from './reasoningEngine';

const verdictText = {
  HALAL: 'likely HALAL',
  HARAM: 'HARAM',
  MASHBOOH: 'MASHBOOH / doubtful',
  UNKNOWN: 'unclear'
};

export const buildOfflineAssistantResponse = (query: string, madhab: string) => {
  const krrResult = runRuleBasedInference(query);
  const mlResult = scoreIngredients(query);
  const flags = krrResult.flags.map(flag => `${flag.ingredient} (${flag.type})`);
  const isGeneral = madhab === 'General';

  if (krrResult.status !== 'UNKNOWN' && krrResult.flags.length > 0) {
    return [
      'Offline mode: Gemini is not configured, so I checked your question with the local ML model and KR&R rule engine.',
      '',
      `Verdict: ${verdictText[krrResult.status]}.`,
      flags.length ? `Flagged: ${flags.join(', ')}.` : '',
      `Local ML also predicted ${mlResult.verdict} with ${Math.round(mlResult.confidence * 100)}% confidence.`,
      '',
      krrResult.status === 'HARAM'
        ? 'Recommendation: avoid this product unless a trusted halal authority gives a clear exception.'
        : krrResult.status === 'MASHBOOH'
          ? 'Recommendation: check the source, look for halal certification, or choose a clearer alternative.'
          : 'Recommendation: no prohibited or doubtful trigger was found in the local rule base.',
      '',
      'Note: this offline answer is rule-based and cannot interpret photos, labels, or unusual ingredient wording as well as Gemini.'
    ].filter(Boolean).join('\n');
  }

  return [
    'Offline mode: Gemini is not configured, so I can only use the local halal knowledge base.',
    '',
    isGeneral
      ? 'Ask about a specific ingredient or paste an ingredient list, and I can check for pork derivatives, alcohol terms, E-numbers, gelatin, enzymes, emulsifiers, and other doubtful additives.'
      : `For ${madhab} mode, paste the ingredient list and I will screen it using the local halal rules. If scholars differ, verify the final ruling with a trusted authority.`,
    '',
    `Local ML guess for your message: ${mlResult.verdict} (${Math.round(mlResult.confidence * 100)}% confidence).`,
    mlResult.influencingTerms.length ? `Influencing terms: ${mlResult.influencingTerms.join(', ')}.` : '',
    '',
    'For best results without Gemini, use the scanner text box and paste the actual ingredients.'
  ].filter(Boolean).join('\n');
};
