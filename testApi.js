import { GoogleGenAI } from '@google/genai';

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new GoogleGenAI({ apiKey });
};

async function testModel(modelName) {
  try {
    const ai = getAiClient();
    if (!ai) {
      console.log('Skipping Gemini API smoke test: no Gemini API key is configured.');
      return;
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: "hello",
    });
    console.log(`Success ${modelName}:`, response.text);
  } catch (err) {
    console.error(`Error ${modelName}:`, err.message);
  }
}

async function run() {
  await testModel(process.env.GEMINI_MODEL || 'gemini-2.5-flash');
}

run();
