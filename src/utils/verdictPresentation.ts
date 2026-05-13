export type VerdictTone = 'halal' | 'haram';

export type VerdictPresentation = {
  tone: VerdictTone;
  primaryLabel: 'HALAL' | 'HARAM';
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
      summary: 'No haram trigger was found in the final decision.',
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
    tone: 'halal',
    primaryLabel: 'HALAL',
    secondaryLabel: 'No haram ingredient detected',
    summary: 'No haram trigger was found in the final decision.',
    badgeClass: 'bg-green-600',
    softClass: 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-900/40',
    textClass: 'text-green-600 dark:text-green-400',
    borderClass: 'border-green-600',
  };
};

export const verdictMatchesTone = (verdict: string, tone: VerdictTone) =>
  getVerdictPresentation(verdict).tone === tone;
