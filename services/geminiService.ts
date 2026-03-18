import { GoogleGenAI } from '@google/genai';
import { SearchResponse, SearchResult } from '../types';

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY;
const searchEngineId = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;

const missingConfigMessage = 'Missing API configuration. Add VITE_GEMINI_API_KEY, VITE_GOOGLE_API_KEY, and VITE_GOOGLE_SEARCH_ENGINE_ID to your environment.';

const ensureConfig = () => {
  if (!geminiApiKey || !googleApiKey || !searchEngineId) {
    throw new Error(missingConfigMessage);
  }
};

const toSearchResults = (items: any[] = []): SearchResult[] => {
  return items.slice(0, 5).map((item) => ({
    title: item.title ?? 'Untitled result',
    link: item.link ?? '#',
    snippet: item.snippet ?? 'No snippet available.',
    displayLink: item.displayLink ?? new URL(item.link).hostname,
  }));
};

const formatSourcesForPrompt = (sources: SearchResult[]) => sources
  .map((source, index) => `${index + 1}. ${source.title}\nURL: ${source.link}\nSnippet: ${source.snippet}`)
  .join('\n\n');

export const geminiService = {
  async searchWeb(query: string): Promise<SearchResponse> {
    ensureConfig();

    const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
    searchUrl.searchParams.set('key', googleApiKey);
    searchUrl.searchParams.set('cx', searchEngineId);
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('num', '5');
    searchUrl.searchParams.set('safe', 'active');

    const searchResponse = await fetch(searchUrl.toString());
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      throw new Error(`Google Search request failed: ${searchResponse.status} ${errorText}`);
    }

    const searchData = await searchResponse.json();
    const sources = toSearchResults(searchData.items);

    if (sources.length === 0) {
      return {
        answer: 'No matching web results were returned. Try a more specific query or update the search engine configuration.',
        followUpIdeas: ['Refine the wording', 'Search for a named source', 'Try a broader topic'],
        sources: [],
      };
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const summaryResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are preparing a concise research brief for the user query: "${query}". Use only the sources below.\n\nSources:\n${formatSourcesForPrompt(sources)}\n\nReturn valid JSON with this exact shape:\n{\n  "answer": "2-3 short paragraphs summarizing the result and mentioning important caveats.",\n  "followUpIdeas": ["idea 1", "idea 2", "idea 3"]\n}\n\nRules:\n- Do not invent facts beyond the supplied sources.\n- Keep the answer under 220 words.\n- Keep followUpIdeas to exactly 3 items.`,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const parsed = JSON.parse(summaryResponse.text || '{}');

    return {
      answer: parsed.answer || 'Unable to summarize the search results.',
      followUpIdeas: Array.isArray(parsed.followUpIdeas) ? parsed.followUpIdeas.slice(0, 3) : [],
      sources,
    };
  },
  missingConfigMessage,
};
