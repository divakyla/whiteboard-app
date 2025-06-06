import React from "react";
import { useUIStore, type Tool } from "@/store/uiStore";
import { MousePointer, Square, Circle, Type, Move, Trash2 } from "lucide-react";
import { useCanvasStore } from "@/store/canvasStore";

const tools = [
  { id: "select", icon: MousePointer, label: "Select" },
  { id: "move", icon: Move, label: "Move" },
  { id: "rectangle", icon: Square, label: "Rectangle" },
  { id: "circle", icon: Circle, label: "Circle" },
  { id: "text", icon: Type, label: "Text" },
];

export default function Toolbar() {
  const activeTool = useUIStore((state) => state.activeTool);
  const setActiveTool = useUIStore((state) => state.setActiveTool);
  const selectedShapeId = useCanvasStore((s) => s.selectedShapeId);
  const deleteShape = useCanvasStore((s) => s.deleteShape);
  const zoomLevel = useCanvasStore((s) => s.zoom);
  const setZoom = useCanvasStore((s) => s.setZoom);

  const zoom = (delta: number) => {
    const nextZoom = Math.min(2, Math.max(0.2, zoomLevel + delta));
    setZoom(nextZoom);
  };

  const handleDelete = () => {
    if (selectedShapeId && deleteShape) {
      deleteShape(selectedShapeId);
    }
  };

  const handleToolClick = (toolId: Tool) => {
    setActiveTool(activeTool === toolId ? null : toolId);
  };

  return (
    <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 z-50 bg-white/90 backdrop-blur-md shadow-xl border border-gray-200 rounded-xl px-4 py-2 flex items-center gap-2 overflow-x-auto max-w-[95vw]">
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.id as Tool)}
            className={`
              w-10 h-10 rounded-lg flex items-center justify-center transition-colors
              ${
                activeTool === tool.id
                  ? "bg-purple-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }
            `}
            title={tool.label}
          >
            <Icon size={20} />
          </button>
        );
      })}

      <div className="w-px h-6 bg-gray-300 mx-2" />

      <button
        onClick={handleDelete}
        className="w-10 h-10 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
        title="Delete Selected"
      >
        <Trash2 size={20} />
      </button>
      <div className="w-px h-6 bg-gray-300 mx-2" />

      <button
        onClick={() => zoom(-0.1)}
        className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
        title="Zoom Out"
      >
        －
      </button>
      <button
        onClick={() => zoom(0.1)}
        className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
        title="Zoom In"
      >
        ＋
      </button>
    </div>
  );
}
