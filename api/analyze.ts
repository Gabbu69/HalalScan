import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { analyzePayload } from './_halalscan.js';
import { buildMissingApiKeyError, extractGeminiErrorMessage, getGeminiApiKey, getGeminiModel } from './_gemini.js';

const isLegacyGeminiPayload = (body: any) =>
  typeof body?.prompt === 'string' &&
  !body.productName &&
  !body.name &&
  !body.ingredients &&
  !body.text &&
  !body.ocrText &&
  !body.barcode &&
  !body.certifyingBody &&
  !body.certifying_body;

const handleLegacyGeminiAnalyze = async (req: VercelRequest, res: VercelResponse) => {
  const { prompt, imageBase64, mimeType } = req.body;
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({
      code: 'INVALID_PROMPT',
      error: 'A non-empty prompt string is required.',
    });
  }

  const { apiKey, envName } = getGeminiApiKey();
  if (!apiKey) {
    return res.status(503).json(buildMissingApiKeyError());
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = getGeminiModel();
    console.log(`Gemini analyze fallback using ${envName} with ${model}.`);

    let contents: string | Array<{ text: string } | { inlineData: { data: string; mimeType: string } }>;
    if (imageBase64 && mimeType) {
      contents = [
        { text: prompt.trim() },
        { inlineData: { data: imageBase64, mimeType } },
      ];
    } else {
      contents = prompt.trim();
    }

    const response = await ai.models.generateContent({
      model,
      contents,
      config: { responseMimeType: 'application/json' },
    });

    const jsonStr = (response.text || '{}').replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      return res.status(200).json(JSON.parse(jsonStr));
    } catch {
      return res.status(502).json({
        code: 'GEMINI_BAD_JSON',
        error: 'Gemini returned a response that was not valid JSON.',
        rawPreview: jsonStr.slice(0, 300),
      });
    }
  } catch (error) {
    return res.status(502).json({
      code: 'GEMINI_UPSTREAM_ERROR',
      error: extractGeminiErrorMessage(error),
    });
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ code: 'METHOD_NOT_ALLOWED', error: 'Method Not Allowed' });
  }

  if (isLegacyGeminiPayload(req.body)) {
    return handleLegacyGeminiAnalyze(req, res);
  }

  try {
    const result = await analyzePayload(req.body || {});
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      code: 'ANALYSIS_FAILED',
      error: error instanceof Error ? error.message : String(error || 'Analysis failed'),
    });
  }
}

