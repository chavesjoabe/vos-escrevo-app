import React, { useState, useEffect, useRef } from 'react';
import { ActiveTool, Stroke } from '../../domain/stroke';
import { useStrokeCapture } from '../../drawing/useStrokeCapture';
import { RenderedStroke } from '../../drawing/RenderedStroke';

interface HighlightLayerProps {
  strokes: Stroke[];
  activeTool: ActiveTool;
  activeColor: string;
  activeWidth: number;
  pencilOnly?: boolean;
  onStrokeComplete: (stroke: Stroke) => void;
  onEraseStrokes?: (strokeIds: string[]) => void;
}

export const HighlightLayer: React.FC<HighlightLayerProps> = ({
  strokes,
  activeTool,
  activeColor,
  activeWidth,
  pencilOnly = false,
  onStrokeComplete,
  onEraseStrokes,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const activePathRef = useRef<SVGPathElement | null>(null);
  const eraserCircleRef = useRef<SVGCircleElement | null>(null);

  // Synchronous local state for zero-latency instant rendering between letters & eraser swipes
  const [displayStrokes, setDisplayStrokes] = useState<Stroke[]>(strokes);

  useEffect(() => {
    setDisplayStrokes(strokes);
  }, [strokes]);

  const handleInternalStrokeComplete = (newStroke: Stroke) => {
    setDisplayStrokes((prev) => [...prev, newStroke]);
    onStrokeComplete(newStroke);
  };

  const handleEraseLive = (hitIds: string[]) => {
    const idSet = new Set(hitIds);
    setDisplayStrokes((prev) => prev.filter((s) => !idSet.has(s.strokeId)));
  };

  const handleEraseStrokesCommit = (strokeIds: string[]) => {
    const idSet = new Set(strokeIds);
    setDisplayStrokes((prev) => prev.filter((s) => !idSet.has(s.strokeId)));
    onEraseStrokes?.(strokeIds);
  };

  const handleSingleStrokeErase = (strokeId: string) => {
    setDisplayStrokes((prev) => prev.filter((s) => s.strokeId !== strokeId));
    onEraseStrokes?.([strokeId]);
  };

  useStrokeCapture({
    tool: activeTool,
    color: activeColor,
    strokeWidth: activeWidth,
    opacity: activeTool === 'marker' ? 0.5 : 1.0,
    enabled: true,
    pencilOnly,
    svgRef,
    activePathRef,
    eraserCircleRef,
    strokes: displayStrokes,
    onStrokeComplete: handleInternalStrokeComplete,
    onEraseLive: handleEraseLive,
    onEraseStrokes: handleEraseStrokesCommit,
  });

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        touchAction: 'none',
        zIndex: 10,
        cursor: activeTool === 'eraser' ? 'crosshair' : activeTool === 'pencil' || activeTool === 'marker' ? 'crosshair' : 'default',
      }}
    >
      {/* Saved Strokes over Bible Text */}
      {displayStrokes.map((stroke) => (
        <RenderedStroke
          key={stroke.strokeId}
          stroke={stroke}
          activeTool={activeTool}
          onEraseStroke={handleSingleStrokeErase}
        />
      ))}

      {/* Active stroke in progress - rendered directly via DOM for zero-latency 240Hz Apple Pencil speed */}
      <path
        ref={activePathRef}
        style={{
          mixBlendMode: activeTool === 'marker' ? 'multiply' : 'normal',
          display: 'none',
        }}
      />

      {/* Eraser head circle indicator */}
      <circle
        ref={eraserCircleRef}
        r={16}
        fill="rgba(244, 63, 94, 0.16)"
        stroke="rgba(244, 63, 94, 0.75)"
        strokeWidth="1.5"
        strokeDasharray="3 3"
        style={{ display: 'none', pointerEvents: 'none' }}
      />
    </svg>
  );
};
