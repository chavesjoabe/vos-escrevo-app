import React from 'react';
import { Box, Typography, TextField, IconButton, Tooltip } from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { Stroke, ToolType } from '../../domain/stroke';
import { CommentCanvas } from './CommentCanvas';
import { monoFontFamily, scriptureFontFamily } from '../../theme/theme';
import { useThemeMode } from '../../theme/ThemeContext';

export interface CommentPageHeaderProps {
  date: string;
  onDateChange: (date: string) => void;
  scale?: number;
  isAutoScale?: boolean;
  canZoomOut?: boolean;
  canZoomIn?: boolean;
  onZoomOut?: () => void;
  onZoomIn?: () => void;
  onResetZoom?: () => void;
}

export const CommentPageHeader: React.FC<CommentPageHeaderProps> = ({
  date,
  onDateChange,
  scale = 1,
  isAutoScale = true,
  canZoomOut = true,
  canZoomIn = true,
  onZoomOut,
  onZoomIn,
  onResetZoom,
}) => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const zoomPercent = Math.round(scale * 100);

  return (
    <Box
      sx={{
        py: 1.25,
        px: { xs: 2, sm: 3 },
        minHeight: '54px',
        height: '54px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: isDark ? '#0E131F' : '#FFFFFF',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        transition: 'background-color 0.2s ease',
        gap: 1.5,
      }}
    >
      <Box display="flex" alignItems="center" gap={1.25}>
        <Typography
          variant="caption"
          sx={{
            fontFamily: monoFontFamily,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: isDark ? '#64748B' : '#64748B',
            fontSize: '0.72rem',
          }}
        >
          Data:
        </Typography>
        <TextField
          type="date"
          size="small"
          value={date || ''}
          onChange={(e) => onDateChange(e.target.value)}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            sx: {
              fontFamily: scriptureFontFamily,
              fontSize: '1.05rem',
              fontWeight: 600,
              color: isDark ? '#38BDF8' : '#0284C7',
              cursor: 'pointer',
              '& input': {
                py: 0.25,
                px: 0.5,
                colorScheme: isDark ? 'dark' : 'light',
              },
            },
          }}
        />
      </Box>

      <Box display="flex" alignItems="center" gap={1.5}>
        {onZoomOut && onZoomIn && onResetZoom && (
          <Box
            display="flex"
            alignItems="center"
            sx={{
              px: 0.5,
              py: 0.2,
              borderRadius: 1.5,
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
            }}
          >
            <Tooltip title="Reduzir zoom (mínimo 78% para preservar leitura)">
              <span>
                <IconButton
                  size="small"
                  onClick={onZoomOut}
                  disabled={!canZoomOut}
                  aria-label="Reduzir zoom"
                  sx={{
                    p: 0.35,
                    color: isDark ? '#94A3B8' : '#64748B',
                    '&:hover': { color: isDark ? '#F8FAFC' : '#0F172A' },
                  }}
                >
                  <RemoveIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip
              title={
                isAutoScale
                  ? 'Escala automática ativa (mantém quebras de linha e posição dos traços entre Paisagem e Retrato)'
                  : 'Clique para restaurar escala automática por orientação'
              }
            >
              <Box
                component="button"
                type="button"
                onClick={onResetZoom}
                sx={{
                  px: 0.75,
                  py: 0.15,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: monoFontFamily,
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                  color: isAutoScale
                    ? isDark ? '#94A3B8' : '#475569'
                    : isDark ? '#38BDF8' : '#0284C7',
                  borderRadius: 1,
                  '&:hover': {
                    color: isDark ? '#F8FAFC' : '#0F172A',
                  },
                }}
              >
                {zoomPercent}%{isAutoScale ? '' : '·M'}
              </Box>
            </Tooltip>

            <Tooltip title="Aumentar zoom">
              <span>
                <IconButton
                  size="small"
                  onClick={onZoomIn}
                  disabled={!canZoomIn}
                  aria-label="Aumentar zoom"
                  sx={{
                    p: 0.35,
                    color: isDark ? '#94A3B8' : '#64748B',
                    '&:hover': { color: isDark ? '#F8FAFC' : '#0F172A' },
                  }}
                >
                  <AddIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )}

        <Typography
          variant="caption"
          sx={{
            display: { xs: 'none', md: 'inline' },
            fontFamily: scriptureFontFamily,
            fontStyle: 'italic',
            color: isDark ? '#475569' : '#94A3B8',
            fontSize: '0.82rem',
            whiteSpace: 'nowrap',
          }}
        >
          Anotações Pessoais
        </Typography>
      </Box>
    </Box>
  );
};

export interface CommentPagePanelProps {
  date?: string;
  strokes: Stroke[];
  activeTool: ToolType | 'eraser';
  activeColor: string;
  activeWidth: number;
  pencilOnly?: boolean;
  onDateChange?: (date: string) => void;
  onStrokeComplete: (stroke: Stroke) => void;
  onEraseStrokes?: (strokeIds: string[]) => void;
}

export const CommentPagePanel: React.FC<CommentPagePanelProps> = ({
  strokes,
  activeTool,
  activeColor,
  activeWidth,
  pencilOnly = false,
  onStrokeComplete,
  onEraseStrokes,
}) => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: isDark ? '#0B0F17' : '#FAF9F6',
        backgroundImage: isDark
          ? 'radial-gradient(rgba(255, 255, 255, 0.12) 1.2px, transparent 1.2px)'
          : 'radial-gradient(rgba(0, 0, 0, 0.11) 1.2px, transparent 1.2px)',
        backgroundSize: '24px 24px',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        transition: 'background-color 0.25s ease',
      }}
    >
      <CommentCanvas
        strokes={strokes}
        activeTool={activeTool}
        activeColor={activeColor}
        activeWidth={activeWidth}
        pencilOnly={pencilOnly}
        onStrokeComplete={onStrokeComplete}
        onEraseStrokes={onEraseStrokes}
      />
    </Box>
  );
};
