import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Collapse } from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { DailyVerse } from '../../domain/dailyVerse';
import { Book } from '../../domain/book';
import { pericopeApi, getDeterministicDailyVerseForToday } from '../../api/pericopeApi';
import { monoFontFamily, sansFontFamily } from '../../theme/theme';
import { useThemeMode } from '../../theme/ThemeContext';

interface DailyVerseCardProps {
  books: Book[];
  onOpenBook?: (bookId: string) => void;
}

export const DailyVerseCard: React.FC<DailyVerseCardProps> = ({ books, onOpenBook }) => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  // Initial state is collapsed; user clicks to expand and see the verse of the day
  const [expanded, setExpanded] = useState<boolean>(false);
  const [verse, setVerse] = useState<DailyVerse>(() => getDeterministicDailyVerseForToday());

  useEffect(() => {
    let active = true;
    pericopeApi
      .getVerseOfTheDay()
      .then((dailyVerse) => {
        if (active && dailyVerse) {
          setVerse(dailyVerse);
        }
      })
      .catch((error) => {
        console.error('Failed to load verse of the day', error);
      });
    return () => {
      active = false;
    };
  }, []);

  const matchedBook = books.find(
    (b) =>
      b.name.toLowerCase() === verse.bookName.toLowerCase() ||
      b.abbreviation?.toLowerCase() === verse.bookAbbreviation.toLowerCase()
  );

  return (
    <Box
      sx={{
        mb: 3.5,
        borderRadius: 2,
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#FFFFFF',
        overflow: 'hidden',
        transition: 'border-color 0.25s ease, background-color 0.25s ease',
      }}
    >
      {/* Clickable Header to Expand / Collapse */}
      <Box
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={() => setExpanded((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded((prev) => !prev);
          }
        }}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: { xs: 2.5, sm: 3 },
          py: 2,
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
          },
        }}
      >
        <Box display="flex" alignItems="center" gap={1.25} flexWrap="wrap">
          <Box display="flex" alignItems="center" gap={1}>
            <AutoAwesomeOutlinedIcon
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
              Versículo do Dia
            </Typography>
          </Box>

          {verse.theme && (
            <Box
              sx={{
                fontFamily: monoFontFamily,
                fontSize: '0.64rem',
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                px: 1,
                py: 0.25,
                borderRadius: 1,
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
                color: isDark ? '#94A3B8' : '#64748B',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC',
              }}
            >
              {verse.theme}
            </Box>
          )}
        </Box>

        <Box display="flex" alignItems="center" gap={0.75}>
          <Typography
            sx={{
              fontFamily: monoFontFamily,
              fontSize: '0.7rem',
              letterSpacing: '0.08em',
              color: '#64748B',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            {expanded ? 'Ocultar' : 'Clique para ler'}
          </Typography>
          {expanded ? (
            <KeyboardArrowUpIcon sx={{ fontSize: 20, color: isDark ? '#94A3B8' : '#64748B' }} />
          ) : (
            <KeyboardArrowDownIcon sx={{ fontSize: 20, color: isDark ? '#94A3B8' : '#64748B' }} />
          )}
        </Box>
      </Box>

      {/* Collapsible Content */}
      <Collapse in={expanded} timeout="auto">
        <Box
          sx={{
            px: { xs: 2.5, sm: 3 },
            pb: 2.5,
            pt: 0.5,
            borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9'}`,
          }}
        >
          {/* Verse Text: Non-italic sans font in light gray matching home subtitle */}
          <Box
            sx={{
              pl: { xs: 1.75, sm: 2.25 },
              py: 0.5,
              mt: 1.5,
              mb: 2,
              borderLeft: `2px solid ${isDark ? '#38BDF8' : '#0284C7'}`,
            }}
          >
            <Typography
              sx={{
                fontFamily: sansFontFamily,
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: { xs: '0.95rem', sm: '1.05rem' },
                lineHeight: 1.6,
                color: isDark ? '#94A3B8' : '#64748B',
              }}
            >
              {verse.text}
            </Typography>
          </Box>

          {/* Footer: Reference & Optional Quick Book Open */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={1}
          >
            <Typography
              sx={{
                fontFamily: monoFontFamily,
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#64748B',
              }}
            >
              — {verse.reference}
            </Typography>

            {matchedBook && onOpenBook && (
              <Button
                size="small"
                variant="text"
                endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenBook(matchedBook.id);
                }}
                sx={{
                  fontFamily: sansFontFamily,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: isDark ? '#38BDF8' : '#0284C7',
                  px: 1,
                  py: 0.25,
                  '&:hover': {
                    backgroundColor: isDark
                      ? 'rgba(56, 189, 248, 0.08)'
                      : 'rgba(2, 132, 199, 0.08)',
                  },
                }}
              >
                Abrir {matchedBook.name}
              </Button>
            )}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};
