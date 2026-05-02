import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    console.log('Skipping Gemini live smoke test: no GEMINI_API_KEY, GOOGLE_API_KEY, or GOOGLE_GENERATIVE_AI_API_KEY is configured.');
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: 'Return ONLY valid JSON: {"ok":true}',
      config: {
        responseMimeType: 'application/json',
      }
    });
    console.log('Success:', response.text);
  } catch (e) {
    console.error('Error:', e);
    process.exitCode = 1;
  }
}
run();
