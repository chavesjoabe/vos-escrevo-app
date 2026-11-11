import React, { useState, useEffect, useLayoutEffect, useCallback, startTransition, useRef, useMemo } from 'react';
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

/**
 * Canonical spread coordinate geometry:
 * - Each page has a fixed canonical width of 480px (960px total spread).
 * - Line breaks and stroke coordinates (positionX, positionY) are 100% invariant
 *   across Landscape and Portrait orientations.
 * - In Landscape (> 960px), the spread upscales proportionally.
 * - In Portrait (< 960px), the spread reduces zoom proportionally while enforcing
 *   MIN_SPREAD_SCALE (0.78) so the 20px canonical Scripture font never drops below ~15.6px.
 */
export const CANONICAL_PAGE_WIDTH = 480;
export const CANONICAL_SPREAD_WIDTH = CANONICAL_PAGE_WIDTH * 2; // 960px
export const MIN_SPREAD_SCALE = 0.78;
export const MAX_AUTO_SPREAD_SCALE = 1.45;
export const MAX_MANUAL_SPREAD_SCALE = 1.60;
const ZOOM_STEP = 0.05;

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

  // Unified scroll container ref & canonical spread content ref
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const spreadContentRef = useRef<HTMLDivElement | null>(null);

  // Viewport & canonical spread sizing state for orientation-locked proportional zoom
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : CANONICAL_SPREAD_WIDTH,
    height: typeof window !== 'undefined' ? Math.max(400, window.innerHeight - 104) : 700,
  }));
  const [canonicalHeight, setCanonicalHeight] = useState<number>(800);
  const [manualScale, setManualScale] = useState<number | null>(null);

  // Compute automatic orientation scale (upscales in landscape, reduces zoom in portrait with 0.78 floor)
  const autoScale = useMemo(() => {
    const rawScale = viewportSize.width / CANONICAL_SPREAD_WIDTH;
    const clamped = Math.min(MAX_AUTO_SPREAD_SCALE, Math.max(MIN_SPREAD_SCALE, rawScale));
    return Math.round(clamped * 1000) / 1000;
  }, [viewportSize.width]);

  const effectiveScale = manualScale !== null ? manualScale : autoScale;
  const prevScaleRef = useRef<number>(effectiveScale);

  const handleZoomOut = useCallback(() => {
    setManualScale((prev) => {
      const base = prev !== null ? prev : autoScale;
      const next = Math.max(MIN_SPREAD_SCALE, Math.round((base - ZOOM_STEP) * 100) / 100);
      return next;
    });
  }, [autoScale]);

  const handleZoomIn = useCallback(() => {
    setManualScale((prev) => {
      const base = prev !== null ? prev : autoScale;
      const next = Math.min(MAX_MANUAL_SPREAD_SCALE, Math.round((base + ZOOM_STEP) * 100) / 100);
      return next;
    });
  }, [autoScale]);

  const handleResetZoom = useCallback(() => {
    setManualScale(null);
  }, []);

  // Measure scroll container viewport across window resizes and iPad orientation changes
  useLayoutEffect(() => {
    const updateViewport = () => {
      const el = scrollContainerRef.current;
      if (el && el.clientWidth > 0 && el.clientHeight > 0) {
        setViewportSize((prev) =>
          prev.width === el.clientWidth && prev.height === el.clientHeight
            ? prev
            : { width: el.clientWidth, height: el.clientHeight }
        );
      } else if (typeof window !== 'undefined') {
        const fallbackWidth = window.innerWidth;
        const fallbackHeight = Math.max(320, window.innerHeight - 104);
        setViewportSize((prev) =>
          prev.width === fallbackWidth && prev.height === fallbackHeight
            ? prev
            : { width: fallbackWidth, height: fallbackHeight }
        );
      }
    };

    updateViewport();

    const el = scrollContainerRef.current;
    let observer: ResizeObserver | null = null;
    if (el && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => updateViewport());
      observer.observe(el);
    }

    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, [loading, currentPericope?.id]);

  // Measure unscaled canonical height of the two-page spread
  useLayoutEffect(() => {
    const spreadEl = spreadContentRef.current;
    if (!spreadEl) return;

    const updateHeight = () => {
      const measured = spreadEl.offsetHeight || spreadEl.scrollHeight;
      if (measured > 0) {
        setCanonicalHeight((prev) => (prev === measured ? prev : measured));
      }
    };

    updateHeight();

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => updateHeight());
      observer.observe(spreadEl);
    }

    return () => {
      observer?.disconnect();
    };
  }, [loading, currentPericope?.id]);

  // Preserve relative verse scroll offset when switching between Landscape and Portrait or zooming
  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (el && prevScaleRef.current !== effectiveScale && prevScaleRef.current > 0) {
      const ratio = effectiveScale / prevScaleRef.current;
      el.scrollTop = Math.round(el.scrollTop * ratio);
      el.scrollLeft = Math.round(el.scrollLeft * ratio);
    }
    prevScaleRef.current = effectiveScale;
  }, [effectiveScale]);

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
      scrollContainerRef.current.scrollLeft = 0;
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

  // Multi-touch 2-finger scroll gesture tracker (supports both vertical and horizontal pan)
  useEffect(() => {
    if (loading) return;
    const el = scrollContainerRef.current;
    if (!el) return;

    let lastAvgX: number | null = null;
    let lastAvgY: number | null = null;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        lastAvgX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        lastAvgY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      } else {
        lastAvgX = null;
        lastAvgY = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        const currentAvgX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const currentAvgY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        if (lastAvgX !== null && lastAvgY !== null) {
          const deltaX = lastAvgX - currentAvgX;
          const deltaY = lastAvgY - currentAvgY;
          el.scrollLeft += deltaX;
          el.scrollTop += deltaY;
        }
        lastAvgX = currentAvgX;
        lastAvgY = currentAvgY;
        if (e.cancelable) {
          e.preventDefault();
        }
      } else {
        lastAvgX = null;
        lastAvgY = null;
        if (e.touches.length === 1 && e.cancelable) {
          // Strictly prevent single finger from scrolling the page to protect palm resting
          e.preventDefault();
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        lastAvgX = null;
        lastAvgY = null;
      } else {
        lastAvgX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
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

  const minCanonicalSpreadHeight = Math.max(
    Math.ceil(viewportSize.height / effectiveScale),
    maxStrokeY > 0 ? Math.ceil(maxStrokeY + 250) : 0
  );
  const effectiveCanonicalHeight = Math.max(canonicalHeight, minCanonicalSpreadHeight);
  const scaledSpreadWidth = Math.round(CANONICAL_SPREAD_WIDTH * effectiveScale);
  const scaledSpreadHeight = Math.round(effectiveCanonicalHeight * effectiveScale);
  const canHorizontalScroll = scaledSpreadWidth > viewportSize.width + 2;

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

        {/* Right Page Header: Date, Orientation-Locked Zoom Control & Page Subtitle */}
        <Box sx={{
          width: '50%',
          boxShadow: isDark ? 'inset 6px 0 16px -6px rgba(0, 0, 0, 0.6)' : 'inset 6px 0 16px -6px rgba(0, 0, 0, 0.03)',
        }}>
          <CommentPageHeader
            date={commentDate}
            onDateChange={handleDateChange}
            scale={effectiveScale}
            isAutoScale={manualScale === null}
            canZoomOut={effectiveScale > MIN_SPREAD_SCALE + 0.005}
            canZoomIn={effectiveScale < MAX_MANUAL_SPREAD_SCALE - 0.005}
            onZoomOut={handleZoomOut}
            onZoomIn={handleZoomIn}
            onResetZoom={handleResetZoom}
          />
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
          overflowX: canHorizontalScroll ? 'auto' : 'hidden',
          position: 'relative',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none',
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
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
        {/* Scaled Sizer Box: matches the exact post-transform dimensions so scroll bounds never clip or drift */}
        <Box
          sx={{
            width: `${scaledSpreadWidth}px`,
            height: `${scaledSpreadHeight}px`,
            mx: 'auto',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Canonical Fixed-Width Spread (960px = 480px Left + 480px Right) */}
          <Box
            ref={spreadContentRef}
            sx={{
              display: 'flex',
              width: `${CANONICAL_SPREAD_WIDTH}px`,
              minHeight: `${minCanonicalSpreadHeight}px`,
              position: 'relative',
              alignItems: 'stretch',
              transform: `scale(${effectiveScale})`,
              transformOrigin: 'top left',
              willChange: 'transform',
            }}
          >
            {/* Left Column: Bible Text Panel (Fixed 480px Canonical Width) */}
            <Box
              sx={{
                width: `${CANONICAL_PAGE_WIDTH}px`,
                flexShrink: 0,
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

            {/* Right Column: Comment Page Panel (Fixed 480px Canonical Width) */}
            <Box
              sx={{
                width: `${CANONICAL_PAGE_WIDTH}px`,
                flexShrink: 0,
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
