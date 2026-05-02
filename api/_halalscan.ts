import { createSign } from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';

type RuleStatus = 'HARAM' | 'DOUBTFUL' | 'UNKNOWN' | 'HALAL' | 'INFO' | 'UNAVAILABLE';

type Rule = {
  id: string;
  category: string;
  title: string;
  status: RuleStatus;
  e_numbers: string[];
  keywords: string[];
  reason: string;
  source: string;
};

type CertifyingBody = {
  id: string;
  name: string;
  country: string;
  aliases: string[];
};

type KnowledgeBase = {
  rules: Rule[];
  certifying_bodies: CertifyingBody[];
};

const statusPriority: Record<string, number> = {
  HARAM: 4,
  DOUBTFUL: 3,
  UNKNOWN: 2,
  HALAL: 1,
  INFO: 0,
  UNAVAILABLE: 0,
};

const serverlessHistory: any[] = [];
const rapidApiCache = new Map<string, any>();
let knowledgeBaseCache: KnowledgeBase | null = null;
let googleAccessToken: { token: string; expiresAt: number } | null = null;

export const loadKnowledgeBase = (): KnowledgeBase => {
  if (knowledgeBaseCache) return knowledgeBaseCache;

  const jsonPath = path.join(process.cwd(), 'backend', 'data', 'halal_rules.json');
  knowledgeBaseCache = JSON.parse(readFileSync(jsonPath, 'utf8')) as KnowledgeBase;
  return knowledgeBaseCache;
};

const normalizeText = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
const normalizeEcodes = (value: string) =>
  normalizeText(value)
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/\be[\s-]+(?=\d)/g, 'e');

