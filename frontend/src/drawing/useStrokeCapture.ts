import { useEffect, useRef } from 'react';
import { Stroke, StrokePoint, ToolType } from '../domain/stroke';
import { renderStrokeToSvgPath } from './strokeRenderer';
import { findIntersectingStrokeIds } from './strokeCollision';

interface UseStrokeCaptureOptions {
  tool: ToolType | 'eraser';
  color: string;
  strokeWidth: number;
  opacity: number;
  enabled?: boolean;
  pencilOnly?: boolean;
  svgRef: React.RefObject<SVGSVGElement | null>;
  activePathRef: React.RefObject<SVGPathElement | null>;
  eraserCircleRef?: React.RefObject<SVGCircleElement | null>;
  strokes?: Stroke[];
  onStrokeComplete?: (stroke: Stroke) => void;
  onEraseLive?: (strokeIds: string[]) => void;
  onEraseStrokes?: (strokeIds: string[]) => void;
}

export function useStrokeCapture({
  tool,
  color,
  strokeWidth,
  opacity,
  enabled = true,
  pencilOnly = false,
  svgRef,
  activePathRef,
  eraserCircleRef,
  strokes = [],
  onStrokeComplete,
  onEraseLive,
  onEraseStrokes,
}: UseStrokeCaptureOptions) {
  const isDrawingRef = useRef(false);
  const isErasingRef = useRef(false);
  const pointsRef = useRef<StrokePoint[]>([]);
  const lastEraserPointRef = useRef<{ x: number; y: number } | null>(null);
  const erasedStrokeIdsThisGestureRef = useRef<Set<string>>(new Set());
  const animFrameRef = useRef<number | null>(null);

  // Store latest options in ref to keep native event listeners lightweight & stable
  const optionsRef = useRef({
    tool,
    color,
    strokeWidth,
    opacity,
    enabled,
    pencilOnly,
    strokes,
    onStrokeComplete,
    onEraseLive,
    onEraseStrokes,
  });

  useEffect(() => {
    optionsRef.current = {
      tool,
      color,
      strokeWidth,
      opacity,
      enabled,
      pencilOnly,
      strokes,
      onStrokeComplete,
      onEraseLive,
      onEraseStrokes,
    };
  }, [tool, color, strokeWidth, opacity, enabled, pencilOnly, strokes, onStrokeComplete, onEraseLive, onEraseStrokes]);

  const getCanvasCoordinatesFromNative = (
    event: PointerEvent,
    targetElement: SVGSVGElement
  ): StrokePoint => {
    const boundingBox = targetElement.getBoundingClientRect();
    const parentEl = targetElement.parentElement;
    const logicalWidth =
      (parentEl && parentEl.offsetWidth) ||
      targetElement.clientWidth ||
      boundingBox.width;
    const logicalHeight =
      (parentEl && parentEl.offsetHeight) ||
      targetElement.clientHeight ||
      boundingBox.height;

    const scaleX = logicalWidth > 0 ? boundingBox.width / logicalWidth : 1;
    const scaleY = logicalHeight > 0 ? boundingBox.height / logicalHeight : scaleX;

    const positionX = (event.clientX - boundingBox.left) / (scaleX || 1);
    const positionY = (event.clientY - boundingBox.top) / (scaleY || 1);

    let pressure = event.pressure;
    if (pressure === 0 || pressure === undefined) {
      pressure = 0.5;
    }

    return {
      positionX: Math.round(positionX * 10) / 10,
      positionY: Math.round(positionY * 10) / 10,
      pressure: Math.round(pressure * 100) / 100,
    };
  };

  const getEraserRadius = (width: number) => {
    if (width <= 2) return 10;
    if (width <= 5) return 16;
    return 24;
  };

  const updateActivePathDOM = () => {
    if (!activePathRef.current || pointsRef.current.length === 0) return;

    const currentOptions = optionsRef.current;
    if (currentOptions.tool === 'eraser') return;

    const pathD = renderStrokeToSvgPath({
      strokeId: 'active-drawing-stroke',
      tool: currentOptions.tool,
      color: currentOptions.color,
      strokeWidth: currentOptions.strokeWidth,
      opacity: currentOptions.opacity,
      points: pointsRef.current,
    });

    activePathRef.current.setAttribute('d', pathD);
    activePathRef.current.setAttribute('fill', currentOptions.color);
    activePathRef.current.setAttribute('opacity', String(currentOptions.opacity));
    activePathRef.current.style.display = 'block';
  };

  const updateEraserCircleDOM = (x: number, y: number, radius: number) => {
    if (!eraserCircleRef?.current) return;
    eraserCircleRef.current.setAttribute('cx', String(x));
    eraserCircleRef.current.setAttribute('cy', String(y));
    eraserCircleRef.current.setAttribute('r', String(radius));
    eraserCircleRef.current.style.display = 'block';
  };

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const onPointerDown = (event: PointerEvent) => {
      const { enabled: isEnabled, pencilOnly: isPencilOnly, tool: activeTool } = optionsRef.current;
      if (!isEnabled) return;

      // Palm Rejection check
      if (isPencilOnly && event.pointerType === 'touch') {
        return;
      }

      if (event.cancelable) {
        event.preventDefault();
      }

      const point = getCanvasCoordinatesFromNative(event, svgEl);

      if (activeTool === 'eraser') {
        // Eraser pencil drag mode initiated
        isErasingRef.current = true;
        erasedStrokeIdsThisGestureRef.current.clear();
        lastEraserPointRef.current = { x: point.positionX, y: point.positionY };

        const radius = getEraserRadius(optionsRef.current.strokeWidth);
        updateEraserCircleDOM(point.positionX, point.positionY, radius);

        // Immediate intersection check on touch down point
        const hitIds = findIntersectingStrokeIds(
          optionsRef.current.strokes || [],
          point.positionX,
          point.positionY,
          point.positionX,
          point.positionY,
          radius
        );

        if (hitIds.length > 0) {
          for (let i = 0; i < hitIds.length; i++) {
            erasedStrokeIdsThisGestureRef.current.add(hitIds[i]);
          }
          optionsRef.current.onEraseLive?.(hitIds);
        }
      } else {
        // Normal pencil or marker drawing
        isDrawingRef.current = true;
        pointsRef.current = [point];
        updateActivePathDOM();
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const currentOptions = optionsRef.current;
      if (!currentOptions.enabled) return;

      if (currentOptions.pencilOnly && event.pointerType === 'touch') {
        return;
      }

      // Handle Eraser Pencil Dragging
      if (isErasingRef.current && currentOptions.tool === 'eraser') {
        if (event.cancelable) {
          event.preventDefault();
        }

        const coalesced = event.getCoalescedEvents
          ? event.getCoalescedEvents()
          : [event];

        const radius = getEraserRadius(currentOptions.strokeWidth);
        let latestX = 0;
        let latestY = 0;

        for (let i = 0; i < coalesced.length; i++) {
          const subPoint = getCanvasCoordinatesFromNative(coalesced[i], svgEl);
          latestX = subPoint.positionX;
          latestY = subPoint.positionY;

          const lastPt = lastEraserPointRef.current || { x: subPoint.positionX, y: subPoint.positionY };

          const hitIds = findIntersectingStrokeIds(
            currentOptions.strokes || [],
            lastPt.x,
            lastPt.y,
            subPoint.positionX,
            subPoint.positionY,
            radius
          );

          if (hitIds.length > 0) {
            const newlyHitIds: string[] = [];
            for (let h = 0; h < hitIds.length; h++) {
              const id = hitIds[h];
              if (!erasedStrokeIdsThisGestureRef.current.has(id)) {
                erasedStrokeIdsThisGestureRef.current.add(id);
                newlyHitIds.push(id);
              }
            }
            if (newlyHitIds.length > 0) {
              currentOptions.onEraseLive?.(newlyHitIds);
            }
          }

          lastEraserPointRef.current = { x: subPoint.positionX, y: subPoint.positionY };
        }

        if (latestX > 0 && latestY > 0) {
          updateEraserCircleDOM(latestX, latestY, radius);
        }
        return;
      }

      // Handle Normal Pencil / Marker Drawing
      if (!isDrawingRef.current) return;

      if (event.cancelable) {
        event.preventDefault();
      }

      const coalesced = event.getCoalescedEvents
        ? event.getCoalescedEvents()
        : [event];

      for (let index = 0; index < coalesced.length; index++) {
        const subEvt = coalesced[index];
        const point = getCanvasCoordinatesFromNative(subEvt, svgEl);
        const lastPoint = pointsRef.current[pointsRef.current.length - 1];

        if (lastPoint) {
          const deltaX = point.positionX - lastPoint.positionX;
          const deltaY = point.positionY - lastPoint.positionY;
          if (Math.hypot(deltaX, deltaY) < 0.5) {
            continue;
          }
        }
        pointsRef.current.push(point);
      }

      if (animFrameRef.current === null) {
        animFrameRef.current = requestAnimationFrame(() => {
          animFrameRef.current = null;
          if (isDrawingRef.current) {
            updateActivePathDOM();
          }
        });
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      const currentOptions = optionsRef.current;

      // Finalize Eraser Drag Gesture
      if (isErasingRef.current && currentOptions.tool === 'eraser') {
        if (event.cancelable) {
          event.preventDefault();
        }

        isErasingRef.current = false;
        lastEraserPointRef.current = null;

        if (eraserCircleRef?.current) {
          eraserCircleRef.current.style.display = 'none';
        }

        if (erasedStrokeIdsThisGestureRef.current.size > 0) {
          const allErasedIds = Array.from(erasedStrokeIdsThisGestureRef.current);
          erasedStrokeIdsThisGestureRef.current.clear();
          currentOptions.onEraseStrokes?.(allErasedIds);
        }
        return;
      }

      // Finalize Pencil / Marker Stroke
      if (!isDrawingRef.current) return;

      if (event.cancelable) {
        event.preventDefault();
      }

      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }

      isDrawingRef.current = false;
      const finalPoints = [...pointsRef.current];
      pointsRef.current = [];

      if (activePathRef.current) {
        activePathRef.current.setAttribute('d', '');
        activePathRef.current.style.display = 'none';
      }

      if (finalPoints.length > 0 && currentOptions.tool !== 'eraser') {
        const strokeId = `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const newStroke: Stroke = {
          strokeId,
          tool: currentOptions.tool,
          color: currentOptions.color,
          strokeWidth: currentOptions.strokeWidth,
          opacity: currentOptions.opacity,
          points: finalPoints,
        };
        currentOptions.onStrokeComplete?.(newStroke);
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length > 1) {
        // Multi-touch gesture detected (2-finger scroll): cancel any accidental drawing or erasing stroke
        if (isDrawingRef.current) {
          isDrawingRef.current = false;
          pointsRef.current = [];
          if (activePathRef.current) {
            activePathRef.current.setAttribute('d', '');
            activePathRef.current.style.display = 'none';
          }
        }
        if (isErasingRef.current) {
          isErasingRef.current = false;
          lastEraserPointRef.current = null;
          if (eraserCircleRef?.current) {
            eraserCircleRef.current.style.display = 'none';
          }
        }
        return;
      }
      // For single touch finger drawing/erasing when pencilOnly is false, prevent gesture hold timer
      if (event.cancelable && optionsRef.current.enabled && !optionsRef.current.pencilOnly) {
        event.preventDefault();
      }
    };

    // Attach native non-passive listeners to guarantee 0ms gesture delay on Safari iPadOS
    svgEl.addEventListener('pointerdown', onPointerDown, { passive: false });
    svgEl.addEventListener('pointermove', onPointerMove, { passive: false });
    svgEl.addEventListener('pointerup', onPointerUp, { passive: false });
    svgEl.addEventListener('pointercancel', onPointerUp, { passive: false });
    svgEl.addEventListener('touchstart', onTouchStart, { passive: false });

    return () => {
      svgEl.removeEventListener('pointerdown', onPointerDown);
      svgEl.removeEventListener('pointermove', onPointerMove);
      svgEl.removeEventListener('pointerup', onPointerUp);
      svgEl.removeEventListener('pointercancel', onPointerUp);
      svgEl.removeEventListener('touchstart', onTouchStart);
    };
  }, [svgRef, activePathRef, eraserCircleRef]);
}
