
export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  source: 'database' | 'ai' | 'manual';
  createdAt: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
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

export type AppView = 'search' | 'add' | 'profile' | 'auth';

export interface SearchResult {
  entry: KnowledgeEntry | null;
  isAI: boolean;
  query: string;
}
