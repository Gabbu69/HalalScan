import { useAppStore } from '../store/useAppStore';
import { buildOfflineAssistantResponse } from './offlineAssistant';

export const analyzeProductWithGemini = async (productName: string, ingredients: string, madhab: string) => {
  const isGeneral = madhab === 'General';
  
  const roleContext = isGeneral 
    ? `You are an expert food dietary analyst. Analyze the following product and its ingredients to identify if they contain pork, alcohol, or dubious animal-derived ingredients.`
    : `You are a Halal food compliance expert following Islamic dietary law (${madhab} fiqh). Analyze the following product and its ingredients.`;
    
  const recommendationTarget = isGeneral 
    ? "Brief general dietary summary or advice regarding these ingredients"
    : "Brief advice for the Muslim consumer";

  const language = useAppStore.getState().language;

  const prompt = `${roleContext}
Product: ${productName}
Ingredients: ${ingredients}

Return ONLY a valid JSON object with the following exact structure. CRITICAL INSTRUCTION: ALL string values in the JSON (except the keys and the 'verdict' itself) MUST be written in ${language}. This includes 'reason', 'recommendation', and any 'flagged_ingredients'.
{
  "verdict": "HALAL" | "HARAM" | "MASHBOOH",
  "confidence": <number between 0-100>,
  "flagged_ingredients": ["array of suspicious or haram ingredients found"],
  "reason": "Brief explanation of why it received this verdict",
  "recommendation": "${recommendationTarget}"
}`;

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to analyze product');
    }

    return await response.json();
  } catch (error) {
    console.warn("Backend Proxy Warning (Text Analysis):", error);
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

  const language = useAppStore.getState().language;

  const prompt = `${roleContext}

Return ONLY a valid JSON object with the following exact structure ("ingredients" should be a string of what you extracted). CRITICAL INSTRUCTION: ALL string values in the JSON (except the keys and the 'verdict' itself) MUST be written in ${language}. This includes 'name', 'ingredients', 'reason', 'recommendation', and any 'flagged_ingredients'.
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
    let base64Data = imageBase64;
    let mimeType = 'image/jpeg';

    if (imageBase64.includes('data:image')) {
      const parts = imageBase64.split(',');
      if (parts.length === 2) {
        base64Data = parts[1];
        mimeType = parts[0].split(';')[0].split(':')[1] || 'image/jpeg';
      }
    }

    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, imageBase64: base64Data, mimeType })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to analyze image');
    }

    return await response.json();
  } catch (error) {
    console.warn("Backend Proxy Warning (Image Analysis):", error);
    throw error;
  }
};

export const askHalalAssistant = async (query: string, madhab: string) => {
  const isGeneral = madhab === 'General';
  
  const roleContext = isGeneral
    ? `You are "Scan AI", a helpful and knowledgeable dietary assistant focusing on clean eating, identifying animal-derived ingredients, hidden pork by-products, and alcohol content in everyday consumer products.`
    : `You are "HalalScan AI", a helpful, respectful, and highly knowledgeable Islamic dietary assistant. Focus on ${madhab} fiqh rulings for food, ingredients, and everyday consumer products.`;

  const language = useAppStore.getState().language;

  const prompt = `${roleContext}
The user is asking: "${query}"

Provide a concise, direct, and well-structured answer. ${!isGeneral ? "If there is a difference of opinion, state it briefly. " : ""}Be conversational but authoritative. Please write your response in ${language}.`;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch chat response');
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.warn("Backend Proxy Warning (Chat):", error);
    return buildOfflineAssistantResponse(query, madhab);
  }
};
