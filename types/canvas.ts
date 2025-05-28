// export type ShapeType = "rectangle" | "circle" | "text";

// export interface BaseShape {
//   id: string;
//   type: ShapeType;
// }

// export interface Rectangle extends BaseShape {
//   type: "rectangle";
//   x: number;
//   y: number;
//   width: number;
//   height: number;
// }

// export interface Circle extends BaseShape {
//   type: "circle";
//   cx: number;
//   cy: number;
//   r: number;
// }

// export interface TextShape extends BaseShape {
//   type: "text";
//   x: number;
//   y: number;
//   text: string;
//   fontSize: number;
// }
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
