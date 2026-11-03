import { Book } from '../domain/book';
import { httpClient } from './httpClient';
import { storageManager } from './storageManager';

export const bookApi = {
  async getAllBooks(): Promise<Book[]> {
    try {
      return await httpClient.get<Book[]>('/books');
    } catch {
      return storageManager.getBooks();
    }
  },

  async getBookById(bookId: string): Promise<Book | undefined> {
    try {
      return await httpClient.get<Book>(`/books/${bookId}`);
    } catch {
      return storageManager.getBookById(bookId);
    }
  },
};
