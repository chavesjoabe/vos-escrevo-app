import { Stroke } from '../domain/stroke';

/**
 * Calculates squared distance from a point to a line segment.
 */
export function pointToSegmentDistanceSquared(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    const distX = px - x1;
    const distY = py - y1;
    return distX * distX + distY * distY;
  }

  // Projection scalar clamped to [0, 1]
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  const distX = px - projX;
  const distY = py - projY;
  return distX * distX + distY * distY;
}

/**
 * Checks whether an eraser point (with radius) intersects a given stroke.
 */
export function isStrokeIntersectingPoint(
  stroke: Stroke,
  pointX: number,
  pointY: number,
  radius: number = 14
): boolean {
  if (!stroke.points || stroke.points.length === 0) return false;

  const threshold = radius + (stroke.strokeWidth || 3) / 2;
  const thresholdSq = threshold * threshold;

  // Single-point dot stroke
  if (stroke.points.length === 1) {
    const pt = stroke.points[0];
    const dx = pointX - pt.positionX;
    const dy = pointY - pt.positionY;
    return dx * dx + dy * dy <= thresholdSq;
  }

  // Check all line segments of the stroke
  for (let i = 0; i < stroke.points.length - 1; i++) {
    const p1 = stroke.points[i];
    const p2 = stroke.points[i + 1];

    // Quick bounding box rejection for this segment
    const minX = Math.min(p1.positionX, p2.positionX) - threshold;
    const maxX = Math.max(p1.positionX, p2.positionX) + threshold;
    const minY = Math.min(p1.positionY, p2.positionY) - threshold;
    const maxY = Math.max(p1.positionY, p2.positionY) + threshold;

    if (pointX < minX || pointX > maxX || pointY < minY || pointY > maxY) {
      continue;
    }

    const distSq = pointToSegmentDistanceSquared(
      pointX,
      pointY,
      p1.positionX,
      p1.positionY,
      p2.positionX,
      p2.positionY
    );

    if (distSq <= thresholdSq) {
      return true;
    }
  }

  return false;
}

/**
 * Checks whether an eraser sweep trajectory (from start to end) intersects a stroke.
 * Interpolates points along the sweep vector so fast hand swipes never miss strokes.
 */
export function isStrokeIntersectingSweep(
  stroke: Stroke,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  radius: number = 14
): boolean {
  const dx = endX - startX;
  const dy = endY - startY;
  const dist = Math.hypot(dx, dy);

  if (dist < 4) {
    return isStrokeIntersectingPoint(stroke, endX, endY, radius);
  }

  // Interpolate points at ~6-8px intervals along sweep vector
  const steps = Math.ceil(dist / 8);
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const px = startX + t * dx;
    const py = startY + t * dy;
    if (isStrokeIntersectingPoint(stroke, px, py, radius)) {
      return true;
    }
  }

  return false;
}

/**
 * Finds all strokes intersecting an eraser sweep.
 */
export function findIntersectingStrokeIds(
  strokes: Stroke[],
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  radius: number = 14
): string[] {
  const hitIds: string[] = [];
  for (let i = 0; i < strokes.length; i++) {
    const stroke = strokes[i];
    if (isStrokeIntersectingSweep(stroke, startX, startY, endX, endY, radius)) {
      hitIds.push(stroke.strokeId);
    }
  }
  return hitIds;
}
