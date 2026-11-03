import { AUTH_SESSION_STORAGE_KEY } from './httpClient';

const RECENT_BOOKS_STORAGE_PREFIX = 'commented_bible_recent_books_v2_';
const MAX_RECENT_BOOKS = 5;

export interface RecentBookEntry {
  bookId: string;
  lastPericopeId?: string;
  lastChapterTitle?: string;
  accessedAt: string;
}

function getActiveUserStorageKey(explicitUserId?: string): string {
  if (explicitUserId) {
    return `${RECENT_BOOKS_STORAGE_PREFIX}${explicitUserId}`;
  }
  try {
    const raw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) return `${RECENT_BOOKS_STORAGE_PREFIX}anonymous`;
    const parsed = JSON.parse(raw);
    const userId = parsed?.user?.id || 'anonymous';
    return `${RECENT_BOOKS_STORAGE_PREFIX}${userId}`;
  } catch {
    return `${RECENT_BOOKS_STORAGE_PREFIX}anonymous`;
  }
}

export const recentBooksStorage = {
  getRecentBooks(userId?: string): RecentBookEntry[] {
    try {
      const raw = localStorage.getItem(getActiveUserStorageKey(userId));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.slice(0, MAX_RECENT_BOOKS);
    } catch (error) {
      console.warn('Failed to parse recent books from localStorage', error);
      return [];
    }
  },

  recordBookAccess(
    bookId: string,
    lastPericopeId?: string,
    lastChapterTitle?: string,
    userId?: string
  ): RecentBookEntry[] {
    const current = this.getRecentBooks(userId);
    const existing = current.find((entry) => entry.bookId === bookId);
    const updatedEntry: RecentBookEntry = {
      bookId,
      lastPericopeId: lastPericopeId ?? existing?.lastPericopeId,
      lastChapterTitle: lastChapterTitle ?? existing?.lastChapterTitle,
      accessedAt: new Date().toISOString(),
    };
    const next = [
      updatedEntry,
      ...current.filter((entry) => entry.bookId !== bookId),
    ].slice(0, MAX_RECENT_BOOKS);

    try {
      localStorage.setItem(getActiveUserStorageKey(userId), JSON.stringify(next));
    } catch (error) {
      console.warn('Failed to save recent books to localStorage', error);
    }
    return next;
  },

  clearRecentBooks(userId?: string): void {
    localStorage.removeItem(getActiveUserStorageKey(userId));
  },
};
