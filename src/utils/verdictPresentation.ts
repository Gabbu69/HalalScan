import { normalizeVerdict, verdictCopy } from '../../shared/verdict';
export type VerdictTone = 'halal' | 'haram' | 'review';
export const getVerdictPresentation = (value: string) => {
  const verdict = normalizeVerdict(value);
  const tone: VerdictTone = verdict === 'NON-COMPLIANT' ? 'haram' : verdict === 'HALAL COMPLIANT' ? 'halal' : 'review';
  const primaryLabel = tone === 'halal' ? 'No flagged ingredients' : tone === 'haram' ? 'Non-compliant' : 'Needs verification';
  return { tone, primaryLabel, secondaryLabel: primaryLabel, summary: verdictCopy[verdict].reason,
    badgeClass: 'verdict-' + tone, softClass: 'verdict-soft-' + tone, textClass: 'verdict-text-' + tone, borderClass: 'verdict-border-' + tone };
};
export const verdictMatchesTone = (verdict: string, tone: VerdictTone) => getVerdictPresentation(verdict).tone === tone;
