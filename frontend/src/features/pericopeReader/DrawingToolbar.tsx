import React, { useState } from 'react';
import {
  Paper,
  Tooltip,
  IconButton,
  Divider,
  Box,
  Typography,
  Chip,
  Collapse,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AutoFixNormalIcon from '@mui/icons-material/AutoFixNormal';
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined';
import AddIcon from '@mui/icons-material/Add';
import GestureIcon from '@mui/icons-material/Gesture';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { ActiveTool } from '../../domain/stroke';
import {
  pencilColors,
  darkPencilColors,
  markerColors,
  stickyNoteColors,
  pencilWidths,
  markerWidths,
} from '../../drawing/colorPalette';
import { useThemeMode } from '../../theme/ThemeContext';
import { monoFontFamily, sansFontFamily } from '../../theme/theme';

interface DrawingToolbarProps {
  activeTool: ActiveTool;
  activeColor: string;
  activeWidth: number;
  pencilOnly: boolean;
  onToolChange: (tool: ActiveTool) => void;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
  onTogglePencilOnly: () => void;
  onQuickAddStickyNote?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  activeTool,
  activeColor,
  activeWidth,
  pencilOnly,
  onToolChange,
  onColorChange,
  onWidthChange,
  onTogglePencilOnly,
  onQuickAddStickyNote,
  onUndo,
  onRedo,
  onClear,
  canUndo,
  canRedo,
}) => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Dark mode inks (luminous soft chalk pastels) vs Light mode inks (mid-depth dusty pastels)
  const darkPencilColorsList = [
    { label: 'Giz Pastel', hex: darkPencilColors.chalk },
    { label: 'Azul Céu Pastel', hex: darkPencilColors.sky },
    { label: 'Coral Pastel', hex: darkPencilColors.coral },
    { label: 'Menta Pastel', hex: darkPencilColors.mint },
    { label: 'Lavanda Pastel', hex: darkPencilColors.lavender },
  ];

  const lightPencilColorsList = [
    { label: 'Grafite Suave', hex: pencilColors.graphite },
    { label: 'Azul Pastel', hex: pencilColors.blue },
    { label: 'Terracota Suave', hex: pencilColors.terracotta },
    { label: 'Sálvia Pastel', hex: pencilColors.sage },
    { label: 'Lavanda Queimada', hex: pencilColors.lavender },
  ];

  const currentMarkerColors = [
    { label: 'Ouro Iluminura', hex: markerColors.yellow },
    { label: 'Verde Salgueiro', hex: markerColors.green },
    { label: 'Azul Névoa', hex: markerColors.blue },
    { label: 'Rosa Silvestre', hex: markerColors.pink },
    { label: 'Damasco Âmbar', hex: markerColors.orange },
  ];

  const currentStickyNoteColors = [
    { label: 'Post-it Amarelo', hex: stickyNoteColors.yellow },
    { label: 'Post-it Rosa', hex: stickyNoteColors.pink },
    { label: 'Post-it Menta', hex: stickyNoteColors.mint },
    { label: 'Post-it Azul Céu', hex: stickyNoteColors.sky },
    { label: 'Post-it Pêssego', hex: stickyNoteColors.amber },
  ];

  const activeColorPalette =
    activeTool === 'marker'
      ? currentMarkerColors
      : activeTool === 'stickyNote'
        ? currentStickyNoteColors
        : isDark
          ? darkPencilColorsList
          : lightPencilColorsList;

  const widths = activeTool === 'marker' ? markerWidths : pencilWidths;

  const handleToolbarPointerDown = (event: React.PointerEvent) => {
    event.stopPropagation();
  };

  const accentColor = isDark ? '#38BDF8' : '#0284C7';
  const accentBg = isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.08)';

  return (
    <Box
      onPointerDown={handleToolbarPointerDown}
      sx={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        touchAction: 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Collapsed Pill State */}
      {isCollapsed ? (
        <Paper
          elevation={0}
          onClick={() => setIsCollapsed(false)}
          sx={{
            py: 0.6,
            px: 1.75,
            borderRadius: 6,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1.25,
            backgroundColor: isDark ? 'rgba(14, 19, 31, 0.92)' : 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0'}`,
            boxShadow: isDark
              ? '0 8px 30px rgba(0, 0, 0, 0.6)'
              : '0 8px 24px rgba(15, 23, 42, 0.08)',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'scale(1.04)',
              borderColor: accentColor,
            },
          }}
        >
          {/* Active Tool Icon */}
          <Box display="flex" alignItems="center" gap={1}>
            {activeTool === 'pencil' && <EditIcon sx={{ color: activeColor, fontSize: 18 }} />}
            {activeTool === 'marker' && <BorderColorIcon sx={{ color: accentColor, fontSize: 18 }} />}
            {activeTool === 'stickyNote' && <StickyNote2OutlinedIcon sx={{ color: accentColor, fontSize: 18 }} />}
            {activeTool === 'eraser' && <AutoFixNormalIcon sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 18 }} />}

            <Typography
              variant="caption"
              sx={{
                fontFamily: sansFontFamily,
                fontWeight: 600,
                color: isDark ? '#F8FAFC' : '#0F172A',
                fontSize: '0.78rem',
                textTransform: 'capitalize',
              }}
            >
              {activeTool === 'pencil'
                ? 'Lápis'
                : activeTool === 'marker'
                  ? 'Marcador'
                  : activeTool === 'stickyNote'
                    ? 'Post-it'
                    : 'Borracha'}
            </Typography>

            {activeTool !== 'eraser' && (
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: activeColor,
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}`,
                }}
              />
            )}
          </Box>

          <Divider orientation="vertical" flexItem sx={{ my: 0.5, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }} />

          {/* Expand Arrow Button */}
          <Box display="flex" alignItems="center" gap={0.5} sx={{ color: accentColor, fontWeight: 600 }}>
            <KeyboardArrowUpIcon fontSize="small" />
          </Box>
        </Paper>
      ) : (
        /* Full Expanded Sculpted Dock State */
        <Collapse in={!isCollapsed} timeout={200}>
          <Paper
            elevation={0}
            sx={{
              p: 0.6,
              px: 1.5,
              borderRadius: 3,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: isDark ? 'rgba(14, 19, 31, 0.94)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(24px)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0'}`,
              boxShadow: isDark
                ? '0 12px 36px rgba(0, 0, 0, 0.7), 0 2px 8px rgba(0, 0, 0, 0.4)'
                : '0 8px 30px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(15, 23, 42, 0.03)',
              maxWidth: 'calc(100vw - 32px)',
              overflowX: 'auto',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              touchAction: 'none',
              transition: 'background-color 0.2s ease, border-color 0.2s ease',
            }}
          >
            {/* Tool Selector: Pencil, Marker, Eraser */}
            <Box display="flex" alignItems="center" gap={0.4}>
              <Tooltip title="Lápis / Pena (Anotações ou sublinhados)">
                <IconButton
                  size="small"
                  onClick={() => onToolChange('pencil')}
                  sx={{
                    px: 1,
                    py: 0.5,
                    borderRadius: 1.75,
                    backgroundColor: activeTool === 'pencil' ? accentBg : 'transparent',
                    color: activeTool === 'pencil' ? accentColor : isDark ? '#94A3B8' : '#64748B',
                    '&:hover': {
                      backgroundColor: accentBg,
                      color: accentColor,
                    },
                  }}
                >
                  <EditIcon sx={{ fontSize: 18 }} />
                  <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 600, fontSize: '0.74rem' }}>
                    Lápis
                  </Typography>
                </IconButton>
              </Tooltip>

              <Tooltip title="Marcador (Grifar passagens)">
                <IconButton
                  size="small"
                  onClick={() => onToolChange('marker')}
                  sx={{
                    px: 1,
                    py: 0.5,
                    borderRadius: 1.75,
                    backgroundColor: activeTool === 'marker' ? accentBg : 'transparent',
                    color: activeTool === 'marker' ? accentColor : isDark ? '#94A3B8' : '#64748B',
                    '&:hover': {
                      backgroundColor: accentBg,
                      color: accentColor,
                    },
                  }}
                >
                  <BorderColorIcon sx={{ fontSize: 18 }} />
                  <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 600, fontSize: '0.74rem' }}>
                    Marcador
                  </Typography>
                </IconButton>
              </Tooltip>

              <Tooltip title="Post-it (Colar nota de texto até 280 caracteres)">
                <IconButton
                  size="small"
                  onClick={() => onToolChange('stickyNote')}
                  sx={{
                    px: 1,
                    py: 0.5,
                    borderRadius: 1.75,
                    backgroundColor: activeTool === 'stickyNote' ? accentBg : 'transparent',
                    color: activeTool === 'stickyNote' ? accentColor : isDark ? '#94A3B8' : '#64748B',
                    '&:hover': {
                      backgroundColor: accentBg,
                      color: accentColor,
                    },
                  }}
                >
                  <StickyNote2OutlinedIcon sx={{ fontSize: 18 }} />
                  <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 600, fontSize: '0.74rem' }}>
                    Post-it
                  </Typography>
                </IconButton>
              </Tooltip>

              <Tooltip title="Borracha (Apagar traços ou Post-its)">
                <IconButton
                  size="small"
                  onClick={() => onToolChange('eraser')}
                  sx={{
                    px: 1,
                    py: 0.5,
                    borderRadius: 1.75,
                    backgroundColor: activeTool === 'eraser' ? accentBg : 'transparent',
                    color: activeTool === 'eraser' ? accentColor : isDark ? '#94A3B8' : '#64748B',
                    '&:hover': {
                      backgroundColor: accentBg,
                      color: accentColor,
                    },
                  }}
                >
                  <AutoFixNormalIcon sx={{ fontSize: 18 }} />
                  <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 600, fontSize: '0.74rem' }}>
                    Borracha
                  </Typography>
                </IconButton>
              </Tooltip>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ my: 0.5, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }} />

            {/* Curated Pigment Palette Selection */}
            {activeTool !== 'eraser' && (
              <Box display="flex" alignItems="center" gap={0.5}>
                {activeColorPalette.map((colorItem) => {
                  const isSelected = activeColor.toLowerCase() === colorItem.hex.toLowerCase();
                  return (
                    <Tooltip title={colorItem.label} key={colorItem.hex}>
                      <IconButton
                        size="small"
                        onClick={() => onColorChange(colorItem.hex)}
                        sx={{
                          p: 0.4,
                          border: isSelected ? `2px solid ${accentColor}` : '2px solid transparent',
                          boxShadow: isSelected ? `0 0 0 2px ${isDark ? 'rgba(56,189,248,0.25)' : 'rgba(2,132,199,0.25)'}` : 'none',
                          borderRadius: '50%',
                          transition: 'transform 0.15s ease',
                          transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                        }}
                      >
                        <Box
                          sx={{
                            width: 17,
                            height: 17,
                            borderRadius: '50%',
                            backgroundColor: colorItem.hex,
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}`,
                          }}
                        />
                      </IconButton>
                    </Tooltip>
                  );
                })}
              </Box>
            )}

            {activeTool !== 'eraser' && (
              <Divider orientation="vertical" flexItem sx={{ my: 0.5, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }} />
            )}

            {/* Stroke / Eraser Width Selector OR Quick Paste Post-it Button */}
            {activeTool === 'stickyNote' ? (
              <Tooltip title="Colar novo Post-it na página de comentários (ou toque direto na página)">
                <Chip
                  icon={<AddIcon sx={{ color: `${accentColor} !important`, fontSize: 16 }} />}
                  label="Colar Post-it"
                  onClick={onQuickAddStickyNote}
                  size="small"
                  sx={{
                    fontFamily: monoFontFamily,
                    backgroundColor: accentBg,
                    color: accentColor,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    border: `1px solid ${isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.25)'}`,
                    height: 26,
                    '&:hover': {
                      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(2, 132, 199, 0.14)',
                    },
                  }}
                />
              </Tooltip>
            ) : (
              <Box display="flex" alignItems="center" gap={0.35}>
                <Tooltip title={activeTool === 'eraser' ? 'Borracha Fina' : 'Traço Fino'}>
                  <IconButton
                    size="small"
                    onClick={() => onWidthChange(widths.fine)}
                    sx={{
                      p: 0.6,
                      backgroundColor: activeWidth === widths.fine ? accentBg : 'transparent',
                      color: activeWidth === widths.fine ? accentColor : isDark ? '#94A3B8' : '#64748B',
                    }}
                  >
                    <Box
                      sx={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        backgroundColor: 'currentColor',
                      }}
                    />
                  </IconButton>
                </Tooltip>

                <Tooltip title={activeTool === 'eraser' ? 'Borracha Média' : 'Traço Médio'}>
                  <IconButton
                    size="small"
                    onClick={() => onWidthChange(widths.medium)}
                    sx={{
                      p: 0.6,
                      backgroundColor: activeWidth === widths.medium ? accentBg : 'transparent',
                      color: activeWidth === widths.medium ? accentColor : isDark ? '#94A3B8' : '#64748B',
                    }}
                  >
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: 'currentColor',
                      }}
                    />
                  </IconButton>
                </Tooltip>

                <Tooltip title={activeTool === 'eraser' ? 'Borracha Grossa' : 'Traço Grosso'}>
                  <IconButton
                    size="small"
                    onClick={() => onWidthChange(widths.thick)}
                    sx={{
                      p: 0.6,
                      backgroundColor: activeWidth === widths.thick ? accentBg : 'transparent',
                      color: activeWidth === widths.thick ? accentColor : isDark ? '#94A3B8' : '#64748B',
                    }}
                  >
                    <Box
                      sx={{
                        width: 15,
                        height: 15,
                        borderRadius: '50%',
                        backgroundColor: 'currentColor',
                      }}
                    />
                  </IconButton>
                </Tooltip>
              </Box>
            )}

            <Divider orientation="vertical" flexItem sx={{ my: 0.5, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }} />

            {/* Palm Rejection Mode */}
            <Tooltip title={pencilOnly ? "Palma Rejeitada: Apenas a Apple Pencil desenha" : "Toque com Dedo: Desenhar com o dedo ou Pencil"}>
              <Chip
                icon={pencilOnly ? <GestureIcon sx={{ color: isDark ? '#4ADE80 !important' : '#16A34A !important', fontSize: 16 }} /> : <TouchAppIcon sx={{ color: isDark ? '#94A3B8 !important' : '#64748B !important', fontSize: 16 }} />}
                label={pencilOnly ? "Apple Pencil" : "Dedo"}
                onClick={onTogglePencilOnly}
                size="small"
                sx={{
                  fontFamily: monoFontFamily,
                  backgroundColor: pencilOnly
                    ? isDark ? 'rgba(74, 222, 128, 0.1)' : 'rgba(22, 163, 74, 0.08)'
                    : isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                  color: pencilOnly
                    ? isDark ? '#4ADE80' : '#16A34A'
                    : isDark ? '#94A3B8' : '#475569',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  border: pencilOnly
                    ? `1px solid ${isDark ? 'rgba(74, 222, 128, 0.25)' : 'rgba(22, 163, 74, 0.2)'}`
                    : `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
                  height: 26,
                }}
              />
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ my: 0.5, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }} />

            {/* Actions: Undo, Redo, Clear */}
            <Box display="flex" alignItems="center" gap={0.25}>
              <Tooltip title="Desfazer">
                <span>
                  <IconButton
                    size="small"
                    onClick={onUndo}
                    disabled={!canUndo}
                    sx={{ color: isDark ? '#94A3B8' : '#64748B', '&:hover': { color: isDark ? '#F8FAFC' : '#0F172A' } }}
                  >
                    <UndoIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="Refazer">
                <span>
                  <IconButton
                    size="small"
                    onClick={onRedo}
                    disabled={!canRedo}
                    sx={{ color: isDark ? '#94A3B8' : '#64748B', '&:hover': { color: isDark ? '#F8FAFC' : '#0F172A' } }}
                  >
                    <RedoIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="Limpar página">
                <IconButton
                  size="small"
                  onClick={onClear}
                  sx={{ color: isDark ? '#64748B' : '#94A3B8', '&:hover': { color: '#EF4444' } }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </Tooltip>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ my: 0.5, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }} />

            {/* Minimize / Collapse Button */}
            <Tooltip title="Recolher barra para desenhar no rodapé">
              <IconButton
                size="small"
                onClick={() => setIsCollapsed(true)}
                sx={{
                  color: isDark ? '#94A3B8' : '#64748B',
                  p: 0.4,
                  '&:hover': { color: isDark ? '#F8FAFC' : '#0F172A', backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9' },
                }}
              >
                <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Paper>
        </Collapse>
      )}
    </Box>
  );
};
