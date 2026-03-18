import React, { useEffect, useMemo, useState } from 'react';
import { geminiService } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { SearchResponse, User } from '../types';

interface SearchInterfaceProps {
  user: User | null;
  onNotFound: (query: string) => void;
}

const emptyResponse: SearchResponse = {
  answer: '',
  followUpIdeas: [],
  sources: [],
};

export const SearchInterface: React.FC<SearchInterfaceProps> = ({ user, onNotFound }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [response, setResponse] = useState<SearchResponse>(emptyResponse);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setRecentSearches([]);
      return;
    }

    const history = storageService.getHistory(user.id).slice(0, 5).map((item) => item.query);
    setRecentSearches(history);
  }, [user]);

  const hasResults = response.answer || response.sources.length > 0;

  const sourceDomains = useMemo(() => {
    return response.sources.map((source) => {
      try {
        return new URL(source.link).hostname.replace(/^www\./, '');
      } catch {
        return source.displayLink;
      }
    });
  }, [response.sources]);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setIsSearching(true);
    setError(null);
    setResponse(emptyResponse);

    if (user) {
      storageService.addHistory(user.id, trimmedQuery);
      setRecentSearches(storageService.getHistory(user.id).slice(0, 5).map((item) => item.query));
    }

    try {
      const result = await geminiService.searchWeb(trimmedQuery);
      setResponse(result);
      if (!result.sources.length) {
        onNotFound(trimmedQuery);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error while searching.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-16">
      <section className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 text-white p-8 md:p-12 shadow-2xl">
        <div className="max-w-3xl space-y-5">
          <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.3em] text-cyan-200">
            Gemini + Google Custom Search
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">AI Search Engine Project</h1>
          <p className="text-lg text-slate-200 leading-8">
            Search the live web with Google Programmable Search, then turn the top results into a concise Gemini-generated research brief with source links and follow-up ideas.
          </p>
        </div>
      </section>

      <form onSubmit={handleSearch} className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-200 space-y-4">
        <label className="block text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Search the web</label>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try: latest advances in quantum batteries"
            className="flex-1 rounded-2xl border border-slate-300 px-5 py-4 text-lg outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            disabled={isSearching}
          />
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="rounded-2xl bg-blue-600 px-8 py-4 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSearching ? 'Searching…' : 'Search'}
          </button>
        </div>
        <p className="text-sm text-slate-500">
          This app requires valid environment variables for Gemini, Google Search API, and the programmable search engine ID.
        </p>
      </form>

      {recentSearches.length > 0 && (
        <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-black text-slate-900">Recent searches</h2>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Signed-in users only</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {recentSearches.map((item, index) => (
              <button
                key={`${item}-${index}`}
                type="button"
                onClick={() => setQuery(item)}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
              >
                {item}
              </button>
            ))}
          </div>
        </section>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 font-medium">
          {error}
        </div>
      )}

      {hasResults && (
        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <article className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-200 space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Gemini summary</p>
              <h2 className="text-3xl font-black text-slate-900 mt-2">{query.trim()}</h2>
            </div>
            <div className="text-slate-700 leading-8 whitespace-pre-wrap">{response.answer}</div>

            {response.followUpIdeas.length > 0 && (
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-3">Suggested follow-up searches</h3>
                <ul className="grid gap-3 md:grid-cols-3">
                  {response.followUpIdeas.map((idea) => (
                    <li key={idea} className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900 border border-blue-100">
                      {idea}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>

          <aside className="space-y-6">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-black text-slate-900 mb-4">Top sources</h3>
              <div className="space-y-4">
                {response.sources.map((source, index) => (
                  <a
                    key={source.link}
                    href={source.link}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-2xl border border-slate-200 p-4 hover:border-blue-400 hover:bg-blue-50/40"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Result {index + 1}</p>
                    <h4 className="mt-2 font-bold text-slate-900">{source.title}</h4>
                    <p className="mt-2 text-sm text-slate-600">{source.snippet}</p>
                    <p className="mt-3 text-sm font-semibold text-blue-700">{source.displayLink}</p>
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-sm">
              <h3 className="text-lg font-black mb-4">Source domains</h3>
              <ul className="space-y-2 text-sm text-slate-200">
                {sourceDomains.map((domain, index) => (
                  <li key={`${domain}-${index}`} className="flex items-center gap-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                      {index + 1}
                    </span>
                    {domain}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </section>
      )}
    </div>
  );
};
