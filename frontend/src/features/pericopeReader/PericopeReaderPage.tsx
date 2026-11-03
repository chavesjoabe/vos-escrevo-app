import React, { useState, useEffect, useCallback, startTransition, useRef, useMemo } from 'react';
import { Box, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Book } from '../../domain/book';
import { Pericope, PericopeSummary } from '../../domain/pericope';
import { Stroke, ToolType } from '../../domain/stroke';
import { bookApi } from '../../api/bookApi';
import { pericopeApi } from '../../api/pericopeApi';
import { recentBooksStorage } from '../../api/recentBooksStorage';
import { pencilColors, darkPencilColors, defaultPencilWidth, defaultMarkerWidth, markerColors } from '../../drawing/colorPalette';
import { PericopeNavigation } from './PericopeNavigation';
import { PericopeTextPanel, PericopeHeader } from './PericopeTextPanel';
import { CommentPagePanel, CommentPageHeader } from './CommentPagePanel';
import { DrawingToolbar } from './DrawingToolbar';
import { useThemeMode } from '../../theme/ThemeContext';

interface PericopeReaderPageProps {
  bookId: string;
  initialPericopeId?: string;
  onBackToBooks: () => void;
}

interface UndoHistoryState {
  commentStrokes: Stroke[];
  highlightStrokes: Stroke[];
}

