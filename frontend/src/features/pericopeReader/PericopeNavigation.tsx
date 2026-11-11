import React from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import { Pericope, PericopeSummary } from '../../domain/pericope';
import { Book } from '../../domain/book';
import { monoFontFamily, sansFontFamily } from '../../theme/theme';
import { useThemeMode } from '../../theme/ThemeContext';

interface PericopeNavigationProps {
  currentBook: Book;
  pericopes: PericopeSummary[];
  currentPericope: Pericope;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isChangingPage?: boolean;
  lastSavedTime: string | null;
  onSave: () => void;
  onSelectPericope: (pericopeId: string) => void;
  onBackToBooks: () => void;
}

export const PericopeNavigation: React.FC<PericopeNavigationProps> = ({
  currentBook,
  pericopes,
  currentPericope,
  hasUnsavedChanges,
  isSaving,
  isChangingPage = false,
  lastSavedTime,
  onSave,
  onSelectPericope,
  onBackToBooks,
}) => {
  const { mode, toggleThemeMode } = useThemeMode();
  const isDark = mode === 'dark';
  const isBusy = isSaving || isChangingPage;

  const currentIndex = pericopes.findIndex((p) => p.id === currentPericope.id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < pericopes.length - 1;

  const handlePrevious = () => {
    if (hasPrevious) {
      onSelectPericope(pericopes[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onSelectPericope(pericopes[currentIndex + 1].id);
    }
  };

  return (
    <Box
      component="header"
      width="100%"
      sx={{
        flexShrink: 0,
        pt: 'max(24px, calc(env(safe-area-inset-top, 0px) + 8px))',
        backgroundColor: isDark ? '#0E131F' : '#FFFFFF',
        borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
        zIndex: 200,
        userSelect: 'none',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        width="100%"
        sx={{
          position: 'relative',
          px: { xs: 2, sm: 2.5 },
          py: 0.75,
          height: 50,
        }}
      >
      {/* Left section: Back to Library & Book Identity */}
      <Box display="flex" alignItems="center" gap={1.5}>
        <Button
          variant="text"
          size="small"
          startIcon={<ArrowBackIosNewIcon sx={{ fontSize: '13px !important' }} />}
          onClick={onBackToBooks}
          disabled={isBusy}
          sx={{
            fontFamily: sansFontFamily,
            color: isDark ? '#94A3B8' : '#64748B',
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.82rem',
            px: 1,
            py: 0.4,
            borderRadius: 1.5,
            '&:hover': {
              color: isDark ? '#F8FAFC' : '#0F172A',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
            },
          }}
        >
          Livros
        </Button>

        <Box sx={{ width: '1px', height: '18px', backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0' }} />

        <Typography
          sx={{
            fontFamily: sansFontFamily,
            fontWeight: 600,
            fontSize: '1rem',
            color: isDark ? '#F8FAFC' : '#0F172A',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
          }}
        >
          {currentBook.name}
        </Typography>

        {/* Minimalist Chapter Picker */}
        <Select
          value={currentPericope.id}
          onChange={(e) => onSelectPericope(e.target.value as string)}
          disabled={isBusy}
          size="small"
          variant="outlined"
          sx={{
            minWidth: 72,
            fontFamily: sansFontFamily,
            fontSize: '0.84rem',
            fontWeight: 500,
            fontVariantNumeric: 'tabular-nums',
            color: isDark ? '#CBD5E1' : '#475569',
            backgroundColor: 'transparent',
            borderRadius: 1.5,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? '#64748B' : '#94A3B8',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? '#38BDF8' : '#0284C7',
              borderWidth: '1px',
            },
            '& .MuiSelect-select': {
              py: 0.45,
              px: 1.2,
              fontFamily: sansFontFamily,
            },
          }}
        >
          {pericopes.map((pericope, idx) => (
            <MenuItem
              key={pericope.id}
              value={pericope.id}
              sx={{
                fontFamily: sansFontFamily,
                fontSize: '0.84rem',
                fontVariantNumeric: 'tabular-nums',
                fontWeight: pericope.id === currentPericope.id ? 600 : 400,
                color: pericope.id === currentPericope.id
                  ? isDark ? '#38BDF8' : '#0284C7'
                  : isDark ? '#F8FAFC' : '#0F172A',
              }}
            >
              {pericope.orderInBook ?? pericope.order ?? idx + 1}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* Center section: Clickable "vos-escrevo" Logo returning to Home */}
      <Tooltip title="Voltar para a Página Inicial">
        <Box
          component="button"
          type="button"
          onClick={onBackToBooks}
          aria-label="Voltar para a página inicial vos-escrevo"
          sx={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            padding: '4px 10px',
            borderRadius: 1.5,
            cursor: 'pointer',
            transition: 'opacity 0.2s ease, background-color 0.2s ease',
            '&:hover': {
              opacity: 0.88,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
            },
          }}
        >
          <Box
            component="img"
            src={isDark ? '/logo-dark.png' : '/logo-light.png'}
            alt="vos-escrevo"
            draggable={false}
            sx={{
              height: { xs: 24, sm: 28 },
              width: 'auto',
              display: 'block',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
          />
        </Box>
      </Tooltip>

      {/* Right section: Theme Toggle, Save Status & Pagination */}
      <Box display="flex" alignItems="center" gap={1.5}>
        {/* Theme Toggle Button */}
        <Tooltip title={isDark ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}>
          <IconButton
            size="small"
            onClick={toggleThemeMode}
            sx={{
              color: isDark ? '#94A3B8' : '#64748B',
              p: 0.6,
              '&:hover': {
                color: isDark ? '#F8FAFC' : '#0F172A',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
              },
            }}
          >
            {isDark ? <LightModeOutlinedIcon sx={{ fontSize: 17 }} /> : <DarkModeOutlinedIcon sx={{ fontSize: 17 }} />}
          </IconButton>
        </Tooltip>

        <Box sx={{ width: '1px', height: '16px', backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0' }} />

        {/* Subtle Save Control */}
        {hasUnsavedChanges ? (
          <Button
            variant="outlined"
            size="small"
            startIcon={<SaveOutlinedIcon sx={{ fontSize: 15 }} />}
            onClick={onSave}
            disabled={isSaving}
            sx={{
              fontFamily: sansFontFamily,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.76rem',
              px: 1.4,
              py: 0.35,
              borderRadius: 1.5,
              color: isDark ? '#38BDF8' : '#0284C7',
              borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : '#BAE6FD',
              backgroundColor: isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(2, 132, 199, 0.06)',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.12)',
                borderColor: isDark ? '#38BDF8' : '#0284C7',
              },
            }}
          >
            {isSaving ? 'Salvando...' : 'Salvar anotações'}
          </Button>
        ) : (
          <Box display="flex" alignItems="center" gap={0.5} sx={{ color: isDark ? '#4ADE80' : '#16A34A', opacity: 0.9 }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 14 }} />
            <Typography variant="caption" sx={{ fontFamily: monoFontFamily, fontWeight: 500, fontSize: '0.72rem' }}>
              {lastSavedTime ? `Salvo (${lastSavedTime})` : 'Salvo'}
            </Typography>
          </Box>
        )}

        <Box sx={{ width: '1px', height: '16px', backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0' }} />

        {/* Pericope Pagination */}
        <Box display="flex" alignItems="center" gap={0.35}>
          <Typography
            sx={{
              fontFamily: monoFontFamily,
              color: isDark ? '#64748B' : '#64748B',
              fontSize: '0.74rem',
              mr: 0.5,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {currentIndex + 1} / {pericopes.length}
          </Typography>

          <Tooltip title="Perícope Anterior">
            <span>
              <IconButton
                onClick={handlePrevious}
                disabled={!hasPrevious || isBusy}
                size="small"
                sx={{
                  p: 0.5,
                  color: isDark ? '#94A3B8' : '#64748B',
                  '&:hover': {
                    color: isDark ? '#F8FAFC' : '#0F172A',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                  },
                }}
              >
                <ArrowBackIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Próxima Perícope">
            <span>
              <IconButton
                onClick={handleNext}
                disabled={!hasNext || isBusy}
                size="small"
                sx={{
                  p: 0.5,
                  color: isDark ? '#94A3B8' : '#64748B',
                  '&:hover': {
                    color: isDark ? '#F8FAFC' : '#0F172A',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                  },
                }}
              >
                <ArrowForwardIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>
      </Box>
    </Box>
  );
};
