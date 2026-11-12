import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CheckIcon from '@mui/icons-material/Check';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { StickyNote } from '../../domain/pericope';
import { ActiveTool } from '../../domain/stroke';
import { stickyNoteColors } from '../../drawing/colorPalette';
import { monoFontFamily, sansFontFamily } from '../../theme/theme';

export const STICKY_NOTE_WIDTH = 224;
export const MAX_STICKY_NOTE_CHARS = 280;
const PAGE_CANONICAL_WIDTH = 480;

const POST_IT_PALETTE = [
  { label: 'Amarelo', hex: stickyNoteColors.yellow },
  { label: 'Rosa', hex: stickyNoteColors.pink },
  { label: 'Menta', hex: stickyNoteColors.mint },
  { label: 'Azul Céu', hex: stickyNoteColors.sky },
  { label: 'Pêssego', hex: stickyNoteColors.amber },
];

interface StickyNoteLayerProps {
  stickyNotes: StickyNote[];
  activeTool: ActiveTool;
  activeColor: string;
  editingNoteId: string | null;
  onSetEditingNoteId: (noteId: string | null) => void;
  onCreateNoteAt: (positionX: number, positionY: number) => void;
  onUpdateNote: (updatedNote: StickyNote) => void;
  onDeleteNote: (noteId: string) => void;
}

