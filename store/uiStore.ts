import { create } from "zustand";

export type Tool =
  | "select"
  | "move"
  | "rectangle"
  | "circle"
  | "text"
  | "pen"
  | "eraser"
  | "arrow-straight"
  | "arrow-elbow"
  | "arrow-curve"
  | "stamp";

interface UIState {
  activeTool: Tool | null;
  setActiveTool: (tool: Tool | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTool: "select",
  setActiveTool: (tool: Tool | null) => set({ activeTool: tool }),
  // setSelectedTool: (tool: ToolType) => set({ selectedTool: tool }),
}));
