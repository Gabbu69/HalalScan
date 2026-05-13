import analyzeHandler from './api/analyze';
import chatHandler from './api/chat';
import healthHandler from './api/health';
import historyHandler from './api/history';
import ocrHandler from './api/ocr';
import rulesHandler from './api/rules';

const createMockRes = () => {
  const res: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res;
};

const invoke = async (handler: any, req: any) => {
  const res = createMockRes();
  await handler(req, res);
  return res;
};

const expectOk = (label: string, res: any) => {
  if (res.statusCode < 200 || res.statusCode >= 300) {
    throw new Error(`${label} failed with ${res.statusCode}: ${JSON.stringify(res.body)}`);
  }
};

const health = await invoke(healthHandler, { method: 'GET' });
expectOk('health', health);
console.log('health:', {
  ok: health.body.ok,
  rules: health.body.rules.count,
  rapidapi: health.body.rapidapi.configured,
  googleVision: health.body.googleVision.configured,
});

const rules = await invoke(rulesHandler, { method: 'GET' });
expectOk('rules', rules);
if (rules.body.rules.length < 50) throw new Error('Expected at least 50 backend rules.');
for (const rule of rules.body.rules) {
  if (!rule.id || !rule.category || !rule.status || !rule.reason || !rule.source) {
    throw new Error(`Rule is missing required schema fields: ${JSON.stringify(rule)}`);
  }
  if (!rule.keywords?.length && !rule.e_numbers?.length) {
    throw new Error(`Rule has no keyword or E-number trigger: ${rule.id}`);
  }
}
console.log('rules:', rules.body.rules.length);

const compliant = await invoke(analyzeHandler, {
  method: 'POST',
  body: {
    productName: 'Rice Crackers',
    ingredients: 'rice, sunflower oil, sea salt',
    certifyingBody: 'JAKIM',
  },
});
expectOk('compliant analyze', compliant);
if (compliant.body.final_verdict !== 'HALAL COMPLIANT') {
  throw new Error(`Expected HALAL COMPLIANT, got ${compliant.body.final_verdict}`);
}
console.log('compliant:', compliant.body.final_verdict);

const requiredAnalyzeKeys = [
  'final_verdict',
  'confidence',
  'reason',
  'recommendation',
  'ingredient_results',
  'triggered_rules',
  'certifying_body',
  'architectureDetails',
  'rubric_evidence',
];
for (const key of requiredAnalyzeKeys) {
  if (!(key in compliant.body)) throw new Error(`Analyze response is missing public contract key: ${key}`);
}
const evidence = compliant.body.rubric_evidence;
if (evidence.contract_version !== 'ml-kbd-re-si-v1') {
  throw new Error(`Unexpected rubric evidence contract: ${evidence.contract_version}`);
}
if (JSON.stringify(evidence) !== JSON.stringify(compliant.body.architectureDetails.rubricEvidence)) {
  throw new Error('Expected top-level rubric_evidence to match architectureDetails.rubricEvidence.');
}
if (evidence.mlImplementation.primary_classifier !== 'RapidAPI Halal Food Checker') {
  throw new Error('Expected RapidAPI to be documented as the primary ML classifier.');
}
if (evidence.knowledgeBaseDesign.rule_count < 60) {
  throw new Error('Expected at least 60 canonical KB rules in rubric evidence.');
}
for (const body of ['JAKIM', 'MUI', 'IFANCA', 'HFA', 'ESMA']) {
  if (!evidence.knowledgeBaseDesign.certifying_bodies.includes(body)) {
    throw new Error(`Expected certifying body evidence for ${body}.`);
  }
}
if (evidence.reasoningEngine.priority.join('>') !== 'HARAM>HALAL') {
  throw new Error('Expected deterministic reasoning priority evidence.');
}
if (evidence.systemIntegration.main_route !== '/api/analyze') {
  throw new Error('Expected /api/analyze as the documented integration route.');
}
console.log('contract:', evidence.contract_version);

const commonClean = await invoke(analyzeHandler, {
  method: 'POST',
  body: {
    productName: 'Common Pantry Mix',
    ingredients: 'whole wheat flour, water, sugar, yeast, soybean oil, salt, calcium sulfate, potatoes, vegetable oil (sunflower, corn), calcium chloride, green tea leaves, roasted peanuts',
    certifyingBody: 'JAKIM',
  },
});
expectOk('common clean analyze', commonClean);
if (commonClean.body.final_verdict !== 'HALAL COMPLIANT') {
  throw new Error(`Expected HALAL COMPLIANT, got ${commonClean.body.final_verdict}`);
}
if (commonClean.body.ingredient_results.some((row: any) => row.status === 'UNKNOWN')) {
  throw new Error(`Expected no UNKNOWN common ingredients: ${JSON.stringify(commonClean.body.ingredient_results)}`);
}
console.log('common clean:', commonClean.body.final_verdict);

