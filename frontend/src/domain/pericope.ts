import { Stroke } from './stroke';

export interface Verse {
  verseNumber: number;
  text: string;
}

export interface StickyNote {
  noteId: string;
  text: string;
  positionX: number;
  positionY: number;
  color: string;
  updatedAt?: string;
}

export interface CommentPage {
  date: string;
  strokes: Stroke[];
  stickyNotes?: StickyNote[];
}

export interface PericopeSummary {
  id: string;
  bookId: string;
  title: string;
  reference: string;
  orderInBook: number;
  order?: number;
}

export interface Pericope {
  id: string;
  bookId: string;
  title: string;
  reference: string;
  orderInBook?: number;
  order: number;
  verses: Verse[];
  highlightStrokes: Stroke[];
  commentPage: CommentPage;
}
