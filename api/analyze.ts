import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, imageBase64, mimeType } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    let contents = [];
    if (imageBase64 && mimeType) {
      contents = [
        { text: prompt },
        { inlineData: { data: imageBase64, mimeType } }
      ];
    } else {
      contents = prompt;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const textResponse = response.text || "{}";
    const jsonStr = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    return res.status(200).json(JSON.parse(jsonStr));
  } catch (error) {
    console.error("Backend Gemini API Error:", error);
    return res.status(500).json({ error: error.message || 'Failed to process request' });
  }
}
