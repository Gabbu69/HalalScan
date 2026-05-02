import knowledgeBaseJson from '../../backend/data/halal_rules.json';

export type CanonicalRuleStatus = 'HARAM' | 'DOUBTFUL' | 'UNKNOWN' | 'HALAL' | 'INFO';

export type CanonicalRule = {
  id: string;
  category: string;
  title: string;
  status: CanonicalRuleStatus;
  e_numbers: string[];
  keywords: string[];
  reason: string;
  source: string;
};

export type CanonicalCertifyingBody = {
  id: string;
  name: string;
  country: string;
  aliases: string[];
};

export type CanonicalKnowledgeBase = {
  rules: CanonicalRule[];
  certifying_bodies: CanonicalCertifyingBody[];
};

export type CanonicalRuleMatch = {
  id: string;
  status: CanonicalRuleStatus;
  category: string;
  title: string;
  reason: string;
  source: string;
};

export type CanonicalIngredientResult = {
  ingredient: string;
  status: CanonicalRuleStatus;
  matched_rules: CanonicalRuleMatch[];
  reason: string;
};

export const CANONICAL_KNOWLEDGE_BASE = knowledgeBaseJson as CanonicalKnowledgeBase;
export const CANONICAL_RULES = CANONICAL_KNOWLEDGE_BASE.rules;
export const CANONICAL_CERTIFYING_BODIES = CANONICAL_KNOWLEDGE_BASE.certifying_bodies;

export const STATUS_PRIORITY: Record<CanonicalRuleStatus, number> = {
  HARAM: 4,
  DOUBTFUL: 3,
  UNKNOWN: 2,
  HALAL: 1,
  INFO: 0,
};

export const normalizeText = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

export const normalizeEcodes = (value: string) =>
  normalizeText(value)
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/\be[\s-]+(?=\d)/g, 'e');

export const containsTerm = (source: string, term: string) => {
  const sourceNorm = normalizeEcodes(source);
  const termNorm = normalizeEcodes(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${termNorm}([^a-z0-9]|$)`, 'i').test(sourceNorm);
};

export const extractENumbers = (source: string) => {
  const matches = normalizeEcodes(source).toUpperCase().match(/\bE\d{3,4}[A-Z]?\b/g);
  return new Set(matches || []);
};

export const splitIngredients = (text: string) => {
  const clean = (text || '').replace(/\bingredients?\s*[:.-]\s*/i, '');
  return clean
    .split(/[,;\n]+/)
    .map(part => part.replace(/\s+/g, ' ').replace(/^[ .:-]+|[ .:-]+$/g, ''))
    .filter(item => item.length >= 2);
};

export const evaluateIngredientAgainstCanonicalRules = (ingredient: string): CanonicalIngredientResult => {
  const matched: CanonicalRuleMatch[] = [];
  const eNumbers = extractENumbers(ingredient);

  CANONICAL_RULES.forEach(rule => {
    const eNumberMatch = rule.e_numbers.some(code => eNumbers.has(code.toUpperCase()));
    const keywordMatch = rule.keywords.some(keyword => containsTerm(ingredient, keyword));

    if (eNumberMatch || keywordMatch) {
      matched.push({
        id: rule.id,
        status: rule.status,
        category: rule.category,
        title: rule.title,
        reason: rule.reason,
        source: rule.source,
      });
    }
  });

  if (matched.length === 0) {
    return {
      ingredient,
      status: 'UNKNOWN',
      matched_rules: [],
      reason: 'No explicit canonical knowledge-base rule matched this ingredient.',
    };
  }

  const strongest = matched.reduce((best, item) =>
    STATUS_PRIORITY[item.status] > STATUS_PRIORITY[best.status] ? item : best
  );

  return {
    ingredient,
    status: strongest.status,
    matched_rules: matched,
    reason: strongest.reason,
  };
};
