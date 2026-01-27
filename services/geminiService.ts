
import { GoogleGenAI } from "@google/genai";

export const geminiService = {
  generateDefinition: async (query: string): Promise<string | null> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide a short, professional, and accurate definition for "${query}". The definition should be approximately 80 words and easy to understand. Return only the definition text.`,
        config: {
          temperature: 0.7,
          topP: 0.95,
        }
      });

      return response.text?.trim() || null;
    } catch (error) {
      console.error('Gemini API Error:', error);
      return null;
    }
  }
};
