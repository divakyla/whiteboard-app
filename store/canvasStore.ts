import { create } from "zustand";
import { Rectangle, Circle, TextShape } from "@/types/canvas";

type Shape = Rectangle | Circle | TextShape;

interface CanvasState {
  shapes: Shape[];
  addShape: (shape: Shape) => void;
  removeShape: (id: string) => void; // 👈 Tambahan
  clearShapes: () => void;
  setShapes: (shapes: Shape[]) => void;
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
    })), // 👈 Implementasi hapus berdasarkan ID
  clearShapes: () => set({ shapes: [] }),
  setShapes: (shapes) => set({ shapes }),
}));
