import { GoogleGenAI } from '@google/genai';

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error('Set GEMINI_API_KEY before running this API smoke test.');
  }

  return new GoogleGenAI({ apiKey });
};

async function testModel(modelName) {
  try {
    const ai = getAiClient();
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
  await testModel('gemini-flash-latest');
  await testModel('gemini-3.1-flash-lite-preview');
  await testModel('gemini-3-flash-preview');
}

run();
