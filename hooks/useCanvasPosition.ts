// ✅ Canvas.tsx FINAL FIXED (zoom-aware koordinat, no offset bug, clean)

import { useCallback } from "react";

export function useCanvasPosition(zoom: number) {
  const getCanvasCoordinates = useCallback(
    (e: React.MouseEvent): { x: number; y: number } => {
      const svg = e.currentTarget as SVGSVGElement;
      const rect = svg.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / zoom,
        y: (e.clientY - rect.top) / zoom,
      };
    },
    [zoom]
  );

  return { getCanvasCoordinates };
}

// 🧠 Pastikan saat membuat shape, kamu pakai fungsi getCanvasCoordinates dari sini:
// const { getCanvasCoordinates } = useCanvasPosition(zoom);
// const { x, y } = getCanvasCoordinates(e);
