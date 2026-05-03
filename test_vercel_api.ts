import analyzeHandler from './api/analyze';
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

const review = await invoke(analyzeHandler, {
  method: 'POST',
  body: {
    productName: 'Gummies',
    ingredients: 'sugar, gelatin, natural flavors',
    certifyingBody: 'IFANCA',
  },
});
expectOk('review analyze', review);
if (review.body.final_verdict !== 'REQUIRES REVIEW') {
  throw new Error(`Expected REQUIRES REVIEW, got ${review.body.final_verdict}`);
}
console.log('review:', review.body.final_verdict);

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
