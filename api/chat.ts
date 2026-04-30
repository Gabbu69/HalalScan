import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return res.status(200).json({ text: response.text });
  } catch (error: any) {
    console.error("Backend Gemini Chat Error:", error);
    let errorMessage = error.message || 'Failed to process request';
    try {
      const parsed = JSON.parse(errorMessage);
      if (parsed.error && parsed.error.message) {
        errorMessage = parsed.error.message;
      }
    } catch (e) {}
    return res.status(500).json({ error: errorMessage });
  }
}
