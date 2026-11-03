import React from 'react';
import { Box, Typography } from '@mui/material';
import { Pericope } from '../../domain/pericope';
import { Stroke, ToolType } from '../../domain/stroke';
import { HighlightLayer } from './HighlightLayer';
import { monoFontFamily, sansFontFamily, scriptureFontFamily } from '../../theme/theme';
import { useThemeMode } from '../../theme/ThemeContext';

export interface PericopeHeaderProps {
  pericope: Pericope;
}

export const PericopeHeader: React.FC<PericopeHeaderProps> = ({ pericope }) => {
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
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: isDark ? '#0E131F' : '#FFFFFF',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        gap: 2,
        transition: 'background-color 0.2s ease',
      }}
    >
      <Typography
        variant="h4"
        component="h2"
        sx={{
          fontFamily: sansFontFamily,
          fontWeight: 600,
          color: isDark ? '#F8FAFC' : '#0F172A',
          fontSize: '1.25rem',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          letterSpacing: '-0.015em',
        }}
      >
        {pericope.title}
      </Typography>

      <Box
        sx={{
          px: 1.2,
          py: 0.35,
          borderRadius: 1.2,
          backgroundColor: isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(2, 132, 199, 0.08)',
          color: isDark ? '#38BDF8' : '#0284C7',
          fontWeight: 600,
          fontSize: '0.72rem',
          fontFamily: monoFontFamily,
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {pericope.reference}
      </Box>
    </Box>
  );
};

export interface PericopeTextPanelProps {
  pericope: Pericope;
  highlightStrokes: Stroke[];
  activeTool: ToolType | 'eraser';
  activeColor: string;
  activeWidth: number;
  pencilOnly?: boolean;
  onStrokeComplete: (stroke: Stroke) => void;
  onEraseStrokes?: (strokeIds: string[]) => void;
}

export const PericopeTextPanel: React.FC<PericopeTextPanelProps> = ({
  pericope,
  highlightStrokes,
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
        position: 'relative',
        p: { xs: 3, md: 4.5 },
        pb: '55vh',
        backgroundColor: isDark ? '#0B0F17' : '#FFFFFF',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        transition: 'background-color 0.25s ease',
      }}
    >
      {/* Render Bible Verses with Classical Editorial Typography */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '620px',
          mx: 'auto',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {pericope.verses.map((verse) => (
          <Box
            key={verse.verseNumber}
            sx={{
              mb: 2.75,
              display: 'flex',
              alignItems: 'baseline',
              gap: 1.5,
            }}
          >
            <Typography
              component="span"
              sx={{
                fontFamily: monoFontFamily,
                fontWeight: 600,
                fontSize: '0.75rem',
                color: isDark ? '#38BDF8' : '#0284C7',
                lineHeight: '1.9',
                minWidth: '22px',
                textAlign: 'right',
                userSelect: 'none',
                opacity: 0.9,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {verse.verseNumber}
            </Typography>
            <Typography
              component="span"
              sx={{
                fontFamily: scriptureFontFamily,
                fontSize: '1.18rem',
                lineHeight: 1.9,
                color: isDark ? '#F1F5F9' : '#0F172A',
                letterSpacing: '0.005em',
                userSelect: 'none',
                textWrap: 'pretty',
              }}
            >
              {verse.text}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Marker & Pencil Drawing Layer Over Text */}
      <HighlightLayer
        strokes={highlightStrokes}
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
