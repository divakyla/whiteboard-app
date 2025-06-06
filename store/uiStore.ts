import { create } from "zustand";

export type Tool = "select" | "move" | "rectangle" | "circle" | "text";

interface UIState {
  activeTool: Tool | null;
  setActiveTool: (tool: Tool | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTool: "select",
  setActiveTool: (tool: Tool | null) => set({ activeTool: tool }),
  // setSelectedTool: (tool: ToolType) => set({ selectedTool: tool }),
}));
