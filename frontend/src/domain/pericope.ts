import { Stroke } from './stroke';

export interface Verse {
  verseNumber: number;
  text: string;
}

export interface CommentPage {
  date: string;
  strokes: Stroke[];
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
