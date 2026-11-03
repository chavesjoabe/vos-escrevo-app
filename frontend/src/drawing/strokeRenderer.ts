import getStroke from 'perfect-freehand';
import { Stroke } from '../domain/stroke';

export interface StrokeOptions {
  size?: number;
  thinning?: number;
  smoothing?: number;
  streamline?: number;
  simulatePressure?: boolean;
}

/**
 * Converts a set of 2D polygon outline points returned by getStroke into an SVG path string.
 */
export function getSvgPathFromStroke(strokePoints: number[][]): string {
  if (!strokePoints.length) return '';

  const d = strokePoints.reduce(
    (accumulator, [positionX, positionY], pointIndex) =>
      pointIndex === 0
        ? `M ${positionX.toFixed(2)} ${positionY.toFixed(2)}`
        : `${accumulator} L ${positionX.toFixed(2)} ${positionY.toFixed(2)}`,
    ''
  );

  return `${d} Z`;
}

/**
 * Generates an SVG path string for a given domain Stroke object.
 */
export function renderStrokeToSvgPath(stroke: Stroke): string {
  if (!stroke.points || stroke.points.length === 0) return '';

  // Format points for perfect-freehand: [x, y, pressure]
  const inputPoints = stroke.points.map((point) => [
    point.positionX,
    point.positionY,
    point.pressure || 0.5,
  ]);

  const isMarker = stroke.tool === 'marker';

  // Zero streamline (streamline: 0.02) guarantees 1:1 real-time Apple Pencil tip tracking without trailing spring lag
  const outlinePoints = getStroke(inputPoints, {
    size: stroke.strokeWidth,
    thinning: isMarker ? 0 : 0.35,
    smoothing: 0.2,
    streamline: 0.02,
    easing: (t) => t,
    simulatePressure: false,
    start: { cap: true },
    end: { cap: true },
  });

  return getSvgPathFromStroke(outlinePoints);
}
