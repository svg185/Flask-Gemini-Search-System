
import { KnowledgeEntry, User, HistoryItem, Bookmark } from '../types';

const KEYS = {
  KNOWLEDGE: 'smart_search_knowledge_base',
  USERS: 'smart_search_users',
  CURRENT_USER: 'smart_search_session',
  HISTORY: 'smart_search_history',
  BOOKMARKS: 'smart_search_bookmarks',
};

export const storageService = {
  // Knowledge Base
  getEntries: (): KnowledgeEntry[] => {
    const data = localStorage.getItem(KEYS.KNOWLEDGE);
    return data ? JSON.parse(data) : [];
  },

  search: (query: string): KnowledgeEntry | null => {
    const entries = storageService.getEntries();
    const normalizedQuery = query.toLowerCase().trim();
    return entries.find(e => e.title.toLowerCase() === normalizedQuery) || null;
  },

  save: (title: string, content: string, source: KnowledgeEntry['source']): KnowledgeEntry => {
    const entries = storageService.getEntries();
    const newEntry: KnowledgeEntry = {
      id: crypto.randomUUID(),
      title: title.trim(),
      content: content.trim(),
      source,
      createdAt: Date.now(),
    };
    
    const existingIndex = entries.findIndex(e => e.title.toLowerCase() === title.toLowerCase().trim());
    if (existingIndex > -1) {
      entries[existingIndex] = newEntry;
    } else {
      entries.push(newEntry);
    }
    
    localStorage.setItem(KEYS.KNOWLEDGE, JSON.stringify(entries));
    return newEntry;
  },

  // Authentication
  register: (username: string, email: string): User => {
    const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    const newUser: User = { id: crypto.randomUUID(), username, email };
    users.push(newUser);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    return newUser;
  },

  login: (email: string): User | null => {
    const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    const user = users.find(u => u.email === email);
    if (user) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    }
    return null;
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  logout: () => {
    localStorage.removeItem(KEYS.CURRENT_USER);
  },

  // History
  addHistory: (userId: string, query: string) => {
    const history: HistoryItem[] = JSON.parse(localStorage.getItem(KEYS.HISTORY) || '[]');
    const newItem: HistoryItem = { id: crypto.randomUUID(), userId, query, timestamp: Date.now() };
    history.unshift(newItem); // Newest first
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history.slice(0, 50))); // Keep last 50
  },

  getHistory: (userId: string): HistoryItem[] => {
    const history: HistoryItem[] = JSON.parse(localStorage.getItem(KEYS.HISTORY) || '[]');
    return history.filter(h => h.userId === userId);
  },

  // Bookmarks
  toggleBookmark: (userId: string, entryId: string) => {
    const bookmarks: Bookmark[] = JSON.parse(localStorage.getItem(KEYS.BOOKMARKS) || '[]');
    const index = bookmarks.findIndex(b => b.userId === userId && b.entryId === entryId);
    
    if (index > -1) {
      bookmarks.splice(index, 1);
    } else {
      bookmarks.push({ id: crypto.randomUUID(), userId, entryId, timestamp: Date.now() });
    }
    localStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(bookmarks));
  },

  isBookmarked: (userId: string, entryId: string): boolean => {
    const bookmarks: Bookmark[] = JSON.parse(localStorage.getItem(KEYS.BOOKMARKS) || '[]');
    return bookmarks.some(b => b.userId === userId && b.entryId === entryId);
  },

  getBookmarkedEntries: (userId: string): KnowledgeEntry[] => {
    const bookmarks: Bookmark[] = JSON.parse(localStorage.getItem(KEYS.BOOKMARKS) || '[]');
    const userBookmarks = bookmarks.filter(b => b.userId === userId);
    const entries = storageService.getEntries();
    return entries.filter(e => userBookmarks.some(b => b.entryId === e.id));
  }
};
