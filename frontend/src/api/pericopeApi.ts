import { DailyVerse } from '../domain/dailyVerse';
import { Pericope, PericopeSummary } from '../domain/pericope';
import { Stroke } from '../domain/stroke';
import { httpClient } from './httpClient';
import { storageManager } from './storageManager';

interface BackendPericopeResponse {
  id: string;
  bookId: string;
  title: string;
  reference: string;
  orderInBook: number;
  verses: { verseNumber: number; text: string }[];
  highlightStrokes: Stroke[];
  commentPage: {
    date: string;
    strokes: Stroke[];
  };
}

export const INSPIRATIONAL_VERSES_POOL: DailyVerse[] = [
  {
    bookName: 'Salmos',
    bookAbbreviation: 'Sl',
    chapterNumber: 119,
    verseNumber: 105,
    reference: 'Salmos 119:105',
    text: 'Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.',
    theme: 'Direção & Sabedoria',
  },
  {
    bookName: 'Salmos',
    bookAbbreviation: 'Sl',
    chapterNumber: 23,
    verseNumber: 1,
    reference: 'Salmos 23:1-2',
    text: 'O Senhor é o meu pastor, nada me faltará. Ele me faz repousar em pastos verdejantes e guia-me mansamente a águas tranquilas.',
    theme: 'Confiança & Descanso',
  },
  {
    bookName: 'Josué',
    bookAbbreviation: 'Js',
    chapterNumber: 1,
    verseNumber: 9,
    reference: 'Josué 1:9',
    text: 'Não to mandei eu? Esforça-te, e tem bom ânimo; não temas, nem te espantes; porque o Senhor teu Deus é contigo, por onde quer que andares.',
    theme: 'Coragem & Presença',
  },
  {
    bookName: 'Isaías',
    bookAbbreviation: 'Is',
    chapterNumber: 40,
    verseNumber: 31,
    reference: 'Isaías 40:31',
    text: 'Mas os que esperam no Senhor renovarão as suas forças; subirão com asas como águias; correrão, e não se cansarão; caminharão, e não se fatigarão.',
    theme: 'Esperança & Renovação',
  },
  {
    bookName: 'João',
    bookAbbreviation: 'Jo',
    chapterNumber: 8,
    verseNumber: 12,
    reference: 'João 8:12',
    text: 'Falou-lhes, pois, Jesus outra vez, dizendo: Eu sou a luz do mundo; quem me segue não andará em trevas, mas terá a luz da vida.',
    theme: 'Luz & Vida',
  },
  {
    bookName: 'Romanos',
    bookAbbreviation: 'Rm',
    chapterNumber: 8,
    verseNumber: 28,
    reference: 'Romanos 8:28',
    text: 'E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus, daqueles que são chamados por seu decreto.',
    theme: 'Propósito & Fé',
  },
  {
    bookName: 'Filipenses',
    bookAbbreviation: 'Fp',
    chapterNumber: 4,
    verseNumber: 6,
    reference: 'Filipenses 4:6-7',
    text: 'Não estejais inquietos por coisa alguma; antes as vossas petições sejam em tudo conhecidas diante de Deus pela oração e súplica, com ação de graças. E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos sentimentos em Cristo Jesus.',
    theme: 'Paz & Oração',
  },
  {
    bookName: 'Provérbios',
    bookAbbreviation: 'Pv',
    chapterNumber: 3,
    verseNumber: 5,
    reference: 'Provérbios 3:5-6',
    text: 'Confia no Senhor de todo o teu coração, e não te estribes no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.',
    theme: 'Sabedoria & Confiança',
  },
  {
    bookName: 'Mateus',
    bookAbbreviation: 'Mt',
    chapterNumber: 11,
    verseNumber: 28,
    reference: 'Mateus 11:28',
    text: 'Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.',
    theme: 'Consolo & Graça',
  },
  {
    bookName: 'Salmos',
    bookAbbreviation: 'Sl',
    chapterNumber: 46,
    verseNumber: 1,
    reference: 'Salmos 46:1',
    text: 'Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.',
    theme: 'Refúgio & Fortaleza',
  },
  {
    bookName: 'Lamentações',
    bookAbbreviation: 'Lm',
    chapterNumber: 3,
    verseNumber: 22,
    reference: 'Lamentações 3:22-23',
    text: 'As misericórdias do Senhor são a causa de não sermos consumidos, porque as suas misericórdias não têm fim; novas são cada manhã; grande é a tua fidelidade.',
    theme: 'Fidelidade & Graça',
  },
  {
    bookName: 'Hebreus',
    bookAbbreviation: 'Hb',
    chapterNumber: 11,
    verseNumber: 1,
    reference: 'Hebreus 11:1',
    text: 'Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das coisas que se não veem.',
    theme: 'Fé & Esperança',
  },
];

