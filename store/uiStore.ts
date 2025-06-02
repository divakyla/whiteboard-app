import { create } from "zustand";

export type Tool = "select" | "move" | "rectangle" | "circle" | "text";

interface UIState {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTool: "select",
  setActiveTool: (tool) => set({ activeTool: tool }),
  // setSelectedTool: (tool: ToolType) => set({ selectedTool: tool }),
}));
