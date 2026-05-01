import type { VercelRequest, VercelResponse } from '@vercel/node';
import { listServerlessHistory } from './_halalscan.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ code: 'METHOD_NOT_ALLOWED', error: 'Method Not Allowed' });
  }

  return res.status(200).json({
    history: listServerlessHistory(),
    storage: 'serverless-memory',
    note: 'Vercel serverless memory is ephemeral. The frontend also persists scan history in localStorage.',
  });
}

