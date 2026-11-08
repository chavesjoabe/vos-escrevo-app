import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { Book } from '../../domain/book';
import { PericopeSummary } from '../../domain/pericope';
import { bookApi } from '../../api/bookApi';
import { pericopeApi } from '../../api/pericopeApi';
import { recentBooksStorage, RecentBookEntry } from '../../api/recentBooksStorage';
import { BookListItem } from './BookListItem';
import { DailyVerseCard } from './DailyVerseCard';
import { monoFontFamily, sansFontFamily } from '../../theme/theme';
import { useThemeMode } from '../../theme/ThemeContext';
import { useAuth } from '../auth/AuthContext';

interface BookSelectionPageProps {
  onSelectBook: (bookId: string, pericopeId?: string) => void;
}

export const BookSelectionPage: React.FC<BookSelectionPageProps> = ({ onSelectBook }) => {
  const { mode, toggleThemeMode } = useThemeMode();
  const { user, logout } = useAuth();
  const isDark = mode === 'dark';

  const [books, setBooks] = useState<Book[]>([]);
  const [recentEntries, setRecentEntries] = useState<RecentBookEntry[]>([]);
  const [tabValue, setTabValue] = useState<'ALL' | 'NT' | 'OT'>('ALL');
  const [loadingBooks, setLoadingBooks] = useState(true);

  // Book & Chapter Selector State
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [chapters, setChapters] = useState<PericopeSummary[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [loadingChapters, setLoadingChapters] = useState<boolean>(false);

  const loadBooks = async () => {
    setLoadingBooks(true);
    try {
      const data = await bookApi.getAllBooks();
      setBooks(data);
      setRecentEntries(recentBooksStorage.getRecentBooks(user?.id));
    } catch (error) {
      console.error('Falha ao carregar livros', error);
    } finally {
      setLoadingBooks(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, [user?.id]);

  // Load chapters when a book is selected in the dropdown
  useEffect(() => {
    if (!selectedBookId) {
      setChapters([]);
      setSelectedChapterId('');
      return;
    }

    let cancelled = false;
    const fetchChapters = async () => {
      setLoadingChapters(true);
      try {
        const chapterList = await pericopeApi.getPericopesByBookId(selectedBookId);
        if (!cancelled) {
          setChapters(chapterList);
          setSelectedChapterId('');
        }
      } catch (error) {
        console.error('Falha ao carregar capítulos do livro selecionado', error);
      } finally {
        if (!cancelled) {
          setLoadingChapters(false);
        }
      }
    };

    fetchChapters();
    return () => {
      cancelled = true;
    };
  }, [selectedBookId]);

  const handleResetData = async () => {
    if (window.confirm('Deseja restaurar os dados locais da sua conta e limpar o histórico de livros recentes?')) {
      await pericopeApi.resetData();
      recentBooksStorage.clearRecentBooks(user?.id);
      setRecentEntries([]);
      setSelectedBookId('');
      setChapters([]);
      setSelectedChapterId('');
      await loadBooks();
    }
  };

  // Filter books for the Book Select dropdown based on Testament tab
  const selectableBooks = useMemo(() => {
    return books.filter((book) => {
      if (tabValue === 'NT') return book.testament === 'NT';
      if (tabValue === 'OT') return book.testament === 'OT';
      return true;
    });
  }, [books, tabValue]);

  // Resolve the last 5 accessed books in order of most recent access
  const recentBooks = useMemo(() => {
    const bookMap = new Map(books.map((book) => [book.id, book]));
    return recentEntries
      .map((entry) => ({
        entry,
        book: bookMap.get(entry.bookId),
      }))
      .filter((item): item is { entry: RecentBookEntry; book: Book } => Boolean(item.book))
      .slice(0, 5);
  }, [books, recentEntries]);

  const handleBookSelectChange = (newBookId: string) => {
    setSelectedBookId(newBookId);
    setSelectedChapterId('');
  };

  const handleChapterSelectChange = (newChapterId: string) => {
    setSelectedChapterId(newChapterId);
    if (selectedBookId && newChapterId) {
      onSelectBook(selectedBookId, newChapterId);
    }
  };

  const handleRecentBookClick = (bookId: string) => {
    const recentEntry = recentEntries.find((entry) => entry.bookId === bookId);
    onSelectBook(bookId, recentEntry?.lastPericopeId);
  };

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        backgroundColor: isDark ? '#0B0F17' : '#F8FAFC',
        pt: {
          xs: 'max(32px, calc(env(safe-area-inset-top, 0px) + 20px))',
          md: 'max(48px, calc(env(safe-area-inset-top, 0px) + 28px))',
        },
        pb: { xs: 4, md: 6 },
        px: { xs: 2, sm: 4 },
        transition: 'background-color 0.25s ease',
        scrollbarWidth: 'thin',
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: isDark ? '#0B0F17' : '#F8FAFC',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: isDark ? '#334155' : '#CBD5E1',
          borderRadius: '4px',
        },
      }}
    >
      <Container maxWidth="md">
        {/* Top Control Bar: Brand Identity, User Badge, Mode Toggle & Logout */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={1.5}
          mb={{ xs: 2, md: 2.5 }}
        >
          <Typography
            sx={{
              fontFamily: monoFontFamily,
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#64748B',
            }}
          >
            Diário de Comentários · BLIVRE
          </Typography>

          <Box display="flex" alignItems="center" gap={1.25} flexWrap="wrap">
            {user && (
              <Box
                display="flex"
                alignItems="center"
                gap={0.6}
                sx={{
                  px: 1.25,
                  py: 0.35,
                  borderRadius: 4,
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#FFFFFF',
                }}
              >
                <PersonOutlineIcon
                  sx={{ fontSize: 15, color: isDark ? '#38BDF8' : '#0284C7' }}
                />
                <Typography
                  sx={{
                    fontFamily: monoFontFamily,
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    color: isDark ? '#CBD5E1' : '#334155',
                  }}
                >
                  {user.name}
                </Typography>
              </Box>
            )}

            <Tooltip title={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}>
              <Button
                variant="outlined"
                size="small"
                onClick={toggleThemeMode}
                startIcon={
                  isDark ? (
                    <LightModeOutlinedIcon sx={{ fontSize: 16 }} />
                  ) : (
                    <DarkModeOutlinedIcon sx={{ fontSize: 16 }} />
                  )
                }
                sx={{
                  fontFamily: monoFontFamily,
                  fontSize: '0.72rem',
                  letterSpacing: '0.06em',
                  color: isDark ? '#94A3B8' : '#475569',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#FFFFFF',
                  borderRadius: 5,
                  px: 1.5,
                  py: 0.4,
                  '&:hover': {
                    borderColor: isDark ? '#64748B' : '#94A3B8',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                  },
                }}
              >
                {isDark ? 'Modo Claro' : 'Modo Escuro'}
              </Button>
            </Tooltip>

            <Tooltip title="Limpar histórico de recentes">
              <Button
                variant="text"
                size="small"
                onClick={handleResetData}
                startIcon={<RefreshIcon sx={{ fontSize: 15 }} />}
                sx={{
                  fontFamily: monoFontFamily,
                  fontSize: '0.7rem',
                  color: isDark ? '#475569' : '#94A3B8',
                  textTransform: 'none',
                  '&:hover': {
                    color: isDark ? '#F8FAFC' : '#0F172A',
                    backgroundColor: 'transparent',
                  },
                }}
              >
                Resetar
              </Button>
            </Tooltip>

            <Tooltip title="Encerrar sessão">
              <Button
                variant="text"
                size="small"
                onClick={logout}
                startIcon={<LogoutOutlinedIcon sx={{ fontSize: 15 }} />}
                sx={{
                  fontFamily: monoFontFamily,
                  fontSize: '0.7rem',
                  color: isDark ? '#94A3B8' : '#64748B',
                  textTransform: 'none',
                  '&:hover': {
                    color: isDark ? '#F87171' : '#DC2626',
                    backgroundColor: 'transparent',
                  },
                }}
              >
                Sair
              </Button>
            </Tooltip>
          </Box>
        </Box>

        {/* Hero Masthead */}
        <Box sx={{ mb: { xs: 3.5, md: 4.5 } }}>
          <Box sx={{ mb: { xs: 2, md: 2.5 } }}>
            <Box
              component="img"
              src={isDark ? '/logo-dark.png' : '/logo-light.png'}
              alt="vos-escrevo"
              draggable={false}
              sx={{
                height: { xs: 45, sm: 58 },
                width: 'auto',
                display: 'block',
                userSelect: 'none',
                WebkitUserSelect: 'none',
              }}
            />
          </Box>

          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.4rem', sm: '3.5rem' },
              fontWeight: 300,
              lineHeight: 1.12,
              letterSpacing: '-0.035em',
              color: isDark ? '#F8FAFC' : '#0F172A',
              mb: 2.2,
            }}
          >
            Estude a Palavra.
            <br />
            <Box
              component="span"
              sx={{
                color: isDark ? '#5C82A6' : '#2563EB',
                fontWeight: 400,
              }}
            >
              Escrito à mão.
            </Box>
          </Typography>

          <Typography
            variant="subtitle1"
            sx={{
              fontSize: { xs: '0.95rem', sm: '1.05rem' },
              lineHeight: 1.6,
              color: '#64748B',
              maxWidth: '640px',
            }}
          >
            Selecione um livro e capítulo para abrir sua folha de leitura e anotações com o Apple Pencil, ou retome um dos seus últimos estudos.
          </Typography>
        </Box>

        {/* Random Inspirational Verse of the Day Card ("Versículo do Dia") */}
        <DailyVerseCard
          books={books}
          onOpenBook={(bookId) => onSelectBook(bookId)}
        />

        {/* Book & Chapter Selection Panel */}
        <Box
          sx={{
            mb: 5,
            p: { xs: 2.5, sm: 3 },
            borderRadius: 2,
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#FFFFFF',
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2.5}
            flexWrap="wrap"
            gap={1.5}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <MenuBookOutlinedIcon
                sx={{ fontSize: 18, color: isDark ? '#38BDF8' : '#0284C7' }}
              />
              <Typography
                sx={{
                  fontFamily: monoFontFamily,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: isDark ? '#F8FAFC' : '#0F172A',
                }}
              >
                Selecionar Livro & Capítulo
              </Typography>
            </Box>

            <Tabs
              value={tabValue}
              onChange={(_, val) => {
                setTabValue(val);
                setSelectedBookId('');
                setChapters([]);
                setSelectedChapterId('');
              }}
              sx={{
                minHeight: 32,
                '& .MuiTabs-indicator': {
                  backgroundColor: isDark ? '#38BDF8' : '#0284C7',
                  height: '2px',
                  borderRadius: '1px',
                },
              }}
            >
              <Tab
                label="Todos"
                value="ALL"
                sx={{
                  textTransform: 'none',
                  fontWeight: tabValue === 'ALL' ? 600 : 400,
                  color:
                    tabValue === 'ALL'
                      ? isDark
                        ? '#F8FAFC !important'
                        : '#0F172A !important'
                      : '#64748B',
                  fontSize: '0.8rem',
                  minWidth: 'auto',
                  px: 1.2,
                  py: 0.25,
                }}
              />
              <Tab
                label="Novo Testamento"
                value="NT"
                sx={{
                  textTransform: 'none',
                  fontWeight: tabValue === 'NT' ? 600 : 400,
                  color:
                    tabValue === 'NT'
                      ? isDark
                        ? '#F8FAFC !important'
                        : '#0F172A !important'
                      : '#64748B',
                  fontSize: '0.8rem',
                  minWidth: 'auto',
                  px: 1.2,
                  py: 0.25,
                }}
              />
              <Tab
                label="Antigo Testamento"
                value="OT"
                sx={{
                  textTransform: 'none',
                  fontWeight: tabValue === 'OT' ? 600 : 400,
                  color:
                    tabValue === 'OT'
                      ? isDark
                        ? '#F8FAFC !important'
                        : '#0F172A !important'
                      : '#64748B',
                  fontSize: '0.8rem',
                  minWidth: 'auto',
                  px: 1.2,
                  py: 0.25,
                }}
              />
            </Tabs>
          </Box>

          <Box
            display="grid"
            gridTemplateColumns={{ xs: '1fr', sm: '1.2fr 1fr' }}
            gap={2}
          >
            {/* Book Select */}
            <FormControl fullWidth size="medium">
              <Typography
                sx={{
                  fontFamily: monoFontFamily,
                  fontSize: '0.7rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: isDark ? '#94A3B8' : '#64748B',
                  mb: 0.75,
                }}
              >
                1. Livro
              </Typography>
              <Select
                displayEmpty
                value={selectedBookId}
                onChange={(e) => handleBookSelectChange(e.target.value as string)}
                disabled={loadingBooks}
                sx={{
                  fontFamily: sansFontFamily,
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  backgroundColor: isDark ? '#0B0F17' : '#F8FAFC',
                  borderRadius: 1.5,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDark ? '#64748B' : '#94A3B8',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDark ? '#38BDF8' : '#0284C7',
                  },
                }}
              >
                <MenuItem value="" disabled sx={{ fontFamily: sansFontFamily }}>
                  <Box component="span" sx={{ fontFamily: sansFontFamily, color: isDark ? '#64748B' : '#94A3B8' }}>
                    {loadingBooks ? 'Carregando livros...' : 'Escolha um livro...'}
                  </Box>
                </MenuItem>
                {selectableBooks.map((book) => (
                  <MenuItem key={book.id} value={book.id} sx={{ fontFamily: sansFontFamily }}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      width="100%"
                      gap={1.5}
                    >
                      <Typography sx={{ fontFamily: sansFontFamily, fontWeight: 500, fontSize: '0.92rem' }}>
                        {book.name}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: monoFontFamily,
                          fontSize: '0.72rem',
                          color: '#64748B',
                        }}
                      >
                        {book.abbreviation} · {book.pericopeCount}{' '}
                        {book.pericopeCount === 1 ? 'cap.' : 'caps.'}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Chapter Select */}
            <FormControl fullWidth size="medium">
              <Typography
                sx={{
                  fontFamily: monoFontFamily,
                  fontSize: '0.7rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: isDark ? '#94A3B8' : '#64748B',
                  mb: 0.75,
                }}
              >
                2. Capítulo
              </Typography>
              <Select
                displayEmpty
                value={selectedChapterId}
                onChange={(e) => handleChapterSelectChange(e.target.value as string)}
                disabled={!selectedBookId || loadingChapters}
                sx={{
                  fontFamily: sansFontFamily,
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  backgroundColor: isDark ? '#0B0F17' : '#F8FAFC',
                  borderRadius: 1.5,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDark ? '#64748B' : '#94A3B8',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDark ? '#38BDF8' : '#0284C7',
                  },
                }}
              >
                <MenuItem value="" disabled sx={{ fontFamily: sansFontFamily }}>
                  <Box
                    component="span"
                    display="flex"
                    alignItems="center"
                    gap={1}
                    sx={{ fontFamily: sansFontFamily, color: isDark ? '#64748B' : '#94A3B8' }}
                  >
                    {loadingChapters ? (
                      <>
                        <CircularProgress size={14} /> Carregando capítulos...
                      </>
                    ) : !selectedBookId ? (
                      'Selecione um livro primeiro...'
                    ) : (
                      'Escolha o capítulo...'
                    )}
                  </Box>
                </MenuItem>
                {chapters.map((chapter, idx) => (
                  <MenuItem
                    key={chapter.id}
                    value={chapter.id}
                    sx={{
                      fontFamily: sansFontFamily,
                      fontSize: '0.92rem',
                      fontWeight: 500,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {chapter.orderInBook ?? chapter.order ?? idx + 1}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Last 5 Accessed Books Section Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={1.5}
          px={{ xs: 0.5, sm: 1 }}
        >
          <Typography
            sx={{
              fontFamily: monoFontFamily,
              fontSize: '0.74rem',
              fontWeight: 600,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: isDark ? '#94A3B8' : '#475569',
            }}
          >
            Últimos 5 Livros Acessados
          </Typography>

          <Typography
            sx={{
              fontFamily: monoFontFamily,
              fontSize: '0.74rem',
              color: isDark ? '#475569' : '#94A3B8',
            }}
          >
            {recentBooks.length} / 5 recentes
          </Typography>
        </Box>

        {/* Monolithic Index Directory for Recent Books */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 1.25,
            px: { xs: 1.5, sm: 2.5 },
            borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
            fontFamily: monoFontFamily,
            fontSize: '0.7rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: isDark ? '#475569' : '#94A3B8',
          }}
        >
          <div>Volume & Descrição</div>
          <div>Testamento · Capítulos</div>
        </Box>

        {recentBooks.length === 0 ? (
          <Box
            sx={{
              py: 5,
              px: 3,
              textAlign: 'center',
              borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : '#EDF2F7'}`,
            }}
          >
            <Typography
              sx={{
                fontFamily: sansFontFamily,
                fontSize: '0.95rem',
                color: isDark ? '#64748B' : '#64748B',
              }}
            >
              Nenhum livro acessado recentemente. Selecione um livro e capítulo acima para iniciar sua leitura.
            </Typography>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" mt={0.5}>
            {recentBooks.map(({ book }, idx) => (
              <BookListItem
                key={book.id}
                book={book}
                indexNumber={idx + 1}
                onSelectBook={handleRecentBookClick}
              />
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
};
