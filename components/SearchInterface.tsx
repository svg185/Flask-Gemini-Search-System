
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';
import { KnowledgeEntry, User } from '../types';

interface SearchInterfaceProps {
  user: User | null;
  onNotFound: (query: string) => void;
  selectedEntry?: KnowledgeEntry | null;
  onEdit?: (entry: KnowledgeEntry) => void;
}

export const SearchInterface: React.FC<SearchInterfaceProps> = ({ user, onNotFound, selectedEntry, onEdit }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [result, setResult] = useState<KnowledgeEntry | null>(null);
  const [sourceLabel, setSourceLabel] = useState<string>('');
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (selectedEntry) {
      setResult(selectedEntry);
      setQuery(selectedEntry.title);
      setSourceLabel('Loaded from context');
      if (user) {
        setIsBookmarked(storageService.isBookmarked(user.id, selectedEntry.id));
      }
    }
  }, [selectedEntry, user]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setResult(null);

    if (user) {
      storageService.addHistory(user.id, query.trim());
    }

    const localEntry = await storageService.search(query);
    
    if (localEntry) {
      setResult(localEntry);
      setSourceLabel('Retrieved from local database');
      if (user) setIsBookmarked(storageService.isBookmarked(user.id, localEntry.id));
      setIsSearching(false);
    } else {
      setSourceLabel('Synthesizing primary intelligence...');
      
      try {
        const [aiContent, aiImage] = await Promise.all([
          geminiService.generateDetailedContent(query),
          geminiService.generateContextualImage(query, "primary")
        ]);
        
        if (aiContent) {
          const newEntry = await storageService.save(query, aiContent, 'ai', undefined, aiImage || undefined);
          setResult(newEntry);
          setSourceLabel('Intel synthesized. Visual evidence acquired.');
          if (user) setIsBookmarked(storageService.isBookmarked(user.id, newEntry.id));
        } else {
          onNotFound(query);
        }
      } catch (err) {
        console.error(err);
        alert("Intelligence Synthesis Failed: Database link interrupted.");
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleDeepenAnalysis = async () => {
    if (!result) return;
    setIsExpanding(true);
    
    try {
      const [extendedContent, detailImg, contextImg] = await Promise.all([
        geminiService.generateExtendedAnalysis(result.title),
        geminiService.generateContextualImage(result.title, "detail"),
        geminiService.generateContextualImage(result.title, "context")
      ]);

      if (extendedContent) {
        const existingImages = result.imageUrls || [];
        const newImages = [...existingImages];
        if (detailImg) newImages.push(detailImg);
        if (contextImg) newImages.push(contextImg);

        const updatedEntry = await storageService.save(
          result.title, 
          result.content, 
          result.source, 
          result.id, 
          result.imageUrl, 
          extendedContent,
          newImages
        );
        setResult(updatedEntry);
        setSourceLabel('Analysis Deepened. Data schema extended.');
      }
    } catch (err) {
      console.error("Analysis Expansion Failed", err);
      alert("Large-scale data injection failed. Check system resources.");
    } finally {
      setIsExpanding(false);
    }
  };

  const handleBookmarkToggle = () => {
    if (!user || !result) return;
    storageService.toggleBookmark(user.id, result.id);
    setIsBookmarked(!isBookmarked);
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-24">
      <div className="text-center space-y-4 mb-10">
        <h2 className="text-6xl font-black text-slate-900 tracking-tighter">Smart Knowledge Engine</h2>
        <p className="text-slate-500 text-xl font-medium max-w-2xl mx-auto">Multimodal evidence retrieval for unstructured data silos.</p>
      </div>

      <form onSubmit={handleSearch} className="relative group max-w-3xl mx-auto">
        <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-[3rem] group-focus-within:bg-blue-500/20 transition-all"></div>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search complex topics..."
            className="w-full pl-16 pr-44 py-7 rounded-[2.5rem] border-2 border-white focus:border-blue-500 outline-none transition-all text-xl shadow-2xl bg-white/95 backdrop-blur-xl font-bold"
            disabled={isSearching}
          />
          <i className="fas fa-search absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 text-xl group-focus-within:text-blue-500"></i>
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-700 hover:bg-blue-800 text-white px-10 py-4.5 rounded-[1.5rem] font-black shadow-lg disabled:opacity-50 transition-all flex items-center gap-3 uppercase text-xs tracking-widest"
          >
            {isSearching ? <i className="fas fa-spinner fa-spin"></i> : 'Execute'}
          </button>
        </div>
      </form>

      {result && (
        <div className="flex flex-col gap-12 animate-fade-in">
          {/* Section 1: Strategic Intelligence Analysis (Text Section) */}
          <div className="bg-white border border-slate-200 rounded-[3rem] shadow-2xl overflow-hidden">
             <div className="bg-slate-900 px-16 py-10 text-white flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-blue-400 font-black text-[10px] uppercase tracking-[0.2em]">Intel Section 01: Synthesis</span>
                  <h3 className="text-4xl font-black tracking-tight capitalize">{result.title}</h3>
                </div>
                <div className="flex gap-4">
                  <button onClick={handleBookmarkToggle} className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${isBookmarked ? 'bg-yellow-400 border-yellow-500 text-slate-900' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}>
                    <i className={`${isBookmarked ? 'fas' : 'far'} fa-star text-lg`}></i>
                  </button>
                  {user?.role === 'admin' && (
                    <button onClick={() => onEdit?.(result)} className="w-14 h-14 rounded-2xl bg-white text-slate-900 flex items-center justify-center hover:scale-105 transition-transform">
                      <i className="fas fa-edit"></i>
                    </button>
                  )}
                </div>
             </div>

             <div className="p-16 grid lg:grid-cols-12 gap-16">
                <div className="lg:col-span-8 space-y-10">
                  <div className="prose prose-xl max-w-none text-slate-700 font-medium leading-[1.8] space-y-8">
                    {result.content.split('\n\n').map((para, i) => (
                      <p key={i} className="whitespace-pre-wrap">{para}</p>
                    ))}
                  </div>

                  {result.extendedContent && (
                    <div className="pt-10 border-t-4 border-blue-50 space-y-10 animate-fade-in">
                       <h4 className="text-2xl font-black text-blue-600 uppercase tracking-widest flex items-center gap-3">
                          <i className="fas fa-microscope"></i>
                          Advanced Technical Deep-Dive
                       </h4>
                       <div className="prose prose-xl max-w-none text-slate-600 font-medium leading-[1.8] space-y-8 italic bg-blue-50/30 p-10 rounded-[2rem]">
                        {result.extendedContent.split('\n\n').map((para, i) => (
                          <p key={i} className="whitespace-pre-wrap">{para}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {!result.extendedContent && (
                    <div className="mt-12 pt-12 border-t border-slate-100">
                        <button 
                          onClick={handleDeepenAnalysis}
                          disabled={isExpanding}
                          className="w-full bg-slate-50 hover:bg-blue-600 hover:text-white py-12 rounded-[2rem] border-2 border-dashed border-slate-200 hover:border-blue-600 transition-all font-black text-slate-400 uppercase tracking-[0.2em] flex flex-col items-center gap-4 group"
                        >
                          {isExpanding ? (
                            <>
                              <i className="fas fa-circle-notch fa-spin text-3xl"></i>
                              Analyzing high-order datasets...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-plus-circle text-4xl group-hover:scale-110 transition-transform"></i>
                              Request Deep-Dive Intelligence Expansion
                            </>
                          )}
                        </button>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-4 space-y-8">
                   <div className="bg-slate-50 p-10 rounded-[2rem] border border-slate-100">
                      <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-6">Subject Metadata</h4>
                      <div className="space-y-6">
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-xs font-bold">Origin</span>
                          <span className="text-slate-800 text-xs font-black uppercase tracking-wider">{result.source}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-xs font-bold">Indexed</span>
                          <span className="text-slate-800 text-xs font-black">{new Date(result.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-xs font-bold">Char Count</span>
                          <span className="text-slate-800 text-xs font-black">{result.content.length + (result.extendedContent?.length || 0)}</span>
                        </div>
                        <div className="pt-4 border-t border-slate-200">
                          <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                            <i className="fas fa-info-circle mr-2"></i>
                            Information integrity is verified using distributed local schemas. 
                          </p>
                        </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Section 2: Visual Evidence Repository (Images Section) */}
          <div className="space-y-8">
            <div className="flex items-center gap-4 ml-6">
              <div className="h-0.5 flex-grow bg-slate-200"></div>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] whitespace-nowrap">Section 02: Visual Evidence</h4>
              <div className="h-0.5 flex-grow bg-slate-200"></div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
               {/* Primary Asset */}
               <div className="lg:col-span-2 group relative rounded-[3rem] overflow-hidden shadow-2xl bg-slate-100 border-4 border-white aspect-video lg:aspect-auto">
                  {result.imageUrl ? (
                    <img src={result.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="Primary Evidence" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <i className="fas fa-image text-6xl"></i>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-10 flex items-end">
                     <div>
                        <p className="text-blue-400 font-black text-[10px] uppercase tracking-widest mb-1">Asset ID: V-001</p>
                        <h5 className="text-white text-xl font-black">Primary Synthetic Model</h5>
                     </div>
                  </div>
               </div>

               {/* Extended Grid */}
               {result.imageUrls && result.imageUrls.map((url, idx) => (
                 <div key={idx} className="group relative rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-white aspect-square bg-slate-100">
                    <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={`Evidence ${idx + 2}`} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <p className="text-white font-black text-xs uppercase tracking-widest">Variation {idx + 2}</p>
                    </div>
                 </div>
               ))}

               {isExpanding && (
                 <div className="aspect-square bg-slate-200 rounded-[2.5rem] flex items-center justify-center animate-pulse">
                    <i className="fas fa-spinner fa-spin text-slate-400"></i>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
