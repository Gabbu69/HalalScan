import { GoogleGenAI } from '@google/genai';

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: 'AIzaSyBUJXbECjy6_gEd_jb2UnUVkkWjw6oT-Sc' });
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
