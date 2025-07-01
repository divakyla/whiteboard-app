import { create } from "zustand";
import { Rectangle, Circle, TextShape, PenShape } from "@/types/canvas";

type Shape = Rectangle | Circle | TextShape | PenShape;

interface CanvasState {
  shapes: Shape[];
  addShape: (shape: Shape) => void;
  removeShape: (id: string) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  setShapes: (shapes: Shape[]) => void;
  clearShapes: () => void;

  selectedShapeId: string | null;
  setSelectedShapeId: (id: string | null) => void;

  zoom: number;
  setZoom: (zoom: number) => void;

  deleteShape?: (id: string) => Promise<void>; // Add this line// ✅
  penColor: string;
  setPenColor: (color: string) => void;
  penType: string;
  setPenType: (type: string) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  shapes: [],

  addShape: (shape) =>
    set((state) => ({
      shapes: [...state.shapes, shape],
    })),

  removeShape: (id) =>
    set((state) => ({
      shapes: state.shapes.filter((s) => s.id !== id),
    })),

  updateShape: (id, updates) =>
    set((state) => ({
      shapes: state.shapes.map((shape) => {
        if (shape.id !== id) return shape;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { type, ...rest } = updates; // prevent changing type
        return { ...shape, ...rest };
      }),
    })),

  setShapes: (shapes) => set({ shapes }),
  clearShapes: () => set({ shapes: [] }),

  selectedShapeId: null,
  setSelectedShapeId: (id) => set({ selectedShapeId: id }),

  zoom: 1,
  setZoom: (zoom) => set({ zoom }),
  penColor: "#000000",
  setPenColor: (color) => set({ penColor: color }),
  penType: "default",
  setPenType: (type) => set({ penType: type }),
}));
