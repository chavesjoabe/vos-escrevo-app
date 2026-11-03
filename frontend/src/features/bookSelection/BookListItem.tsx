import React from 'react';
import { Box, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Book } from '../../domain/book';
import { monoFontFamily, sansFontFamily } from '../../theme/theme';
import { useThemeMode } from '../../theme/ThemeContext';

interface BookListItemProps {
  book: Book;
  indexNumber: number;
  onSelectBook: (bookId: string) => void;
}

export const BookListItem: React.FC<BookListItemProps> = ({ book, indexNumber, onSelectBook }) => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const isNT = book.testament === 'NT';

  const formattedNum = String(indexNumber).padStart(2, '0');

  return (
    <Box
      onClick={() => onSelectBook(book.id)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: { xs: 2.2, sm: 2.5 },
        px: { xs: 1.5, sm: 2.5 },
        borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : '#EDF2F7'}`,
        cursor: 'pointer',
        borderRadius: 1.5,
        my: 0.25,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
        '&:hover': {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.035)' : '#F1F5F9',
          '& .row-title': {
            color: isDark ? '#38BDF8' : '#0284C7',
            transform: 'translateX(4px)',
          },
          '& .row-arrow': {
            opacity: 1,
            transform: 'translateX(0)',
          },
        },
      }}
    >
      {/* Left: Index number + Title + Short description */}
      <Box display="flex" alignItems="center" gap={{ xs: 1.5, sm: 2.5 }} overflow="hidden" mr={2}>
        <Typography
          sx={{
            fontFamily: monoFontFamily,
            fontSize: '0.8rem',
            color: isDark ? '#475569' : '#94A3B8',
            fontVariantNumeric: 'tabular-nums',
            width: '24px',
            flexShrink: 0,
          }}
        >
          {formattedNum}
        </Typography>

        <Typography
          className="row-title"
          sx={{
            fontFamily: sansFontFamily,
            fontWeight: 500,
            fontSize: { xs: '1.05rem', sm: '1.18rem' },
            letterSpacing: '-0.015em',
            color: isDark ? '#F8FAFC' : '#0F172A',
            transition: 'transform 0.2s ease, color 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          {book.name}
        </Typography>

        {book.description && (
          <Typography
            sx={{
              display: { xs: 'none', md: 'block' },
              fontFamily: sansFontFamily,
              fontSize: '0.85rem',
              color: isDark ? '#64748B' : '#64748B',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '380px',
            }}
          >
            {book.description}
          </Typography>
        )}
      </Box>

      {/* Right: Testament Pill + Section Count + Hover Arrow */}
      <Box display="flex" alignItems="center" gap={{ xs: 1.25, sm: 2 }} flexShrink={0}>
        <Box
          sx={{
            fontFamily: monoFontFamily,
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            px: 1,
            py: 0.35,
            borderRadius: 1,
            backgroundColor: isNT
              ? isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(2, 132, 199, 0.08)'
              : isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(217, 119, 6, 0.08)',
            color: isNT
              ? isDark ? '#38BDF8' : '#0284C7'
              : isDark ? '#F59E0B' : '#D97706',
          }}
        >
          {isNT ? 'Novo Testamento' : 'Antigo Testamento'}
        </Box>

        <Typography
          sx={{
            fontFamily: monoFontFamily,
            fontSize: '0.78rem',
            color: isDark ? '#64748B' : '#64748B',
            fontVariantNumeric: 'tabular-nums',
            minWidth: '84px',
            textAlign: 'right',
            display: { xs: 'none', sm: 'block' },
          }}
        >
          {book.pericopeCount} {book.pericopeCount === 1 ? 'capítulo' : 'capítulos'}
        </Typography>

        <ArrowForwardIcon
          className="row-arrow"
          sx={{
            fontSize: 16,
            color: isDark ? '#38BDF8' : '#0284C7',
            opacity: 0,
            transform: 'translateX(-6px)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </Box>
    </Box>
  );
};
