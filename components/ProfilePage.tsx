
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
    setHistory(storageService.getHistory(user.id));
    setBookmarks(storageService.getBookmarkedEntries(user.id));
  }, [user.id]);

  const removeBookmark = (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation();
    storageService.toggleBookmark(user.id, entryId);
    setBookmarks(storageService.getBookmarkedEntries(user.id));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex items-center gap-6">
        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl font-bold shadow-inner">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-800">{user.username}</h2>
          <p className="text-slate-500 font-medium">{user.email}</p>
          <div className="flex gap-4 mt-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded">User ID: {user.id.slice(0, 8)}</span>
          </div>
        </div>
      </div>

      <div className="flex border-b border-slate-200">
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

      <div className="grid gap-4">
        {activeTab === 'bookmarks' ? (
          bookmarks.length > 0 ? (
            bookmarks.map(entry => (
              <div 
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all cursor-pointer flex justify-between items-center"
              >
                <div>
                  <h4 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{entry.title}</h4>
                  <p className="text-slate-500 line-clamp-1 mt-1">{entry.content}</p>
                </div>
                <button 
                  onClick={(e) => removeBookmark(e, entry.id)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <i className="fas fa-star text-yellow-400"></i>
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
              <div className="text-slate-300 text-5xl mb-4"><i className="far fa-bookmark"></i></div>
              <p className="text-slate-500 font-medium">No bookmarked items yet.</p>
            </div>
          )
        ) : (
          history.length > 0 ? (
            history.map(item => (
              <div 
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                    <i className="fas fa-search"></i>
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">"{item.query}"</p>
                    <p className="text-xs text-slate-400">{new Date(item.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <i className="fas fa-chevron-right text-slate-300"></i>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
              <div className="text-slate-300 text-5xl mb-4"><i className="fas fa-history"></i></div>
              <p className="text-slate-500 font-medium">Your search history is empty.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};