const DAILY_VERSE_STORAGE_KEY = 'commented_bible_daily_verse_v1';

interface StoredDailyVerse {
  date: string;
  verse: DailyVerse;
}

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDeterministicDailyVerseForToday(): DailyVerse {
  const today = getTodayDateString();
  try {
    const raw = localStorage.getItem(DAILY_VERSE_STORAGE_KEY);
    if (raw) {
      const parsed: StoredDailyVerse = JSON.parse(raw);
      if (parsed?.date === today && parsed?.verse?.text && parsed?.verse?.reference) {
        return parsed.verse;
      }
    }
  } catch {
    // Ignore storage read error
  }

  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = (hash * 31 + today.charCodeAt(i)) >>> 0;
  }
  const index = hash % INSPIRATIONAL_VERSES_POOL.length;
  const selectedVerse = INSPIRATIONAL_VERSES_POOL[index];

  try {
    localStorage.setItem(
      DAILY_VERSE_STORAGE_KEY,
      JSON.stringify({ date: today, verse: selectedVerse })
    );
  } catch {
    // Ignore storage write error
  }

  return selectedVerse;
}

function mapPericopeResponse(response: BackendPericopeResponse): Pericope {
  return {
    id: response.id,
    bookId: response.bookId,
    title: response.title,
    reference: response.reference,
    orderInBook: response.orderInBook,
    order: response.orderInBook,
    verses: response.verses || [],
    highlightStrokes: response.highlightStrokes || [],
    commentPage: response.commentPage || {
      date: new Date().toISOString().split('T')[0],
      strokes: [],
    },
  };
}

export const pericopeApi = {
  async getPericopesByBookId(bookId: string): Promise<PericopeSummary[]> {
    try {
      const summaries = await httpClient.get<PericopeSummary[]>(`/books/${bookId}/pericopes`);
      return summaries.map((summary) => ({
        ...summary,
        order: summary.orderInBook ?? summary.order ?? 1,
      }));
    } catch {
      const localPericopes = storageManager.getPericopesByBookId(bookId);
      return localPericopes.map((p) => ({
        id: p.id,
        bookId: p.bookId,
        title: p.title,
        reference: p.reference,
        orderInBook: p.order,
        order: p.order,
      }));
    }
  },

  async getPericopeById(pericopeId: string): Promise<Pericope | undefined> {
    try {
      const response = await httpClient.get<BackendPericopeResponse>(`/pericopes/${pericopeId}`);
      return mapPericopeResponse(response);
    } catch {
      return storageManager.getPericopeById(pericopeId);
    }
  },

  async savePericopeStrokes(
    pericopeId: string,
    commentStrokes: Stroke[],
    highlightStrokes: Stroke[],
    date?: string
  ): Promise<Pericope> {
    const resolvedDate = date || new Date().toISOString().split('T')[0];
    try {
      await httpClient.put<BackendPericopeResponse>(
        `/pericopes/${pericopeId}/highlight-strokes`,
        highlightStrokes
      );
      const updatedResponse = await httpClient.put<BackendPericopeResponse>(
        `/pericopes/${pericopeId}/comment-page`,
        {
          date: resolvedDate,
          strokes: commentStrokes,
        }
      );
      return mapPericopeResponse(updatedResponse);
    } catch {
      return storageManager.savePericopeStrokes(
        pericopeId,
        commentStrokes,
        highlightStrokes,
        resolvedDate
      );
    }
  },

  async getVerseOfTheDay(): Promise<DailyVerse> {
    const today = getTodayDateString();
    try {
      const raw = localStorage.getItem(DAILY_VERSE_STORAGE_KEY);
      if (raw) {
        const parsed: StoredDailyVerse = JSON.parse(raw);
        if (parsed?.date === today && parsed?.verse?.text && parsed?.verse?.reference) {
          return parsed.verse;
        }
      }
    } catch {
      // Ignore storage read error
    }

    try {
      const verse = await httpClient.get<DailyVerse>('/pericopes/verse-of-the-day');
      if (verse && verse.text && verse.reference) {
        localStorage.setItem(
          DAILY_VERSE_STORAGE_KEY,
          JSON.stringify({ date: today, verse })
        );
        return verse;
      }
    } catch {
      // Fall back to deterministic daily verse from local pool
    }

    return getDeterministicDailyVerseForToday();
  },

  async resetData(): Promise<void> {
    storageManager.resetCurrentUserData();
  },
};
