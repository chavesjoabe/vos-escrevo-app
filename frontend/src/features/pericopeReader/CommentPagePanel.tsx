import React from 'react';
import { Box, Typography, TextField } from '@mui/material';
import { Stroke, ToolType } from '../../domain/stroke';
import { CommentCanvas } from './CommentCanvas';
import { monoFontFamily, scriptureFontFamily } from '../../theme/theme';
import { useThemeMode } from '../../theme/ThemeContext';

export interface CommentPageHeaderProps {
  date: string;
  onDateChange: (date: string) => void;
}

export const CommentPageHeader: React.FC<CommentPageHeaderProps> = ({ date, onDateChange }) => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

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

      <Typography
        variant="caption"
        sx={{
          fontFamily: scriptureFontFamily,
          fontStyle: 'italic',
          color: isDark ? '#475569' : '#94A3B8',
          fontSize: '0.82rem',
        }}
      >
        Anotações Pessoais
      </Typography>
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
