import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { buildMissingApiKeyError, extractGeminiErrorMessage, getGeminiApiKey, getGeminiModel } from './_gemini.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ code: 'METHOD_NOT_ALLOWED', error: 'Method Not Allowed' });
  }

  const { prompt } = req.body;
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({
      code: 'INVALID_PROMPT',
      error: 'A non-empty prompt string is required.'
    });
  }

  const { apiKey, envName } = getGeminiApiKey();

  if (!apiKey) {
    return res.status(503).json(buildMissingApiKeyError());
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = getGeminiModel();
    console.log(`Gemini chat request using ${envName} with ${model}.`);
    
    const response = await ai.models.generateContent({
      model,
      contents: prompt.trim(),
    });

    return res.status(200).json({ text: response.text || '' });
  } catch (error) {
    console.error('Backend Gemini Chat Error:', error);
    return res.status(502).json({
      code: 'GEMINI_UPSTREAM_ERROR',
      error: extractGeminiErrorMessage(error)
    });
  }
}
