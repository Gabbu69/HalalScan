import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runOcrPayload } from './_halalscan.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ code: 'METHOD_NOT_ALLOWED', error: 'Method Not Allowed' });
  }

  try {
    return res.status(200).json(await runOcrPayload(req.body || {}));
  } catch (error) {
    return res.status(502).json({
      code: 'OCR_FAILED',
      error: error instanceof Error ? error.message : String(error || 'OCR failed'),
    });
  }
}