export const StickyNoteLayer: React.FC<StickyNoteLayerProps> = ({
  stickyNotes,
  activeTool,
  editingNoteId,
  onSetEditingNoteId,
  onCreateNoteAt,
  onUpdateNote,
  onDeleteNote,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [draftText, setDraftText] = useState<string>('');
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    noteX: number;
    noteY: number;
    scaleX: number;
    scaleY: number;
  } | null>(null);

  const editingNote = stickyNotes.find((n) => n.noteId === editingNoteId) || null;

  useEffect(() => {
    if (editingNote) {
      setDraftText(editingNote.text);
    } else {
      setDraftText('');
    }
  }, [editingNoteId, editingNote?.noteId]);

  const getScaleFactors = () => {
    const el = containerRef.current;
    if (!el) return { scaleX: 1, scaleY: 1, rect: null };
    const rect = el.getBoundingClientRect();
    const logicalW = el.offsetWidth || PAGE_CANONICAL_WIDTH;
    const logicalH = el.offsetHeight || rect.height;
    const scaleX = logicalW > 0 ? rect.width / logicalW : 1;
    const scaleY = logicalH > 0 ? rect.height / logicalH : scaleX;
    return { scaleX: scaleX || 1, scaleY: scaleY || 1, rect };
  };

  const commitEditingNote = (note: StickyNote, textToSave: string) => {
    const trimmed = textToSave.trim();
    if (!trimmed) {
      onDeleteNote(note.noteId);
      onSetEditingNoteId(null);
      return;
    }
    onUpdateNote({
      ...note,
      text: trimmed.slice(0, MAX_STICKY_NOTE_CHARS),
      updatedAt: new Date().toISOString(),
    });
    onSetEditingNoteId(null);
  };

  const handleLayerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target !== containerRef.current) return;

    if (editingNote) {
      commitEditingNote(editingNote, draftText);
      return;
    }

    if (activeTool !== 'stickyNote') return;

    e.stopPropagation();
    const { scaleX, scaleY, rect } = getScaleFactors();
    if (!rect) return;

    const rawX = (e.clientX - rect.left) / scaleX;
    const rawY = (e.clientY - rect.top) / scaleY;

    const clampedX = Math.round(
      Math.max(12, Math.min(PAGE_CANONICAL_WIDTH - STICKY_NOTE_WIDTH - 12, rawX - STICKY_NOTE_WIDTH / 2))
    );
    const clampedY = Math.round(Math.max(12, rawY - 24));

    onCreateNoteAt(clampedX, clampedY);
  };

  const handleStartDrag = (e: React.PointerEvent, note: StickyNote) => {
    if (editingNoteId === note.noteId) return;
    e.stopPropagation();
    e.preventDefault();

    const { scaleX, scaleY } = getScaleFactors();
    setDraggingNoteId(note.noteId);
    setDragPosition({ x: note.positionX, y: note.positionY });
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      noteX: note.positionX,
      noteY: note.positionY,
      scaleX,
      scaleY,
    };

    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handleDragMove = (e: React.PointerEvent, note: StickyNote) => {
    if (draggingNoteId !== note.noteId || !dragStartRef.current) return;
    e.stopPropagation();
    e.preventDefault();

    const { pointerX, pointerY, noteX, noteY, scaleX, scaleY } = dragStartRef.current;
    const deltaX = (e.clientX - pointerX) / scaleX;
    const deltaY = (e.clientY - pointerY) / scaleY;

    const nextX = Math.round(
      Math.max(8, Math.min(PAGE_CANONICAL_WIDTH - STICKY_NOTE_WIDTH - 8, noteX + deltaX))
    );
    const nextY = Math.round(Math.max(8, noteY + deltaY));
    setDragPosition({ x: nextX, y: nextY });
  };

  const handleEndDrag = (e: React.PointerEvent, note: StickyNote) => {
    if (draggingNoteId !== note.noteId) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);

    const finalPos = dragPosition;
    setDraggingNoteId(null);
    setDragPosition(null);
    dragStartRef.current = null;

    if (finalPos && (finalPos.x !== note.positionX || finalPos.y !== note.positionY)) {
      onUpdateNote({
        ...note,
        positionX: finalPos.x,
        positionY: finalPos.y,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  return (
    <Box
      ref={containerRef}
      onPointerDown={handleLayerPointerDown}
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: activeTool === 'stickyNote' ? 25 : 15,
        pointerEvents: activeTool === 'stickyNote' ? 'auto' : 'none',
        cursor: activeTool === 'stickyNote' ? 'copy' : 'default',
      }}
    >
      {stickyNotes.map((note) => {
        const isEditing = editingNoteId === note.noteId;
        const isDragging = draggingNoteId === note.noteId;
        const posX = isDragging && dragPosition ? dragPosition.x : note.positionX;
        const posY = isDragging && dragPosition ? dragPosition.y : note.positionY;

        return (
          <Box
            key={note.noteId}
            data-testid={`sticky-note-${note.noteId}`}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (activeTool === 'eraser') {
                onDeleteNote(note.noteId);
              }
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            sx={{
              position: 'absolute',
              left: `${posX}px`,
              top: `${posY}px`,
              width: `${STICKY_NOTE_WIDTH}px`,
              minHeight: '118px',
              backgroundColor: note.color || stickyNoteColors.yellow,
              color: '#1E293B',
              borderRadius: '4px 4px 14px 4px',
              boxShadow: isDragging
                ? '0 16px 32px rgba(15, 23, 42, 0.38), 0 4px 10px rgba(15, 23, 42, 0.22)'
                : isEditing
                  ? '0 12px 28px rgba(15, 23, 42, 0.32), 0 0 0 2px #0284C7'
                  : '0 6px 16px rgba(15, 23, 42, 0.20), 0 1px 3px rgba(15, 23, 42, 0.12)',
              border: '1px solid rgba(15, 23, 42, 0.10)',
              display: 'flex',
              flexDirection: 'column',
              pointerEvents: 'auto',
              userSelect: isEditing ? 'text' : 'none',
              WebkitUserSelect: isEditing ? 'text' : 'none',
              touchAction: 'none',
              zIndex: isEditing || isDragging ? 40 : 20,
              transform: isDragging ? 'scale(1.03) rotate(-0.5deg)' : 'none',
              transition: isDragging ? 'none' : 'box-shadow 0.15s ease, transform 0.15s ease',
              overflow: 'hidden',
            }}
          >
            {/* Top adhesive strip header (drag handle + actions) */}
            <Box
              onPointerDown={(e) => handleStartDrag(e, note)}
              onPointerMove={(e) => handleDragMove(e, note)}
              onPointerUp={(e) => handleEndDrag(e, note)}
              onPointerCancel={(e) => handleEndDrag(e, note)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 0.75,
                py: 0.4,
                backgroundColor: 'rgba(15, 23, 42, 0.06)',
                borderBottom: '1px solid rgba(15, 23, 42, 0.07)',
                cursor: isEditing ? 'default' : 'grab',
                '&:active': {
                  cursor: isEditing ? 'default' : 'grabbing',
                },
              }}
            >
              <Box display="flex" alignItems="center" gap={0.35}>
                <DragIndicatorIcon sx={{ fontSize: 15, color: 'rgba(15, 23, 42, 0.45)' }} />
                <Typography
                  sx={{
                    fontFamily: monoFontFamily,
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'rgba(15, 23, 42, 0.55)',
                  }}
                >
                  Post-it
                </Typography>
              </Box>

              <Box
                display="flex"
                alignItems="center"
                gap={0.25}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {isEditing ? (
                  <Tooltip title="Concluir edição">
                    <IconButton
                      size="small"
                      aria-label="Salvar Post-it"
                      onClick={() => commitEditingNote(note, draftText)}
                      sx={{
                        p: 0.3,
                        color: '#0F766E',
                        backgroundColor: 'rgba(15, 118, 110, 0.12)',
                        '&:hover': { backgroundColor: 'rgba(15, 118, 110, 0.22)' },
                      }}
                    >
                      <CheckIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="Editar texto">
                    <IconButton
                      size="small"
                      aria-label="Editar Post-it"
                      onClick={() => {
                        setDraftText(note.text);
                        onSetEditingNoteId(note.noteId);
                      }}
                      sx={{
                        p: 0.3,
                        color: 'rgba(15, 23, 42, 0.65)',
                        '&:hover': { color: '#0F172A', backgroundColor: 'rgba(15, 23, 42, 0.08)' },
                      }}
                    >
                      <EditOutlinedIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                )}

                <Tooltip title="Excluir Post-it">
                  <IconButton
                    size="small"
                    aria-label="Excluir Post-it"
                    onClick={() => {
                      if (isEditing) onSetEditingNoteId(null);
                      onDeleteNote(note.noteId);
                    }}
                    sx={{
                      p: 0.3,
                      color: 'rgba(15, 23, 42, 0.6)',
                      '&:hover': { color: '#DC2626', backgroundColor: 'rgba(220, 38, 38, 0.12)' },
                    }}
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Body: Editable Tweet Textarea or Static Note Content */}
            <Box sx={{ p: 1.1, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              {isEditing ? (
                <>
                  <Box
                    component="textarea"
                    autoFocus
                    value={draftText}
                    maxLength={MAX_STICKY_NOTE_CHARS}
                    placeholder="Escreva sua nota (máx. 280 caracteres)..."
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setDraftText(e.target.value.slice(0, MAX_STICKY_NOTE_CHARS))
                    }
                    onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                      if (e.key === 'Escape') {
                        commitEditingNote(note, draftText);
                      }
                      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                        commitEditingNote(note, draftText);
                      }
                    }}
                    sx={{
                      width: '100%',
                      minHeight: '78px',
                      border: 'none',
                      outline: 'none',
                      resize: 'none',
                      backgroundColor: 'transparent',
                      fontFamily: sansFontFamily,
                      fontSize: '0.84rem',
                      lineHeight: 1.45,
                      color: '#0F172A',
                      p: 0,
                      m: 0,
                      '&::placeholder': {
                        color: 'rgba(15, 23, 42, 0.42)',
                      },
                    }}
                  />

                  {/* Footer inside edit mode: Color swatches + Character Counter */}
                  <Box
                    sx={{
                      mt: 0.75,
                      pt: 0.6,
                      borderTop: '1px dashed rgba(15, 23, 42, 0.14)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={0.5}>
                      {POST_IT_PALETTE.map((swatch) => {
                        const selected =
                          (note.color || stickyNoteColors.yellow).toLowerCase() ===
                          swatch.hex.toLowerCase();
                        return (
                          <Box
                            key={swatch.hex}
                            component="button"
                            type="button"
                            aria-label={`Cor ${swatch.label}`}
                            onClick={() =>
                              onUpdateNote({
                                ...note,
                                text: draftText,
                                color: swatch.hex,
                                updatedAt: new Date().toISOString(),
                              })
                            }
                            sx={{
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              backgroundColor: swatch.hex,
                              border: selected
                                ? '2px solid #0F172A'
                                : '1px solid rgba(15, 23, 42, 0.25)',
                              p: 0,
                              cursor: 'pointer',
                              transform: selected ? 'scale(1.15)' : 'scale(1)',
                            }}
                          />
                        );
                      })}
                    </Box>

                    <Typography
                      sx={{
                        fontFamily: monoFontFamily,
                        fontSize: '0.64rem',
                        fontWeight: 600,
                        color:
                          draftText.length >= MAX_STICKY_NOTE_CHARS
                            ? '#DC2626'
                            : 'rgba(15, 23, 42, 0.55)',
                      }}
                    >
                      {draftText.length}/{MAX_STICKY_NOTE_CHARS}
                    </Typography>
                  </Box>
                </>
              ) : (
                <Typography
                  onDoubleClick={() => {
                    setDraftText(note.text);
                    onSetEditingNoteId(note.noteId);
                  }}
                  onClick={() => {
                    if (activeTool === 'stickyNote') {
                      setDraftText(note.text);
                      onSetEditingNoteId(note.noteId);
                    }
                  }}
                  sx={{
                    fontFamily: sansFontFamily,
                    fontSize: '0.84rem',
                    lineHeight: 1.45,
                    color: '#0F172A',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    cursor: activeTool === 'stickyNote' ? 'text' : 'default',
                  }}
                >
                  {note.text}
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
