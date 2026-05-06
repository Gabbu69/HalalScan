export type VerdictTone = 'halal' | 'haram' | 'review';

export type VerdictPresentation = {
  tone: VerdictTone;
  primaryLabel: 'HALAL' | 'HARAM' | 'MASHBOOH';
  secondaryLabel: string;
  summary: string;
  badgeClass: string;
  softClass: string;
  textClass: string;
  borderClass: string;
};

const normalizeVerdict = (verdict: string) => verdict.trim().toUpperCase();

export const getVerdictPresentation = (verdict: string): VerdictPresentation => {
  const normalized = normalizeVerdict(verdict);

  if (normalized === 'HALAL' || normalized === 'HALAL COMPLIANT') {
    return {
      tone: 'halal',
      primaryLabel: 'HALAL',
      secondaryLabel: normalized === 'HALAL COMPLIANT' ? 'Halal compliant' : 'Halal',
      summary: 'No haram or doubtful trigger was found in the final decision.',
      badgeClass: 'bg-green-600',
      softClass: 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-900/40',
      textClass: 'text-green-600 dark:text-green-400',
      borderClass: 'border-green-600',
    };
  }

  if (normalized === 'HARAM' || normalized === 'NON-COMPLIANT') {
    return {
      tone: 'haram',
      primaryLabel: 'HARAM',
      secondaryLabel: normalized === 'NON-COMPLIANT' ? 'Non-compliant: haram trigger detected' : 'Haram',
      summary: 'A haram ingredient or rule match controls the final decision.',
      badgeClass: 'bg-red-600',
      softClass: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900/40',
      textClass: 'text-red-600 dark:text-red-400',
      borderClass: 'border-red-600',
    };
  }

  return {
    tone: 'review',
    primaryLabel: 'MASHBOOH',
    secondaryLabel: normalized === 'REQUIRES REVIEW' ? 'Requires review' : 'Mashbooh / doubtful',
    summary: 'One or more ingredients, sources, or certifier details need verification.',
    badgeClass: 'bg-amber-600',
    softClass: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-900/40',
    textClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-600',
  };
};

export const verdictMatchesTone = (verdict: string, tone: VerdictTone) =>
  getVerdictPresentation(verdict).tone === tone;