export const PericopeReaderPage: React.FC<PericopeReaderPageProps> = ({
  bookId,
  initialPericopeId,
  onBackToBooks,
}) => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [pericopes, setPericopes] = useState<PericopeSummary[]>([]);
  const [currentPericope, setCurrentPericope] = useState<Pericope | null>(null);
  const [loading, setLoading] = useState(true);

  // Drawing tool state
  const [activeTool, setActiveTool] = useState<ToolType | 'eraser'>('pencil');
  const [activeColor, setActiveColor] = useState<string>(isDark ? darkPencilColors.chalk : pencilColors.graphite);
  const [activeWidth, setActiveWidth] = useState<number>(defaultPencilWidth);
  const [pencilOnly, setPencilOnly] = useState<boolean>(true); // Palm Rejection enabled by default

  // Update default pencil color when theme switches between Dark & Light
  useEffect(() => {
    if (activeTool === 'pencil') {
      if (isDark && (activeColor === pencilColors.graphite || activeColor === '#1C1917' || activeColor === '#1A1A1A' || activeColor === '#0F172A')) {
        setActiveColor(darkPencilColors.chalk);
      } else if (!isDark && (activeColor === darkPencilColors.chalk || activeColor === '#F8FAFC')) {
        setActiveColor(pencilColors.graphite);
      }
    }
  }, [isDark, activeTool, activeColor]);

  // Stroke data state (Left panel text strokes vs Right panel comment strokes)
  const [commentStrokes, setCommentStrokes] = useState<Stroke[]>([]);
  const [highlightStrokes, setHighlightStrokes] = useState<Stroke[]>([]);
  const [commentDate, setCommentDate] = useState<string>('');

  // Save state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Undo / Redo history stacks
  const [undoStack, setUndoStack] = useState<UndoHistoryState[]>([]);
  const [redoStack, setRedoStack] = useState<UndoHistoryState[]>([]);

  // Unified scroll container ref
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Load Book and Chapters (Pericopes)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [book, list] = await Promise.all([
          bookApi.getBookById(bookId),
          pericopeApi.getPericopesByBookId(bookId),
        ]);

        if (book && list.length > 0) {
          setCurrentBook(book);
          setPericopes(list);

          const targetSummary = initialPericopeId
            ? list.find((p) => p.id === initialPericopeId) || list[0]
            : list[0];

          const fullPericope = await pericopeApi.getPericopeById(targetSummary.id);
          if (fullPericope) {
            loadPericopeState(fullPericope);
          }
        }
      } catch (error) {
        console.error('Failed to load pericope reader data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookId, initialPericopeId]);

  const loadPericopeState = (pericope: Pericope) => {
    recentBooksStorage.recordBookAccess(bookId, pericope.id, pericope.title);
    setCurrentPericope(pericope);
    setCommentStrokes(pericope.commentPage.strokes || []);
    setHighlightStrokes(pericope.highlightStrokes || []);
    setCommentDate(pericope.commentPage.date || new Date().toISOString().split('T')[0]);
    setUndoStack([]);
    setRedoStack([]);
    setHasUnsavedChanges(false);
    setLastSavedTime(null);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  // Push state to undo stack before mutation
  const pushUndoState = useCallback((cStrokes: Stroke[], hStrokes: Stroke[]) => {
    setUndoStack((prev) => [...prev, { commentStrokes: cStrokes, highlightStrokes: hStrokes }]);
    setRedoStack([]);
  }, []);

  // Explicit Save Action
  const handleSave = useCallback(
    async (showToast = true) => {
      if (!currentPericope) return;

      setIsSaving(true);
      try {
        await pericopeApi.savePericopeStrokes(
          currentPericope.id,
          commentStrokes,
          highlightStrokes,
          commentDate
        );
        setHasUnsavedChanges(false);
        const now = new Date();
        const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastSavedTime(formattedTime);

        if (showToast) {
          setToastMessage('Anotações salvas com sucesso! ✓');
        }
      } catch (error) {
        console.error('Save failed', error);
        setToastMessage('Erro ao salvar anotações');
      } finally {
        setIsSaving(false);
      }
    },
    [currentPericope, commentStrokes, highlightStrokes, commentDate]
  );

  // Auto-save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasUnsavedChanges && currentPericope) {
        pericopeApi.savePericopeStrokes(
          currentPericope.id,
          commentStrokes,
          highlightStrokes,
          commentDate
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, currentPericope, commentStrokes, highlightStrokes, commentDate]);

  // Multi-touch 2-finger scroll gesture tracker
  useEffect(() => {
    if (loading) return;
    const el = scrollContainerRef.current;
    if (!el) return;

    let lastAvgY: number | null = null;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        lastAvgY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      } else {
        lastAvgY = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        const currentAvgY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        if (lastAvgY !== null) {
          const deltaY = lastAvgY - currentAvgY;
          el.scrollTop += deltaY;
        }
        lastAvgY = currentAvgY;
        if (e.cancelable) {
          e.preventDefault();
        }
      } else {
        lastAvgY = null;
        if (e.touches.length === 1 && e.cancelable) {
          // Strictly prevent single finger from scrolling the page to protect palm resting
          e.preventDefault();
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        lastAvgY = null;
      } else {
        lastAvgY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    el.addEventListener('touchcancel', onTouchEnd, { passive: false });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [loading, currentPericope?.id]);

  const handleToolChange = (tool: ToolType | 'eraser') => {
    setActiveTool(tool);
    if (tool === 'pencil') {
      setActiveColor(isDark ? darkPencilColors.chalk : pencilColors.graphite);
      setActiveWidth(defaultPencilWidth);
    } else if (tool === 'marker') {
      setActiveColor(markerColors.yellow);
      setActiveWidth(defaultMarkerWidth);
    }
  };

  // Left Panel Stroke Completion (Bible Text Area) - wrapped in non-blocking startTransition
  const handleTextStrokeComplete = useCallback((newStroke: Stroke) => {
    startTransition(() => {
      pushUndoState(commentStrokes, highlightStrokes);
      setHighlightStrokes((prev) => [...prev, newStroke]);
      setHasUnsavedChanges(true);
    });
  }, [commentStrokes, highlightStrokes, pushUndoState]);

  // Right Panel Stroke Completion (Comment Page Area) - wrapped in non-blocking startTransition
  const handleCommentStrokeComplete = useCallback((newStroke: Stroke) => {
    startTransition(() => {
      pushUndoState(commentStrokes, highlightStrokes);
      setCommentStrokes((prev) => [...prev, newStroke]);
      setHasUnsavedChanges(true);
    });
  }, [commentStrokes, highlightStrokes, pushUndoState]);

  const handleEraseTextStrokes = useCallback((strokeIds: string[]) => {
    if (strokeIds.length === 0) return;
    const idSet = new Set(strokeIds);
    startTransition(() => {
      pushUndoState(commentStrokes, highlightStrokes);
      setHighlightStrokes((prev) => prev.filter((s) => !idSet.has(s.strokeId)));
      setHasUnsavedChanges(true);
    });
  }, [commentStrokes, highlightStrokes, pushUndoState]);

  const handleEraseCommentStrokes = useCallback((strokeIds: string[]) => {
    if (strokeIds.length === 0) return;
    const idSet = new Set(strokeIds);
    startTransition(() => {
      pushUndoState(commentStrokes, highlightStrokes);
      setCommentStrokes((prev) => prev.filter((s) => !idSet.has(s.strokeId)));
      setHasUnsavedChanges(true);
    });
  }, [commentStrokes, highlightStrokes, pushUndoState]);

  const handleDateChange = (newDate: string) => {
    setCommentDate(newDate);
    setHasUnsavedChanges(true);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const previousState = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);

    setRedoStack((prev) => [
      ...prev,
      { commentStrokes, highlightStrokes },
    ]);

    setUndoStack(newUndoStack);
    setCommentStrokes(previousState.commentStrokes);
    setHighlightStrokes(previousState.highlightStrokes);
    setHasUnsavedChanges(true);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const nextState = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    setUndoStack((prev) => [
      ...prev,
      { commentStrokes, highlightStrokes },
    ]);

    setRedoStack(newRedoStack);
    setCommentStrokes(nextState.commentStrokes);
    setHighlightStrokes(nextState.highlightStrokes);
    setHasUnsavedChanges(true);
  };

  const handleClearPage = () => {
    if (window.confirm('Tem certeza que deseja apagar todas as anotações desta página?')) {
      pushUndoState(commentStrokes, highlightStrokes);
      setCommentStrokes([]);
      setHighlightStrokes([]);
      setHasUnsavedChanges(true);
    }
  };

  const handleSelectPericope = async (pericopeId: string) => {
    if (hasUnsavedChanges) {
      await handleSave(false);
    }
    try {
      const fullPericope = await pericopeApi.getPericopeById(pericopeId);
      if (fullPericope) {
        loadPericopeState(fullPericope);
      }
    } catch (error) {
      console.error('Failed to load selected chapter', error);
    }
  };

  const handleBackToBooksClick = async () => {
    if (hasUnsavedChanges) {
      await handleSave(false);
    }
    onBackToBooks();
  };

  // Compute maximum stroke vertical reach to safeguard scroll boundaries
  const maxStrokeY = useMemo(() => {
    let maxY = 0;
    for (let i = 0; i < commentStrokes.length; i++) {
      const pts = commentStrokes[i].points;
      for (let j = 0; j < pts.length; j++) {
        if (pts[j].positionY > maxY) maxY = pts[j].positionY;
      }
    }
    for (let i = 0; i < highlightStrokes.length; i++) {
      const pts = highlightStrokes[i].points;
      for (let j = 0; j < pts.length; j++) {
        if (pts[j].positionY > maxY) maxY = pts[j].positionY;
      }
    }
    return maxY;
  }, [commentStrokes, highlightStrokes]);

  if (loading || !currentBook || !currentPericope) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: isDark ? '#0B0F17' : '#F8FAFC',
        transition: 'background-color 0.25s ease',
      }}
    >
      {/* Top Navigation Bar with Save button */}
      <PericopeNavigation
        currentBook={currentBook}
        pericopes={pericopes}
        currentPericope={currentPericope}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        lastSavedTime={lastSavedTime}
        onSave={() => handleSave(true)}
        onSelectPericope={handleSelectPericope}
        onBackToBooks={handleBackToBooksClick}
      />

      {/* Pinned Dual-Page Header Bar */}
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          flexShrink: 0,
          borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
          backgroundColor: isDark ? '#0E131F' : '#FFFFFF',
          zIndex: 20,
        }}
      >
        {/* Left Page Header: Bible Passage Title & Reference */}
        <Box sx={{
          width: '50%',
          borderRight: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
          boxShadow: isDark ? 'inset -6px 0 16px -6px rgba(0, 0, 0, 0.6)' : 'inset -6px 0 16px -6px rgba(0, 0, 0, 0.03)',
        }}>
          <PericopeHeader pericope={currentPericope} />
        </Box>

        {/* Right Page Header: Date & Page Subtitle */}
        <Box sx={{
          width: '50%',
          boxShadow: isDark ? 'inset 6px 0 16px -6px rgba(0, 0, 0, 0.6)' : 'inset 6px 0 16px -6px rgba(0, 0, 0, 0.03)',
        }}>
          <CommentPageHeader date={commentDate} onDateChange={handleDateChange} />
        </Box>
      </Box>

      {/* Unified Synchronized Scroll View (Bible Text Panel + Comment Draw Area) */}
      <Box
        ref={scrollContainerRef}
        sx={{
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: 0,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none',
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
        <Box
          sx={{
            display: 'flex',
            minHeight: maxStrokeY > 0 ? `max(100%, ${maxStrokeY + 250}px)` : '100%',
            position: 'relative',
            alignItems: 'stretch',
          }}
        >
          {/* Left Column: Bible Text Panel */}
          <Box
            sx={{
              width: '50%',
              minHeight: '100%',
              borderRight: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
              boxShadow: isDark ? 'inset -6px 0 20px -6px rgba(0, 0, 0, 0.7)' : 'inset -6px 0 16px -6px rgba(0, 0, 0, 0.04)',
              position: 'relative',
              backgroundColor: isDark ? '#0B0F17' : '#FFFFFF',
            }}
          >
            <PericopeTextPanel
              pericope={currentPericope}
              highlightStrokes={highlightStrokes}
              activeTool={activeTool}
              activeColor={activeColor}
              activeWidth={activeWidth}
              pencilOnly={pencilOnly}
              onStrokeComplete={handleTextStrokeComplete}
              onEraseStrokes={handleEraseTextStrokes}
            />
          </Box>

          {/* Right Column: Comment Page Panel (Draw Area) */}
          <Box
            sx={{
              width: '50%',
              minHeight: '100%',
              boxShadow: isDark ? 'inset 6px 0 20px -6px rgba(0, 0, 0, 0.7)' : 'inset 6px 0 16px -6px rgba(0, 0, 0, 0.04)',
              position: 'relative',
              backgroundColor: isDark ? '#0B0F17' : '#FAF9F6',
            }}
          >
            <CommentPagePanel
              date={commentDate}
              strokes={commentStrokes}
              activeTool={activeTool}
              activeColor={activeColor}
              activeWidth={activeWidth}
              pencilOnly={pencilOnly}
              onDateChange={handleDateChange}
              onStrokeComplete={handleCommentStrokeComplete}
              onEraseStrokes={handleEraseCommentStrokes}
            />
          </Box>
        </Box>
      </Box>

      {/* Floating Drawing Toolbar - FIXED at bottom center of screen */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 'max(16px, env(safe-area-inset-bottom))',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          pointerEvents: 'auto',
        }}
      >
        <DrawingToolbar
          activeTool={activeTool}
          activeColor={activeColor}
          activeWidth={activeWidth}
          pencilOnly={pencilOnly}
          onToolChange={handleToolChange}
          onColorChange={setActiveColor}
          onWidthChange={setActiveWidth}
          onTogglePencilOnly={() => setPencilOnly(!pencilOnly)}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClearPage}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
        />
      </Box>

      {/* Manual Save Confirmation Toast */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={2500}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: 90 }}
      >
        <Alert severity="success" variant="filled" sx={{ width: '100%', fontWeight: 600 }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};
