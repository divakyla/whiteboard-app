import { create } from "zustand";

export type Tool = "select" | "rectangle" | "circle" | "text" | null;

interface UIState {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTool: null,
  setActiveTool: (tool) => set({ activeTool: tool }),
  // setSelectedTool: (tool: ToolType) => set({ selectedTool: tool }),
}));
