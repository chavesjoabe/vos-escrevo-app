import React, { useMemo } from 'react';
import { Stroke } from '../domain/stroke';
import { renderStrokeToSvgPath } from './strokeRenderer';

interface RenderedStrokeProps {
  stroke: Stroke;
  activeTool: string;
  onEraseStroke?: (strokeId: string) => void;
}

export const RenderedStroke: React.FC<RenderedStrokeProps> = React.memo(
  ({ stroke, activeTool, onEraseStroke }) => {
    // Memoize the SVG path string so perfect-freehand math runs ONLY ONCE per stroke
    const pathD = useMemo(() => renderStrokeToSvgPath(stroke), [stroke]);

    if (!pathD) return null;

    const isMarker = stroke.tool === 'marker';

    return (
      <path
        d={pathD}
        fill={stroke.color}
        opacity={stroke.opacity ?? (isMarker ? 0.5 : 1.0)}
        onClick={() => {
          if (activeTool === 'eraser' && onEraseStroke) {
            onEraseStroke(stroke.strokeId);
          }
        }}
        style={{
          mixBlendMode: isMarker ? 'multiply' : 'normal',
          cursor: activeTool === 'eraser' ? 'crosshair' : 'default',
          transition: 'opacity 0.1s ease',
        }}
      />
    );
  }
);
