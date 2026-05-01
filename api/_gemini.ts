export const GEMINI_ENV_KEYS = [
  'GEMINI_API_KEY',
  'GOOGLE_API_KEY',
  'GOOGLE_GENERATIVE_AI_API_KEY'
] as const;

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

export const getGeminiApiKey = () => {
  for (const key of GEMINI_ENV_KEYS) {
    const value = process.env[key];
    if (value && value.trim()) {
      return {
        apiKey: value.trim(),
        envName: key
      };
    }
  }

  return {
    apiKey: '',
    envName: ''
  };
};

export const getGeminiModel = () => process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

export const getGeminiConfigStatus = () => {
  const configuredKeys = GEMINI_ENV_KEYS.filter(key => Boolean(process.env[key]?.trim()));
  return {
    configured: configuredKeys.length > 0,
    configuredEnvNames: configuredKeys,
    model: getGeminiModel()
  };
};

export const buildMissingApiKeyError = () => ({
  code: 'GEMINI_API_KEY_MISSING',
  error: `Gemini API key is not configured on the server. Add one of these environment variables: ${GEMINI_ENV_KEYS.join(', ')}.`
});

export const extractGeminiErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || 'Failed to process request');

  try {
    const parsed = JSON.parse(message);
    if (parsed.error?.message) {
      return parsed.error.message;
    }
  } catch {
    // Gemini SDK errors are not always JSON strings.
  }

  return message;
};
