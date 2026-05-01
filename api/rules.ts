import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loadKnowledgeBase } from './_halalscan.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ code: 'METHOD_NOT_ALLOWED', error: 'Method Not Allowed' });
  }

  const kb = loadKnowledgeBase();
  return res.status(200).json({
    rules: kb.rules,
    certifying_bodies: kb.certifying_bodies,
  });
}

