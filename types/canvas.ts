export interface Rectangle {
  id: string;
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface Circle {
  id: string;
  type: "circle";
  cx: number;
  cy: number;
  r: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface TextShape {
  id: string;
  type: "text";
  x: number;
  y: number;
  content: string;
  fontSize: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface PenShape {
  id: string;
  type: "pen";
  points: { x: number; y: number }[];
  pathData: string;
  stroke: string;
  strokeWidth: number;
}

export interface ArrowShape {
  id: string;
  type: "arrow-straight" | "arrow-elbow" | "arrow-curve";
  x: number;
  y: number;
  width: number;
  height: number;
  stroke?: string;
  rotation?: number;
  strokeWidth?: number;
}

// export interface ArrowElbowShape {
//   id: string;
//   type: "arrow-elbow";
//   x: number;
//   y: number;
//   width: number;
//   height: number;
//   stroke: string;
//   strokeWidth: number;
// }

// export interface ArrowCurveShape {
//   id: string;
//   type: "arrow-curve";
//   x: number;
//   y: number;
//   width: number;
//   height: number;
//   stroke: string;
//   strokeWidth: number;
// }

export interface StampShape {
  id: string;
  type: "stamp";
  x: number;
  y: number;
  content: string; // emoji or sticker
  fontSize: number;
}

export type Shape =
  | Rectangle
  | Circle
  | TextShape
  | PenShape
  | ArrowShape
  | StampShape;
