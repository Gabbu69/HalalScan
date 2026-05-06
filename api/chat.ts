import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { buildMissingApiKeyError, extractGeminiErrorMessage, getGeminiApiKey, getGeminiModel } from './_gemini.js';
import { buildRagChatResponse, RAG_GUARDRAIL, retrieveKnowledge } from './_halalscan.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ code: 'METHOD_NOT_ALLOWED', error: 'Method Not Allowed' });
  }

  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  const query = typeof req.body?.query === 'string' ? req.body.query.trim() : prompt;
  const language = typeof req.body?.language === 'string' ? req.body.language.trim() : 'English';

  if (!query) {
    return res.status(400).json({
      code: 'INVALID_PROMPT',
      error: 'A non-empty prompt string is required.'
    });
  }

  const retrieval = retrieveKnowledge(query);
  const deterministicText = buildRagChatResponse(query, retrieval);
  const { apiKey, envName } = getGeminiApiKey();

  if (!apiKey) {
    return res.status(200).json({
      text: deterministicText,
      retrieved_rules: retrieval.rules,
      retrieved_certifying_bodies: retrieval.certifying_bodies,
      retrieval_mode: 'knowledge-base-rag',
      gemini: buildMissingApiKeyError(),
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = getGeminiModel();
    console.log(`Gemini chat request using ${envName} with ${model}.`);

    const context = retrieval.rules.map(rule =>
      `${rule.id} [${rule.status}] ${rule.title}: ${rule.reason} Source: ${rule.source}.`
    ).join('\n');
    const certifierContext = retrieval.certifying_bodies.map(body =>
      `${body.id} ${body.name} (${body.country}) aliases: ${body.aliases.join(', ')}.`
    ).join('\n');
    const augmentedPrompt = [
      prompt || `Answer this halal ingredient question in ${language}: ${query}`,
      '',
      'Use the retrieved HalalScan knowledge-base context below when relevant. Cite rule IDs when available.',
      context || 'No matching ingredient rules were retrieved.',
      certifierContext ? `Certifier matches:\n${certifierContext}` : '',
      RAG_GUARDRAIL,
      `Write the answer in ${language}.`,
    ].filter(Boolean).join('\n');
    
    const response = await ai.models.generateContent({
      model,
      contents: augmentedPrompt,
    });

    const text = response.text?.includes(RAG_GUARDRAIL)
      ? response.text
      : `${response.text || deterministicText}\n\n${RAG_GUARDRAIL}`;

    return res.status(200).json({
      text,
      retrieved_rules: retrieval.rules,
      retrieved_certifying_bodies: retrieval.certifying_bodies,
      retrieval_mode: 'gemini-augmented-rag',
    });
  } catch (error) {
    console.error('Backend Gemini Chat Error:', error);
    return res.status(200).json({
      text: deterministicText,
      retrieved_rules: retrieval.rules,
      retrieved_certifying_bodies: retrieval.certifying_bodies,
      retrieval_mode: 'knowledge-base-rag',
      gemini_error: extractGeminiErrorMessage(error),
    });
  }
}
