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

const nonCompliant = await invoke(analyzeHandler, {
  method: 'POST',
  body: {
    productName: 'Red Cake',
    ingredients: 'sugar, flour, E120, vanilla',
    certifyingBody: 'JAKIM',
  },
});
expectOk('non-compliant analyze', nonCompliant);
if (nonCompliant.body.final_verdict !== 'NON-COMPLIANT') {
  throw new Error(`Expected NON-COMPLIANT, got ${nonCompliant.body.final_verdict}`);
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

