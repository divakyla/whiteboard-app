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

export type Shape = Rectangle | Circle | TextShape;
