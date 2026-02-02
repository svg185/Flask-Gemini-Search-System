
import { KnowledgeEntry, User, HistoryItem, Bookmark, UserRole } from '../types';

const DB_NAME = 'SKEngineDB';
const STORE_NAME = 'knowledge_base';
const DB_VERSION = 1;

const KEYS = {
  USERS: 'smart_search_users',
  CURRENT_USER: 'smart_search_session',
  HISTORY: 'smart_search_history',
  BOOKMARKS: 'smart_search_bookmarks',
};

// IndexedDB Helper
const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// Seed initial admin user if not present (LocalStorage fine for auth)
const seedAdmin = () => {
  const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  const adminEmail = "kumarkartik2146@gmail.com";
  if (!users.some(u => u.email === adminEmail)) {
    users.push({
      id: 'admin-1',
      username: 'Kartik Kumar (Admin)',
      email: adminEmail,
      role: 'admin'
    });
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  }
};
seedAdmin();

export const storageService = {
  // Knowledge Base (IndexedDB - ASYNC)
  getEntries: async (): Promise<KnowledgeEntry[]> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  search: async (query: string): Promise<KnowledgeEntry | null> => {
    const entries = await storageService.getEntries();
    const normalizedQuery = query.toLowerCase().trim();
    return entries.find(e => e.title.toLowerCase() === normalizedQuery) || null;
  },

  save: async (title: string, content: string, source: KnowledgeEntry['source'], id?: string, imageUrl?: string, extendedContent?: string, imageUrls?: string[]): Promise<KnowledgeEntry> => {
    const db = await getDB();
    const newEntry: KnowledgeEntry = {
      id: id || crypto.randomUUID(),
      title: title.trim(),
      content: content.trim(),
      extendedContent: extendedContent,
      imageUrl: imageUrl,
      imageUrls: imageUrls,
      source,
      createdAt: Date.now(),
    };
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(newEntry);
      request.onsuccess = () => resolve(newEntry);
      request.onerror = () => reject(request.error);
    });
  },

  updateSource: async (id: string, newSource: KnowledgeEntry['source']) => {
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const entry = getRequest.result;
      if (entry) {
        entry.source = newSource;
        store.put(entry);
      }
    };
  },

  deleteEntry: async (id: string) => {
    const db = await getDB();
    // Fix: Explicitly type Promise as void to allow parameterless resolve() on success.
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // Bulk Operations
  exportKnowledge: async (): Promise<string> => {
    const entries = await storageService.getEntries();
    return JSON.stringify(entries, null, 2);
  },

  importKnowledge: async (jsonData: string): Promise<{ success: boolean, count: number, error?: string }> => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!Array.isArray(parsed)) throw new Error("Invalid format: Root must be an array.");
      
      const db = await getDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      let count = 0;
      for (const e of parsed) {
        if (e.id && e.title && e.content) {
          store.put(e);
          count++;
        }
      }
      return { success: true, count };
    } catch (e) {
      return { success: false, count: 0, error: (e as Error).message };
    }
  },

  clearAllKnowledge: async () => {
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.clear();
  },

  // Authentication & User Management (Small data - LocalStorage is fine)
  register: (username: string, email: string, role: UserRole = 'user'): User => {
    const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    const newUser: User = { id: crypto.randomUUID(), username, email, role };
    users.push(newUser);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    return newUser;
  },

  getAllUsers: (): User[] => {
    return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  },

  deleteUser: (id: string) => {
    const users = storageService.getAllUsers().filter(u => u.id !== id);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  },

  login: (email: string): User | null => {
    const users: User[] = storageService.getAllUsers();
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

  addHistory: (userId: string, query: string) => {
    const history: HistoryItem[] = JSON.parse(localStorage.getItem(KEYS.HISTORY) || '[]');
    const newItem: HistoryItem = { id: crypto.randomUUID(), userId, query, timestamp: Date.now() };
    history.unshift(newItem);
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history.slice(0, 50)));
  },

  getHistory: (userId: string): HistoryItem[] => {
    const history: HistoryItem[] = JSON.parse(localStorage.getItem(KEYS.HISTORY) || '[]');
    return history.filter(h => h.userId === userId);
  },

  clearHistory: (userId: string) => {
    const history: HistoryItem[] = JSON.parse(localStorage.getItem(KEYS.HISTORY) || '[]');
    const filtered = history.filter(h => h.userId !== userId);
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(filtered));
  },

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

  getBookmarkedEntries: async (userId: string): Promise<KnowledgeEntry[]> => {
    const bookmarks: Bookmark[] = JSON.parse(localStorage.getItem(KEYS.BOOKMARKS) || '[]');
    const userBookmarks = bookmarks.filter(b => b.userId === userId);
    const entries = await storageService.getEntries();
    return entries.filter(e => userBookmarks.some(b => b.entryId === e.id));
  }
};
