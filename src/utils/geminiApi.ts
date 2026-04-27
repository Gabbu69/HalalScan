import { GoogleGenAI } from '@google/genai';

const getAiClient = () => {
  const overrideKey = localStorage.getItem('gemini_api_key_override');
  const apiKey = overrideKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("No API key available");
  return new GoogleGenAI({ apiKey });
};

export const analyzeIngredientsWithGemini = async (productName: string, ingredients: string, madhab: string) => {
  const isGeneral = madhab === 'General';
  
  const roleContext = isGeneral 
    ? `You are an expert food dietary analyst. Analyze the following product and its ingredients to identify if they contain pork, alcohol, or dubious animal-derived ingredients.`
    : `You are a Halal food compliance expert following Islamic dietary law (${madhab} fiqh). Analyze the following product and its ingredients.`;
    
  const recommendationTarget = isGeneral 
    ? "Brief general dietary summary or advice regarding these ingredients"
    : "Brief advice for the Muslim consumer";

  const prompt = `${roleContext}
Product: ${productName}
Ingredients: ${ingredients}

Return ONLY a valid JSON object with the following exact structure:
{
  "verdict": "HALAL" | "HARAM" | "MASHBOOH",
  "confidence": <number between 0-100>,
  "flagged_ingredients": ["array of suspicious or haram ingredients found"],
  "reason": "Brief explanation of why it received this verdict",
  "recommendation": "${recommendationTarget}"
}`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const textResponse = response.text || "{}";
    const jsonStr = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const analyzeImageWithGemini = async (imageBase64: string, madhab: string) => {
  const isGeneral = madhab === 'General';
  
  const roleContext = isGeneral
    ? `You are an expert food dietary analyst. I've uploaded a picture of a product's ingredient list. 

1. Extract the text/ingredients from the image.
2. Analyze the ingredients to identify if they contain pork, alcohol, or dubious animal-derived ingredients.`
    : `You are a Halal food compliance expert following Islamic dietary law (${madhab} fiqh). 
I've uploaded a picture of a product's ingredient list. 

1. Extract the text/ingredients from the image.
2. Analyze the ingredients for Halal compliance.`;

  const recommendationTarget = isGeneral 
    ? "Brief general advice based on the ingredients"
    : "Brief advice";

  const prompt = `${roleContext}

Return ONLY a valid JSON object with the following exact structure ("ingredients" should be a string of what you extracted):
{
  "name": "Extracted brand/product name if visible, or Unknown",
  "ingredients": "Extracted ingredients list",
  "verdict": "HALAL" | "HARAM" | "MASHBOOH",
  "confidence": <number between 0-100>,
  "flagged_ingredients": ["array of suspicious or haram ingredients found"],
  "reason": "Brief explanation of why it received this verdict",
  "recommendation": "${recommendationTarget}"
}`;

  try {
    const ai = getAiClient();
    
    // Safely parse base64 and mimeType
    let base64Data = imageBase64;
    let mimeType = 'image/jpeg'; // default fallback

    if (imageBase64.includes('data:image')) {
      const parts = imageBase64.split(',');
      if (parts.length === 2) {
        base64Data = parts[1];
        mimeType = parts[0].split(';')[0].split(':')[1] || 'image/jpeg';
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: [
        { text: prompt },
        { inlineData: { data: base64Data, mimeType } }
      ],
      config: {
        responseMimeType: 'application/json',
      }
    });

    const textResponse = response.text || "{}";
    const jsonStr = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Vision API Error:", error);
    throw error;
  }
};

export const askHalalAssistant = async (query: string, madhab: string) => {
  const isGeneral = madhab === 'General';
  
  const roleContext = isGeneral
    ? `You are "Scan AI", a helpful and knowledgeable dietary assistant focusing on clean eating, identifying animal-derived ingredients, hidden pork by-products, and alcohol content in everyday consumer products.`
    : `You are "HalalScan AI", a helpful, respectful, and highly knowledgeable Islamic dietary assistant. Focus on ${madhab} fiqh rulings for food, ingredients, and everyday consumer products.`;

  const prompt = `${roleContext}
The user is asking: "${query}"

Provide a concise, direct, and well-structured answer. ${!isGeneral ? "If there is a difference of opinion, state it briefly. " : ""}Be conversational but authoritative.`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Chat API Error:", error);
    throw error;
  }
};
