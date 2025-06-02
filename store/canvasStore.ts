// import { create } from "zustand";
// import { Rectangle, Circle, TextShape } from "@/types/canvas";

// type Shape = Rectangle | Circle | TextShape;

// interface CanvasState {
//   shapes: Shape[];
//   addShape: (shape: Shape) => void;
//   removeShape: (id: string) => void; // 👈 Tambahan
//   clearShapes: () => void;
//   setShapes: (shapes: Shape[]) => void;
// }

// export const useCanvasStore = create<CanvasState>((set) => ({
//   shapes: [],
//   addShape: (shape) =>
//     set((state) => ({
//       shapes: [...state.shapes, shape],
//     })),
//   removeShape: (id) =>
//     set((state) => ({
//       shapes: state.shapes.filter((s) => s.id !== id),
//     })), // 👈 Implementasi hapus berdasarkan ID
//   clearShapes: () => set({ shapes: [] }),
//   setShapes: (shapes) => set({ shapes }),
// }));

// interface CanvasState {
//   shapes: Shape[];
//   addShape: (shape: Shape) => void;
//   clearShapes: () => void;
//   setShapes: (shapes: Shape[]) => void;
//   removeShape: (id: string) => void; // ✅ tambahkan
// }

// export const useCanvasStore = create<CanvasState>((set) => ({
//   shapes: [],
//   addShape: (shape) => set((state) => ({ shapes: [...state.shapes, shape] })),
//   clearShapes: () => set({ shapes: [] }),
//   setShapes: (shapes) => set({ shapes }),
//   removeShape: (id) =>
//     set((state) => ({ shapes: state.shapes.filter((s) => s.id !== id) })), // ✅ tambahkan
// }));

import { create } from "zustand";
import { Rectangle, Circle, TextShape } from "@/types/canvas";

type Shape = Rectangle | Circle | TextShape;

interface CanvasState {
  shapes: Shape[];
  addShape: (shape: Shape) => void;
  clearShapes: () => void;
  setShapes: (shapes: Shape[]) => void;
  removeShape: (id: string) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void; // ✅ tambahan untuk editing
}

export const useCanvasStore = create<CanvasState>((set) => ({
  shapes: [],
  addShape: (shape) => set((state) => ({ shapes: [...state.shapes, shape] })),
  clearShapes: () => set({ shapes: [] }),
  setShapes: (shapes) => set({ shapes }),
  removeShape: (id) =>
    set((state) => ({
      shapes: state.shapes.filter((s) => s.id !== id),
    })),
  updateShape: (id, updates) =>
    set((state) => ({
      shapes: state.shapes.map((shape) => {
        if (shape.id !== id) return shape;
        // Prevent changing the 'type' property and ensure correct type
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { type, ...restUpdates } = updates;
        return { ...shape, ...restUpdates };
      }),
    })),
}));
