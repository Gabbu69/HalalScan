import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGeminiConfigStatus } from './_gemini';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const gemini = getGeminiConfigStatus();

  return res.status(200).json({
    ok: true,
    service: 'HalalScan API',
    gemini: {
      configured: gemini.configured,
      configuredEnvNames: gemini.configuredEnvNames,
      model: gemini.model
    }
  });
}
