import { Book } from '../domain/book';
import { Pericope, CommentPage, StickyNote } from '../domain/pericope';
import { Stroke } from '../domain/stroke';
import { AUTH_SESSION_STORAGE_KEY } from './httpClient';
import { initialBooks, initialPericopes } from './mockData';

const BOOKS_KEY = 'commented_bible_books';
const PERICOPES_KEY = 'commented_bible_pericopes_readonly_v2';
const USER_ANNOTATIONS_KEY = 'commented_bible_user_annotations_v1';

export interface StoredUserAnnotation {
  userId: string;
  pericopeId: string;
  highlightStrokes: Stroke[];
  commentPage: CommentPage;
  updatedAt: string;
}

function resolveCurrentUserId(explicitUserId?: string): string {
  if (explicitUserId) {
    return explicitUserId;
  }
  try {
    const raw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) return 'anonymous';
    const parsed = JSON.parse(raw);
    return parsed?.user?.id || 'anonymous';
  } catch {
    return 'anonymous';
  }
}

class StorageManager {
  private books: Map<string, Book> = new Map();
  private pericopes: Map<string, Pericope> = new Map();
  private userAnnotations: Map<string, StoredUserAnnotation> = new Map();

  constructor() {
    this.initializeStore();
  }

  private annotationKey(userId: string, pericopeId: string): string {
    return `${userId}::${pericopeId}`;
  }

  private initializeStore(): void {
    const savedBooks = localStorage.getItem(BOOKS_KEY);
    const savedPericopes = localStorage.getItem(PERICOPES_KEY);
    const savedAnnotations = localStorage.getItem(USER_ANNOTATIONS_KEY);

    if (savedBooks) {
      try {
        const parsedBooks: Book[] = JSON.parse(savedBooks);
        parsedBooks.forEach((book) => this.books.set(book.id, book));
      } catch (error) {
        console.error('Failed to parse saved books, resetting to seed data', error);
        this.loadSeedBooks();
      }
    } else {
      this.loadSeedBooks();
    }

    if (savedPericopes) {
      try {
        const parsedPericopes: Pericope[] = JSON.parse(savedPericopes);
        parsedPericopes.forEach((pericope) => this.pericopes.set(pericope.id, pericope));
      } catch (error) {
        console.error('Failed to parse saved pericopes, resetting to seed data', error);
        this.loadSeedPericopes();
      }
    } else {
      this.loadSeedPericopes();
    }

    if (savedAnnotations) {
      try {
        const parsedAnnotations: StoredUserAnnotation[] = JSON.parse(savedAnnotations);
        parsedAnnotations.forEach((item) => {
          this.userAnnotations.set(this.annotationKey(item.userId, item.pericopeId), item);
        });
      } catch (error) {
        console.error('Failed to parse saved user annotations', error);
        this.userAnnotations.clear();
      }
    }
  }

  private loadSeedBooks(): void {
    this.books.clear();
    initialBooks.forEach((book) => this.books.set(book.id, book));
    this.saveBooksToLocalStorage();
  }

  private loadSeedPericopes(): void {
    this.pericopes.clear();
    const today = new Date().toISOString().split('T')[0];
    initialPericopes.forEach((pericope) => {
      // Keep base pericope clean of any user's strokes
      this.pericopes.set(pericope.id, {
        ...pericope,
        highlightStrokes: [],
        commentPage: {
          date: today,
          strokes: [],
          stickyNotes: [],
        },
      });
    });
    this.savePericopesToLocalStorage();
  }

  private saveBooksToLocalStorage(): void {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(Array.from(this.books.values())));
  }

  private savePericopesToLocalStorage(): void {
    localStorage.setItem(PERICOPES_KEY, JSON.stringify(Array.from(this.pericopes.values())));
  }

  private saveAnnotationsToLocalStorage(): void {
    localStorage.setItem(
      USER_ANNOTATIONS_KEY,
      JSON.stringify(Array.from(this.userAnnotations.values()))
    );
  }

  public getBooks(): Book[] {
    return Array.from(this.books.values());
  }

  public getBookById(bookId: string): Book | undefined {
    return this.books.get(bookId);
  }

  public getPericopesByBookId(bookId: string): Pericope[] {
    return Array.from(this.pericopes.values())
      .filter((pericope) => pericope.bookId === bookId)
      .sort((a, b) => a.order - b.order);
  }

  public getPericopeById(pericopeId: string, userId?: string): Pericope | undefined {
    const basePericope = this.pericopes.get(pericopeId);
    if (!basePericope) {
      return undefined;
    }

    const activeUserId = resolveCurrentUserId(userId);
    const key = this.annotationKey(activeUserId, pericopeId);
    const userAnnotation = this.userAnnotations.get(key);
    const today = new Date().toISOString().split('T')[0];

    return {
      ...basePericope,
      highlightStrokes: userAnnotation ? [...userAnnotation.highlightStrokes] : [],
      commentPage: userAnnotation
        ? {
            date: userAnnotation.commentPage.date || today,
            strokes: [...userAnnotation.commentPage.strokes],
            stickyNotes: [...(userAnnotation.commentPage.stickyNotes || [])],
          }
        : {
            date: today,
            strokes: [],
            stickyNotes: [],
          },
    };
  }

  public savePericopeStrokes(
    pericopeId: string,
    commentStrokes: Stroke[],
    highlightStrokes: Stroke[],
    date?: string,
    stickyNotes?: StickyNote[],
    userId?: string
  ): Pericope {
    const basePericope = this.pericopes.get(pericopeId);
    if (!basePericope) {
      throw new Error(`Pericope with ID ${pericopeId} not found`);
    }

    const activeUserId = resolveCurrentUserId(userId);
    const key = this.annotationKey(activeUserId, pericopeId);
    const existingAnnotation = this.userAnnotations.get(key);
    const resolvedDate =
      date !== undefined
        ? date
        : existingAnnotation?.commentPage.date || new Date().toISOString().split('T')[0];
    const resolvedStickyNotes =
      stickyNotes !== undefined
        ? [...stickyNotes]
        : [...(existingAnnotation?.commentPage.stickyNotes || [])];

    const updatedAnnotation: StoredUserAnnotation = {
      userId: activeUserId,
      pericopeId,
      highlightStrokes: [...highlightStrokes],
      commentPage: {
        date: resolvedDate,
        strokes: [...commentStrokes],
        stickyNotes: resolvedStickyNotes,
      },
      updatedAt: new Date().toISOString(),
    };

    this.userAnnotations.set(key, updatedAnnotation);
    this.saveAnnotationsToLocalStorage();

    return {
      ...basePericope,
      highlightStrokes: [...updatedAnnotation.highlightStrokes],
      commentPage: {
        date: updatedAnnotation.commentPage.date,
        strokes: [...updatedAnnotation.commentPage.strokes],
        stickyNotes: [...(updatedAnnotation.commentPage.stickyNotes || [])],
      },
    };
  }

  public resetCurrentUserData(userId?: string): void {
    const activeUserId = resolveCurrentUserId(userId);
    for (const [key, annotation] of this.userAnnotations.entries()) {
      if (annotation.userId === activeUserId) {
        this.userAnnotations.delete(key);
      }
    }
    this.saveAnnotationsToLocalStorage();
  }
}

export const storageManager = new StorageManager();
