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
  matched_terms?: string[];
  specificity?: number;
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

const getRuleMatch = (rule: CanonicalRule, ingredient: string, eNumbers: Set<string>): CanonicalRuleMatch | null => {
  const eNumberMatches = rule.e_numbers.filter(code => eNumbers.has(code.toUpperCase()));
  const keywordMatches = rule.keywords.filter(keyword => containsTerm(ingredient, keyword));

  if (eNumberMatches.length === 0 && keywordMatches.length === 0) return null;

  const specificity = Math.max(
    0,
    ...eNumberMatches.map(code => normalizeEcodes(code).length + 100),
    ...keywordMatches.map(keyword => normalizeEcodes(keyword).length)
  );

  return {
    id: rule.id,
    status: rule.status,
    category: rule.category,
    title: rule.title,
    reason: rule.reason,
    source: rule.source,
    matched_terms: [...eNumberMatches, ...keywordMatches],
    specificity,
  };
};

const chooseStrongestMatch = (matches: CanonicalRuleMatch[]) => {
  const compare = (a: CanonicalRuleMatch, b: CanonicalRuleMatch) => {
    const priorityDelta = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
    if (priorityDelta !== 0) return priorityDelta;
    return (a.specificity || 0) - (b.specificity || 0);
  };

  const haramMatches = matches.filter(match => match.status === 'HARAM');
  if (haramMatches.length > 0) {
    return haramMatches.reduce((best, item) => (compare(item, best) > 0 ? item : best));
  }

  const bestHalal = matches
    .filter(match => match.status === 'HALAL')
    .reduce<CanonicalRuleMatch | null>((best, item) => (!best || compare(item, best) > 0 ? item : best), null);
  const bestNonHalal = matches
    .filter(match => !['HALAL', 'INFO'].includes(match.status))
    .reduce<CanonicalRuleMatch | null>((best, item) => (!best || compare(item, best) > 0 ? item : best), null);

  if (bestHalal && bestNonHalal && (bestHalal.specificity || 0) > (bestNonHalal.specificity || 0)) {
    return bestHalal;
  }

  return matches.reduce((best, item) => (compare(item, best) > 0 ? item : best));
};

export const splitIngredients = (text: string) => {
  const clean = (text || '').replace(/\bingredients?\s*[:.-]\s*/i, '');
  const parts: string[] = [];
  let current = '';
  let depth = 0;

  for (const char of clean) {
    if ('([{'.includes(char)) depth += 1;
    if (')]}'.includes(char) && depth > 0) depth -= 1;

    if ((char === ',' || char === ';' || char === '\n') && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);

  return parts
    .map(part => part.replace(/\s+/g, ' ').replace(/^[\s.,:;\-]+|[\s.,:;\-]+$/g, ''))
    .filter(item => item.length >= 2);
};

export const evaluateIngredientAgainstCanonicalRules = (ingredient: string): CanonicalIngredientResult => {
  const matched: CanonicalRuleMatch[] = [];
  const eNumbers = extractENumbers(ingredient);

  CANONICAL_RULES.forEach(rule => {
    const ruleMatch = getRuleMatch(rule, ingredient, eNumbers);
    if (ruleMatch) matched.push(ruleMatch);
  });

  if (matched.length === 0) {
    return {
      ingredient,
      status: 'UNKNOWN',
      matched_rules: [],
      reason: 'No explicit canonical knowledge-base rule matched this ingredient.',
    };
  }

  const strongest = chooseStrongestMatch(matched);

  return {
    ingredient,
    status: strongest.status,
    matched_rules: matched,
    reason: strongest.reason,
  };
};
