export const GEMINI_ENV_KEYS = [
  'GEMINI_API_KEY',
  'GOOGLE_API_KEY',
  'GOOGLE_GENERATIVE_AI_API_KEY'
] as const;

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

export const getGeminiConfigStatus = () => {
  const configuredKeys = GEMINI_ENV_KEYS.filter(key => Boolean(process.env[key]?.trim()));
  return {
    configured: configuredKeys.length > 0,
    configuredEnvNames: configuredKeys
  };
};
