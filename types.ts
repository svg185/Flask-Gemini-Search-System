
export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  extendedContent?: string;
  imageUrl?: string;
  imageUrls?: string[];
  source: 'database' | 'ai' | 'manual';
  createdAt: number;
}

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

export interface HistoryItem {
  id: string;
  userId: string;
  query: string;
  timestamp: number;
}

export interface Bookmark {
  id: string;
  userId: string;
  entryId: string;
  timestamp: number;
}

export type AppView = 'search' | 'add' | 'profile' | 'auth' | 'admin';

export interface SearchResult {
  entry: KnowledgeEntry | null;
  isAI: boolean;
  query: string;
}