const containsTerm = (source: string, term: string) => {
  const sourceNorm = normalizeEcodes(source);
  const termNorm = normalizeEcodes(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${termNorm}([^a-z0-9]|$)`, 'i').test(sourceNorm);
};

const extractENumbers = (source: string) => {
  const matches = normalizeEcodes(source).toUpperCase().match(/\bE\d{3,4}[A-Z]?\b/g);
  return new Set(matches || []);
};

export const verifyCertifyingBody = (value?: string) => {
  const input = (value || '').trim();
  if (!input) {
    return {
      input: '',
      status: 'MISSING',
      recognized: false,
      matched_body: null,
      reason: 'No certifying body was provided.',
    };
  }

  const needle = normalizeText(input);
  const body = loadKnowledgeBase().certifying_bodies.find(item =>
    [item.name, ...item.aliases].some(name => normalizeText(name) === needle)
  );

  if (!body) {
    return {
      input,
      status: 'UNRECOGNIZED',
      recognized: false,
      matched_body: null,
      reason: 'The provided certifying body is not in the maintained recognized-body list.',
    };
  }

  return {
    input,
    status: 'RECOGNIZED',
    recognized: true,
    matched_body: body,
    reason: `${body.name} is in the maintained recognized-body list.`,
  };
};

export const evaluateIngredientAgainstRules = (ingredient: string) => {
  const matched: any[] = [];
  const eNumbers = extractENumbers(ingredient);

  loadKnowledgeBase().rules.forEach(rule => {
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
      status: 'UNKNOWN' as RuleStatus,
      matched_rules: [],
      reason: 'No explicit knowledge-base rule matched this ingredient.',
    };
  }

  const strongest = matched.reduce((best, item) =>
    statusPriority[item.status] > statusPriority[best.status] ? item : best
  );

  return {
    status: strongest.status as RuleStatus,
    matched_rules: matched,
    reason: strongest.reason,
  };
};

export const splitIngredients = (text: string) => {
  const clean = (text || '').replace(/\bingredients?\s*[:.-]\s*/i, '');
  return clean
    .split(/[,;\n]+/)
    .map(part => part.replace(/\s+/g, ' ').replace(/^[ .:-]+|[ .:-]+$/g, ''))
    .filter(item => item.length >= 2);
};

const isMissingIngredients = (text: string) => {
  const normalized = (text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return !normalized || new Set([
    'no ingredients',
    'no ingredients listed',
    'ingredients unavailable',
    'ingredients not available',
    'ingredients not listed',
    'unknown',
    'unknown ingredients',
    'not available',
    'na',
  ]).has(normalized);
};

const normalizeApiStatus = (value: unknown): RuleStatus => {
  const text = String(value || '').toLowerCase();
  if (text.includes('haram') || text.includes('forbidden') || text.includes('non-halal') || text.includes('non halal')) return 'HARAM';
  if (text.includes('doubt') || text.includes('mashbooh') || text.includes('mushbooh') || text.includes('questionable')) return 'DOUBTFUL';
  if (text.includes('halal') || text.includes('permissible')) return 'HALAL';
  return 'UNKNOWN';
};

const findFirst = (data: any, keys: string[]): any => {
  if (!data) return undefined;
  if (Array.isArray(data)) {
    for (const value of data) {
      const found = findFirst(value, keys);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  if (typeof data === 'object') {
    for (const key of keys) {
      if (data[key] !== undefined) return data[key];
    }
    for (const value of Object.values(data)) {
      const found = findFirst(value, keys);
      if (found !== undefined) return found;
    }
  }
  return undefined;
};

export const isRapidApiConfigured = () => Boolean(process.env.RAPIDAPI_KEY?.trim());

export const classifyIngredient = async (ingredient: string) => {
  const cacheKey = ingredient.trim().toLowerCase();
  if (rapidApiCache.has(cacheKey)) {
    return { ...rapidApiCache.get(cacheKey), source: 'rapidapi-memory-cache' };
  }

  const apiKey = process.env.RAPIDAPI_KEY?.trim();
  if (!apiKey) {
    return {
      status: 'UNAVAILABLE' as RuleStatus,
      confidence: 0,
      reason: 'RAPIDAPI_KEY is not configured; skipping live Halal Food Checker lookup.',
      source: 'rapidapi-unavailable',
    };
  }

  const host = process.env.RAPIDAPI_HOST || 'halal-food-checker.p.rapidapi.com';
  const url = process.env.RAPIDAPI_URL || `https://${host}/check`;
  const headers = {
    'X-RapidAPI-Key': apiKey,
    'X-RapidAPI-Host': host,
    'Content-Type': 'application/json',
  };

  try {
    let response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ingredient, ingredients: ingredient, text: ingredient }),
    });

    if (response.status === 404 || response.status === 405) {
      response = await fetch(`${url}?ingredient=${encodeURIComponent(ingredient)}&q=${encodeURIComponent(ingredient)}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': host,
        },
      });
    }

    if (!response.ok) throw new Error(`RapidAPI returned ${response.status}`);

    const raw = await response.json();
    const status = normalizeApiStatus(findFirst(raw, ['status', 'halal_status', 'halalStatus', 'classification', 'result', 'verdict']));
    let confidence = Number(findFirst(raw, ['confidence', 'score', 'probability']));
    if (!Number.isFinite(confidence)) confidence = 70;
    if (confidence <= 1) confidence *= 100;
    const reason = String(findFirst(raw, ['reason', 'description', 'message', 'explanation']) || 'RapidAPI Halal Food Checker returned a classification.');

    const parsed = {
      status,
      confidence: Math.max(0, Math.min(confidence, 100)),
      reason,
      raw,
      source: 'rapidapi',
    };
    rapidApiCache.set(cacheKey, parsed);
    return parsed;
  } catch (error) {
    return {
      status: 'UNAVAILABLE' as RuleStatus,
      confidence: 0,
      reason: `RapidAPI lookup failed: ${error instanceof Error ? error.message : String(error)}`,
      source: 'rapidapi-error',
    };
  }
};

export const fetchProductByBarcode = async (barcode: string) => {
  if (!barcode.trim()) return null;
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.status !== 1 || !data.product) return null;
    return {
      barcode,
      name: data.product.product_name || 'Unknown Product',
      brand: data.product.brands || 'Unknown Brand',
      image: data.product.image_url || null,
      ingredients: data.product.ingredients_text || '',
      labels: data.product.labels || '',
    };
  } catch {
    return null;
  }
};

export const analyzePayload = async (payload: any) => {
  const barcode = String(payload.barcode || '').trim();
  const certifyingBody = payload.certifyingBody || payload.certifying_body;
  const product = {
    barcode,
    name: payload.productName || payload.name || 'Manual Scan',
    brand: payload.brand || 'User Input',
    image: payload.image || null,
    labels: payload.labels || '',
  };

  let ingredientsText = payload.ocrText || payload.ingredients || payload.text || '';
  if (barcode && !ingredientsText) {
    const offProduct = await fetchProductByBarcode(barcode);
    if (offProduct) {
      Object.assign(product, offProduct);
      ingredientsText = offProduct.ingredients;
    }
  }

  const certification = verifyCertifyingBody(certifyingBody);
  const logicPath = [
    'Input collection complete.',
    `Certifying body status: ${certification.status}.`,
  ];
  const factTrace: any[] = [];
  const matchedRuleTrace: any[] = [];

  let ingredientResults: any[];
  if (isMissingIngredients(ingredientsText)) {
    ingredientResults = [{
      ingredient: 'insufficient ingredient information',
      status: 'UNKNOWN',
      api_status: 'UNAVAILABLE',
      kb_status: 'UNKNOWN',
      confidence: 55,
      reason: 'No usable ingredient list was provided.',
      rule_ids: ['INSUFFICIENT_DATA'],
      matched_rules: [],
      source: 'input-quality-guard',
    }];
    factTrace.push({
      ingredient: 'insufficient ingredient information',
      kb_status: 'UNKNOWN',
      api_status: 'UNAVAILABLE',
      final_status: 'UNKNOWN',
      rule_ids: ['INSUFFICIENT_DATA'],
    });
    logicPath.push('No usable ingredient facts were available.');
  } else {
    const ingredients = splitIngredients(ingredientsText);
    logicPath.push(`Extracted ${ingredients.length} ingredient facts.`);

    ingredientResults = await Promise.all(ingredients.map(async ingredient => {
      const kbResult = evaluateIngredientAgainstRules(ingredient);
      const apiResult = await classifyIngredient(ingredient);
      const apiStatus = apiResult.status === 'MASHBOOH' ? 'DOUBTFUL' : apiResult.status;
      const effectiveApiStatus = apiStatus === 'UNAVAILABLE' ? 'INFO' : apiStatus;
      let finalStatus = statusPriority[kbResult.status] >= statusPriority[effectiveApiStatus] ? kbResult.status : effectiveApiStatus;
      if (finalStatus === 'INFO' || finalStatus === 'UNAVAILABLE') finalStatus = 'UNKNOWN';

      const ruleIds = kbResult.matched_rules.map((rule: any) => rule.id);
      factTrace.push({
        ingredient,
        kb_status: kbResult.status,
        api_status: apiStatus,
        final_status: finalStatus,
        rule_ids: ruleIds,
      });
      matchedRuleTrace.push(...kbResult.matched_rules);
      if (ruleIds.length > 0) logicPath.push(`Rule match for '${ingredient}': ${ruleIds.join(', ')} -> ${kbResult.status}.`);
      if (apiStatus !== 'UNAVAILABLE' && apiStatus !== 'INFO') logicPath.push(`RapidAPI classification for '${ingredient}': ${apiStatus}.`);

      return {
        ingredient,
        status: finalStatus,
        api_status: apiStatus,
        kb_status: kbResult.status,
        confidence: apiResult.confidence || (kbResult.matched_rules.length ? 90 : 50),
        reason: kbResult.matched_rules.length ? kbResult.reason : apiResult.reason || kbResult.reason,
        rule_ids: ruleIds,
        matched_rules: kbResult.matched_rules,
        source: apiResult.source || 'knowledge-base',
      };
    }));
  }

  const haramItems = ingredientResults.filter(row => row.status === 'HARAM');
  const doubtfulItems = ingredientResults.filter(row => row.status === 'DOUBTFUL' || row.status === 'UNKNOWN');

  let finalVerdict: 'NON-COMPLIANT' | 'REQUIRES REVIEW' | 'HALAL COMPLIANT';
  let confidence: number;
  let reason: string;
  let recommendation: string;

  if (haramItems.length > 0) {
    finalVerdict = 'NON-COMPLIANT';
    confidence = 98;
    reason = 'One or more ingredients were classified as haram by the knowledge base or Halal Food Checker API.';
    recommendation = 'Avoid this product unless a qualified halal authority provides a corrected ingredient source.';
    logicPath.push('Verdict rule: any HARAM ingredient produces NON-COMPLIANT.');
  } else if (doubtfulItems.length > 0 || !certification.recognized) {
    finalVerdict = 'REQUIRES REVIEW';
    confidence = doubtfulItems.length > 0 ? 72 : 68;
    reason = doubtfulItems.length > 0
      ? 'One or more ingredients are doubtful, unknown, or require source verification.'
      : 'Ingredients did not trigger haram or doubtful rules, but the certifying body is missing or unrecognized.';
    recommendation = 'Check for a recognized halal certificate or contact the manufacturer before consuming.';
    logicPath.push('Verdict rule: doubtful/unknown ingredients or missing/unrecognized certification require review.');
  } else {
    finalVerdict = 'HALAL COMPLIANT';
    confidence = 94;
    reason = 'All ingredients were classified as halal or clear, and the certifying body is recognized.';
    recommendation = 'Product is compliant based on the maintained ingredient rules and certifying-body list.';
    logicPath.push('Verdict rule: all ingredients halal plus recognized certification produces HALAL COMPLIANT.');
  }

  const triggeredRules = Array.from(new Set(ingredientResults.flatMap(row => row.matched_rules.map((rule: any) => rule.id)))).sort();
  const scan = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    created_at: new Date().toISOString(),
    final_verdict: finalVerdict,
    confidence,
    reason,
    recommendation,
    flagged_ingredients: ingredientResults.filter(row => ['HARAM', 'DOUBTFUL', 'UNKNOWN'].includes(row.status)).map(row => row.ingredient),
    ingredients: ingredientsText,
    product,
    certifying_body: certification,
    ingredient_results: ingredientResults,
    triggered_rules: triggeredRules,
    architectureDetails: {
      krrAnalysis: {
        status: haramItems.length ? 'HARAM' : doubtfulItems.length || !certification.recognized ? 'MASHBOOH' : 'HALAL',
        confidence: confidence / 100,
        flags: ingredientResults
          .filter(row => ['HARAM', 'DOUBTFUL', 'UNKNOWN'].includes(row.status))
          .map(row => ({
            ingredient: row.ingredient,
            type: row.status === 'HARAM' ? 'HARAM' : 'MASHBOOH',
            ruleId: row.rule_ids.join(',') || 'UNRESOLVED',
          })),
        logicPath,
        facts: factTrace,
        matchedRules: matchedRuleTrace,
        conflictResolution: {
          priority: ['HARAM', 'DOUBTFUL', 'UNKNOWN', 'HALAL'],
          selectedVerdict: finalVerdict,
          reason,
        },
        certificationCheck: certification,
        evaluationNotes: [
          'RapidAPI Halal Food Checker is the primary ingredient classifier when RAPIDAPI_KEY is configured.',
          'Knowledge-base rules are always evaluated and can veto API output.',
          'No-credential runs remain deterministic by treating live API status as unavailable.',
        ],
      },
      mlAnalysis: {
        provider: 'RapidAPI Halal Food Checker',
        verdict: haramItems.length ? 'HARAM' : doubtfulItems.length ? 'MASHBOOH' : 'HALAL',
        ingredient_results: ingredientResults,
      },
      integrationLogic: logicPath,
    },
  };

  serverlessHistory.unshift(scan);
  if (serverlessHistory.length > 100) serverlessHistory.length = 100;
  return scan;
};

export const listServerlessHistory = () => serverlessHistory;

export const isGoogleVisionConfigured = () =>
  Boolean(
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim() ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()
  );

const base64Url = (value: Buffer | string) =>
  Buffer.from(value).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

const getGoogleCredentials = () => {
  const json = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (json?.trim()) return JSON.parse(json);

  const base64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
  if (base64?.trim()) return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));

  const filePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (filePath?.trim()) return JSON.parse(readFileSync(filePath, 'utf8'));

  return null;
};

const getGoogleAccessToken = async () => {
  if (googleAccessToken && googleAccessToken.expiresAt > Date.now() + 60_000) return googleAccessToken.token;

  const credentials = getGoogleCredentials();
  if (!credentials?.client_email || !credentials?.private_key) {
    throw new Error('Google Vision service account credentials are not configured.');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-vision',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }));
  const unsignedJwt = `${header}.${payload}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsignedJwt);
  const signature = signer.sign(credentials.private_key);
  const assertion = `${unsignedJwt}.${base64Url(signature)}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) throw new Error(`Google token exchange failed with ${response.status}`);
  const data = await response.json();
  googleAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(0, Number(data.expires_in || 3600) - 60) * 1000,
  };
  return googleAccessToken.token;
};

const stripDataUrl = (value: string) => {
  if (value.startsWith('data:') && value.includes(',')) return value.split(',', 2)[1];
  return value;
};

const averageConfidence = (annotation: any) => {
  const values: number[] = [];
  (annotation?.pages || []).forEach((page: any) => {
    (page.blocks || []).forEach((block: any) => {
      if (typeof block.confidence === 'number') values.push(block.confidence);
      (block.paragraphs || []).forEach((paragraph: any) => {
        if (typeof paragraph.confidence === 'number') values.push(paragraph.confidence);
      });
    });
  });
  if (!values.length) return 0;
  return Math.round((values.reduce((sum, item) => sum + item, 0) / values.length) * 10000) / 100;
};

export const runOcrPayload = async (payload: any) => {
  const fileBase64 = payload.fileBase64 || payload.imageBase64 || payload.data;
  if (!fileBase64) throw new Error('fileBase64 or imageBase64 is required.');

  const mimeType = payload.mimeType || 'image/jpeg';
  const fallbackText = payload.fallbackText || '';
  const filename = payload.filename || 'upload';

  if (!isGoogleVisionConfigured()) {
    return {
      text: fallbackText,
      confidence: 0,
      pages: [],
      engine: 'google-vision-unavailable',
      filename,
      warning: 'Google Vision is not configured. Use GOOGLE_APPLICATION_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS_BASE64 on Vercel.',
    };
  }

  const token = await getGoogleAccessToken();
  const content = stripDataUrl(fileBase64);
  const isPdf = mimeType === 'application/pdf';
  const endpoint = isPdf
    ? 'https://vision.googleapis.com/v1/files:annotate'
    : 'https://vision.googleapis.com/v1/images:annotate';
  const body = isPdf
    ? {
        requests: [{
          inputConfig: { content, mimeType },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          pages: [1, 2, 3, 4, 5],
        }],
      }
    : {
        requests: [{
          image: { content },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        }],
      };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`Google Vision returned ${response.status}`);
  const data = await response.json();

  if (isPdf) {
    const pageResponses = data.responses?.[0]?.responses || [];
    const pages = pageResponses.map((item: any, index: number) => ({
      page: index + 1,
      text: item.fullTextAnnotation?.text || '',
      error: item.error?.message,
    }));
    const confidences = pageResponses.map((item: any) => averageConfidence(item.fullTextAnnotation)).filter(Boolean);
    return {
      text: pages.map((page: any) => page.text).filter(Boolean).join('\n').trim(),
      confidence: confidences.length ? Math.round((confidences.reduce((sum: number, item: number) => sum + item, 0) / confidences.length) * 100) / 100 : 0,
      pages,
      engine: 'google-vision-pdf-document-text-detection',
      filename,
    };
  }

  const annotation = data.responses?.[0]?.fullTextAnnotation;
  return {
    text: annotation?.text || '',
    confidence: averageConfidence(annotation),
    pages: [{ page: 1, text: annotation?.text || '' }],
    engine: 'google-vision-document-text-detection',
    filename,
  };
};
