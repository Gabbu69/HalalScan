import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGeminiConfigStatus } from './_gemini.js';
import { isGoogleVisionConfigured, isRapidApiConfigured, loadKnowledgeBase } from './_halalscan.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const gemini = getGeminiConfigStatus();
  const kb = loadKnowledgeBase();

  return res.status(200).json({
    ok: true,
    service: 'HalalScan Vercel API',
    runtime: 'vercel-serverless',
    googleVision: {
      configured: isGoogleVisionConfigured(),
      envNames: [
        'GOOGLE_APPLICATION_CREDENTIALS_JSON',
        'GOOGLE_SERVICE_ACCOUNT_JSON',
        'GOOGLE_APPLICATION_CREDENTIALS_BASE64',
        'GOOGLE_APPLICATION_CREDENTIALS',
      ].filter(key => Boolean(process.env[key]?.trim())),
    },
    rapidapi: {
      configured: isRapidApiConfigured(),
      host: process.env.RAPIDAPI_HOST || 'halal-food-checker.p.rapidapi.com',
    },
    gemini: {
      configured: gemini.configured,
      configuredEnvNames: gemini.configuredEnvNames,
      model: gemini.model,
    },
    rules: { count: kb.rules.length },
    certifyingBodies: { count: kb.certifying_bodies.length },
  });
}

