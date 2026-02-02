
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { User, HistoryItem, KnowledgeEntry } from '../types';

interface ProfilePageProps {
  user: User;
  onSelectEntry: (entry: KnowledgeEntry) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onSelectEntry }) => {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'history'>('bookmarks');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [bookmarks, setBookmarks] = useState<KnowledgeEntry[]>([]);

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    setHistory(storageService.getHistory(user.id));
    const bookmarked = await storageService.getBookmarkedEntries(user.id);
    setBookmarks(bookmarked);
  };

  const removeBookmark = async (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation();
    storageService.toggleBookmark(user.id, entryId);
    const bookmarked = await storageService.getBookmarkedEntries(user.id);
    setBookmarks(bookmarked);
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your entire search history? This action cannot be undone.')) {
      storageService.clearHistory(user.id);
      setHistory([]);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex items-center gap-6">
        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl font-bold shadow-inner border border-blue-50">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{user.username}</h2>
          <p className="text-slate-500 font-medium">{user.email}</p>
          <div className="flex gap-4 mt-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded">Auth Level: {user.role}</span>
          </div>
        </div>
      </div>

      <div className="flex border-b border-slate-200 justify-between items-center pr-2">
        <div className="flex">
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`px-8 py-4 font-bold text-sm transition-all relative ${
              activeTab === 'bookmarks' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <i className="fas fa-bookmark mr-2"></i>
            Bookmarks ({bookmarks.length})
            {activeTab === 'bookmarks' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-full"></div>}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-8 py-4 font-bold text-sm transition-all relative ${
              activeTab === 'history' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <i className="fas fa-history mr-2"></i>
            Search History
            {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-full"></div>}
          </button>
        </div>
        
        {activeTab === 'history' && history.length > 0 && (
          <button 
            onClick={handleClearHistory}
            className="text-xs font-bold text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
          >
            <i className="fas fa-trash-alt"></i>
            Clear History
          </button>
        )}
      </div>

      <div className="grid gap-6">
        {activeTab === 'bookmarks' ? (
          bookmarks.length > 0 ? (
            bookmarks.map(entry => (
              <div 
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                className="group bg-white p-6 rounded-3xl border border-slate-200 hover:border-blue-400 hover:shadow-2xl transition-all cursor-pointer flex justify-between items-center"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 overflow-hidden border border-slate-100 flex-shrink-0">
                    {entry.imageUrl ? <img src={entry.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><i className="fas fa-image"></i></div>}
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-800 group-hover:text-blue-600 transition-colors capitalize">{entry.title}</h4>
                    <p className="text-slate-500 line-clamp-1 mt-1 font-medium">{entry.content}</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => removeBookmark(e, entry.id)}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-yellow-500 bg-yellow-50 hover:bg-yellow-100 transition-colors"
                >
                  <i className="fas fa-star text-lg"></i>
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-40 bg-white rounded-[3rem] border border-slate-100 shadow-inner">
              <div className="text-slate-200 text-8xl mb-6"><i className="far fa-bookmark"></i></div>
              <p className="text-slate-400 font-bold text-xl uppercase tracking-widest">Index is empty.</p>
            </div>
          )
        ) : (
          history.length > 0 ? (
            <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-50">
                {history.map(item => (
                  <div 
                    key={item.id}
                    className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-100">
                        <i className="fas fa-terminal"></i>
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-lg">"{item.query}"</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{new Date(item.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    <i className="fas fa-arrow-right text-slate-200 group-hover:text-blue-500 transition-colors"></i>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-40 bg-white rounded-[3rem] border border-slate-100 shadow-inner">
              <div className="text-slate-200 text-8xl mb-6"><i className="fas fa-history"></i></div>
              <p className="text-slate-400 font-bold text-xl uppercase tracking-widest">History Log Empty.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};