const sourceResolved = await invoke(analyzeHandler, {
  method: 'POST',
  body: {
    productName: 'Source Resolved Ingredients',
    ingredients: 'microbial rennet, soy lecithin, vegetable glycerin, fish gelatin',
    certifyingBody: 'JAKIM',
  },
});
expectOk('source-resolved analyze', sourceResolved);
if (sourceResolved.body.final_verdict !== 'HALAL COMPLIANT') {
  throw new Error(`Expected HALAL COMPLIANT, got ${sourceResolved.body.final_verdict}`);
}
if (sourceResolved.body.ingredient_results.some((row: any) => row.status !== 'HALAL')) {
  throw new Error(`Expected source-resolved ingredients to be HALAL: ${JSON.stringify(sourceResolved.body.ingredient_results)}`);
}
console.log('source-resolved:', sourceResolved.body.final_verdict);

const nonCompliant = await invoke(analyzeHandler, {
  method: 'POST',
  body: {
    productName: 'Red Cake',
    ingredients: 'sugar, flour, E\u2011120, vanilla',
    certifyingBody: 'JAKIM',
  },
});
expectOk('non-compliant analyze', nonCompliant);
if (nonCompliant.body.final_verdict !== 'NON-COMPLIANT') {
  throw new Error(`Expected NON-COMPLIANT, got ${nonCompliant.body.final_verdict}`);
}
if (!nonCompliant.body.architectureDetails?.krrAnalysis?.facts?.length) {
  throw new Error('Expected explainable fact trace in non-compliant response.');
}
if (!nonCompliant.body.architectureDetails?.krrAnalysis?.conflictResolution?.priority?.includes('HARAM')) {
  throw new Error('Expected conflict-resolution priority evidence.');
}
console.log('non-compliant:', nonCompliant.body.final_verdict, nonCompliant.body.triggered_rules);

const doubtfulNoHaram = await invoke(analyzeHandler, {
  method: 'POST',
  body: {
    productName: 'Gummies',
    ingredients: 'sugar, gelatin, natural flavors',
    certifyingBody: 'IFANCA',
  },
});
expectOk('doubtful no-haram analyze', doubtfulNoHaram);
if (doubtfulNoHaram.body.final_verdict !== 'HALAL COMPLIANT') {
  throw new Error(`Expected HALAL COMPLIANT, got ${doubtfulNoHaram.body.final_verdict}`);
}
if (doubtfulNoHaram.body.flagged_ingredients.length !== 0) {
  throw new Error(`Expected no product-level flagged ingredients without haram triggers, got ${JSON.stringify(doubtfulNoHaram.body.flagged_ingredients)}`);
}
console.log('doubtful no-haram:', doubtfulNoHaram.body.final_verdict);

const chatE120 = await invoke(chatHandler, { method: 'POST', body: { query: 'Is E120 halal?', language: 'English' } });
expectOk('chat E120 RAG', chatE120);
if (!chatE120.body.retrieved_rules.some((rule: any) => rule.id === 'R001')) {
  throw new Error(`Expected R001 in E120 RAG response: ${JSON.stringify(chatE120.body)}`);
}
if (!chatE120.body.text.includes('RAG explanation only')) {
  throw new Error('Expected RAG guardrail in E120 chat response.');
}
console.log('chat E120:', chatE120.body.retrieval_mode, chatE120.body.retrieved_rules.map((rule: any) => rule.id));

const chatGelatin = await invoke(chatHandler, { method: 'POST', body: { query: 'Why is gelatin doubtful?' } });
expectOk('chat gelatin RAG', chatGelatin);
if (!chatGelatin.body.retrieved_rules.some((rule: any) => rule.id === 'R002')) {
  throw new Error(`Expected R002 in gelatin RAG response: ${JSON.stringify(chatGelatin.body)}`);
}
console.log('chat gelatin:', chatGelatin.body.retrieved_rules.map((rule: any) => rule.id));

const chatCertifier = await invoke(chatHandler, { method: 'POST', body: { query: 'Is JAKIM recognized?' } });
expectOk('chat certifier RAG', chatCertifier);
if (!chatCertifier.body.retrieved_certifying_bodies.some((body: any) => body.name === 'JAKIM')) {
  throw new Error(`Expected JAKIM certifier in RAG response: ${JSON.stringify(chatCertifier.body)}`);
}
console.log('chat certifier:', chatCertifier.body.retrieved_certifying_bodies.map((body: any) => body.name));

const chatUnknown = await invoke(chatHandler, { method: 'POST', body: { query: 'spaceship quantum battery' } });
expectOk('chat unknown RAG', chatUnknown);
if (chatUnknown.body.retrieved_rules.length !== 0) {
  throw new Error(`Expected no RAG rules for unknown query: ${JSON.stringify(chatUnknown.body)}`);
}
console.log('chat unknown:', chatUnknown.body.retrieval_mode);

const ocr = await invoke(ocrHandler, {
  method: 'POST',
  body: {
    fileBase64: Buffer.from('fake image').toString('base64'),
    mimeType: 'image/png',
    fallbackText: 'fallback ingredients',
  },
});
expectOk('ocr', ocr);
if (ocr.body.engine !== 'google-vision-unavailable' && !ocr.body.text) {
  throw new Error('Expected OCR text or clean unavailable response.');
}
console.log('ocr:', ocr.body.engine);

const history = await invoke(historyHandler, { method: 'GET' });
expectOk('history', history);
if (history.body.history.length < 3) throw new Error('Expected serverless history to contain analyze results.');
console.log('history:', history.body.history.length);
