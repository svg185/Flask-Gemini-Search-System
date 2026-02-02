
import { GoogleGenAI } from "@google/genai";

export const geminiService = {
  generateDetailedContent: async (query: string): Promise<string | null> => {
    try {
      // Fix: Follow guidelines by using process.env.API_KEY directly for initialization
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Generate an elaborated, highly detailed professional briefing for the topic: "${query}". 
        Include the following structure in plain text:
        1. Comprehensive Overview (A detailed introduction)
        2. Core Concepts & Mechanics (How it works in depth)
        3. Historical significance or Evolution
        4. Practical Modern Applications and Impact.
        
        Aim for approximately 400-500 words of sophisticated content. Do not use markdown headers, just clear spacing between sections.`,
        config: {
          temperature: 0.8,
          thinkingConfig: { thinkingBudget: 2000 }
        }
      });

      return response.text?.trim() || null;
    } catch (error) {
      console.error('Gemini Text Error:', error);
      return null;
    }
  },

  generateExtendedAnalysis: async (query: string): Promise<string | null> => {
    try {
      // Fix: Follow guidelines by using process.env.API_KEY directly for initialization
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Provide an advanced "Extended Deep-Dive" into "${query}". 
        Focus on:
        - Technical nuances and specialized theories.
        - Future projections and emerging trends (2025-2030).
        - Critical controversies or challenges.
        - Comparative analysis with similar concepts.
        
        Provide another 600 words of high-level academic-style text.`,
        config: {
          temperature: 0.9,
          thinkingConfig: { thinkingBudget: 3000 }
        }
      });

      return response.text?.trim() || null;
    } catch (error) {
      console.error('Gemini Extended Text Error:', error);
      return null;
    }
  },

  generateContextualImage: async (query: string, variant: string = "primary"): Promise<string | null> => {
    try {
      // Fix: Follow guidelines by using process.env.API_KEY directly for initialization
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const promptMap: Record<string, string> = {
        primary: `A cinematic, high-quality, professional conceptual visual representing "${query}". Minimalistic, futuristic.`,
        detail: `A high-tech detailed macro shot or schematic diagram related to "${query}". Professional lighting.`,
        context: `An wide-angle environmental shot showing the impact or context of "${query}" in a modern world.`,
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `${promptMap[variant] || promptMap.primary} No text in the image.` }]
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          }
        }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error) {
      console.error('Gemini Image Error:', error);
      return null;
    }
  }
};
