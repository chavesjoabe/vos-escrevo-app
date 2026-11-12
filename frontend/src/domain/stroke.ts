export type ToolType = 'pencil' | 'marker';
export type ActiveTool = ToolType | 'eraser' | 'stickyNote';

export interface StrokePoint {
  positionX: number;
  positionY: number;
  pressure: number;
}

export interface Stroke {
  strokeId: string;
  tool: ToolType;
  color: string;
  strokeWidth: number;
  opacity: number;
  points: StrokePoint[];
}
