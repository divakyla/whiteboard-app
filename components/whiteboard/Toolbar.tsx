// import React from "react";
// import { useUIStore, type Tool } from "@/store/uiStore";
// import { MousePointer, Square, Circle, Type, Move, Trash2 } from "lucide-react";
// import { useCanvasStore } from "@/store/canvasStore";

// const tools = [
//   { id: "select", icon: MousePointer, label: "Select" },
//   { id: "move", icon: Move, label: "Move" },
//   { id: "rectangle", icon: Square, label: "Rectangle" },
//   { id: "circle", icon: Circle, label: "Circle" },
//   { id: "text", icon: Type, label: "Text" },
// ];

// export default function Toolbar() {
//   const activeTool = useUIStore((state) => state.activeTool);
//   const setActiveTool = useUIStore((state) => state.setActiveTool);
//   const selectedShapeId = useCanvasStore((s) => s.selectedShapeId);
//   const deleteShape = useCanvasStore((s) => s.deleteShape);
//   const zoomLevel = useCanvasStore((s) => s.zoom);
//   const setZoom = useCanvasStore((s) => s.setZoom);

//   const zoom = (delta: number) => {
//     const nextZoom = Math.min(2, Math.max(0.2, zoomLevel + delta));
//     setZoom(nextZoom);
//   };

//   const handleDelete = () => {
//     if (selectedShapeId && deleteShape) {
//       deleteShape(selectedShapeId);
//     }
//   };

//   const handleToolClick = (toolId: Tool) => {
//     setActiveTool(activeTool === toolId ? null : toolId);
//   };

//   return (
//     <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 z-50 bg-white/90 backdrop-blur-md shadow-xl border border-gray-200 rounded-xl px-4 py-2 flex items-center gap-2 overflow-x-auto max-w-[95vw]">
//       {tools.map((tool) => {
//         const Icon = tool.icon;
//         return (
//           <button
//             key={tool.id}
//             onClick={() => handleToolClick(tool.id as Tool)}
//             className={`
//               w-10 h-10 rounded-lg flex items-center justify-center transition-colors
//               ${
//                 activeTool === tool.id
//                   ? "bg-purple-500 text-white"
//                   : "text-gray-600 hover:bg-gray-100"
//               }
//             `}
//             title={tool.label}
//           >
//             <Icon size={20} />
//           </button>
//         );
//       })}

//       <div className="w-px h-6 bg-gray-300 mx-2" />

//       <button
//         onClick={handleDelete}
//         className="w-10 h-10 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
//         title="Delete Selected"
//       >
//         <Trash2 size={20} />
//       </button>
//       <div className="w-px h-6 bg-gray-300 mx-2" />

//       <button
//         onClick={() => zoom(-0.1)}
//         className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
//         title="Zoom Out"
//       >
//         －
//       </button>
//       <button
//         onClick={() => zoom(0.1)}
//         className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
//         title="Zoom In"
//       >
//         ＋
//       </button>
//     </div>
//   );
// }

// components/whiteboard/Toolbar.tsx
// components/whiteboard/Toolbar.tsx
"use client";
import React, { useState } from "react";
import {
  MousePointer,
  Move,
  Square,
  Circle,
  Type,
  Pencil,
  // Star,
  // Smile,
  Trash2,
  ZoomIn,
  ZoomOut,
  Palette,
  Eraser,
} from "lucide-react";
import { useUIStore, type Tool } from "@/store/uiStore";
import { useCanvasStore } from "@/store/canvasStore";

const tools = [
  { id: "select", icon: MousePointer, label: "Select" },
  { id: "move", icon: Move, label: "Move" },
  { id: "rectangle", icon: Square, label: "Rectangle" },
  { id: "circle", icon: Circle, label: "Circle" },
  { id: "text", icon: Type, label: "Text" },
  { id: "pen", icon: Pencil, label: "Pen" },
  // { id: "emoji", icon: Smile, label: "Emoji" },
  // { id: "sticker", icon: Star, label: "Sticker" },
  { id: "eraser", icon: Eraser, label: "Eraser" },
];

export default function Toolbar() {
  const activeTool = useUIStore((s) => s.activeTool);
  const setActiveTool = useUIStore((s) => s.setActiveTool);
  const selectedShapeId = useCanvasStore((s) => s.selectedShapeId);
  const deleteShape = useCanvasStore((s) => s.deleteShape);
  const zoomLevel = useCanvasStore((s) => s.zoom);
  const setZoom = useCanvasStore((s) => s.setZoom);
  // const [penType, setPenType] = useState<"default" | "marker">("default");
  const [showPenOptions, setShowPenOptions] = useState(false);
  // const [color, setColor] = useState("#000000");
  const penColor = useCanvasStore((s) => s.penColor);
  const setPenColor = useCanvasStore((s) => s.setPenColor);
  const penType = useCanvasStore((s) => s.penType);
  const setPenType = useCanvasStore((s) => s.setPenType);

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
    if (toolId === ("pen" as Tool)) {
      setShowPenOptions((prev) => !prev);
    } else {
      setShowPenOptions(false);
    }
    setActiveTool(activeTool === toolId ? null : toolId);
  };

  return (
    <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white/90 backdrop-blur-md shadow-xl border border-gray-200 rounded-xl px-4 py-2 flex items-center gap-2 overflow-x-auto max-w-[95vw] relative">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id as Tool)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                activeTool === tool.id
                  ? "bg-purple-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              title={tool.label}
            >
              <Icon size={20} />
            </button>
          );
        })}

        {/* Color Picker */}
        <label className="ml-2 relative cursor-pointer">
          <Palette className="w-5 h-5 text-gray-600" />
          <input
            type="color"
            className="absolute top-0 left-0 w-5 h-5 opacity-0 cursor-pointer"
            value={penColor}
            onChange={(e) => setPenColor(e.target.value)}
          />
        </label>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
          title="Delete"
        >
          <Trash2 size={20} />
        </button>

        {/* Zoom */}
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => zoom(-0.1)}
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-600"
            title="Zoom Out"
          >
            <ZoomOut size={20} />
          </button>
          <button
            onClick={() => zoom(0.1)}
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-600"
            title="Zoom In"
          >
            <ZoomIn size={20} />
          </button>
        </div>

        {/* Pen Type Selector */}
        {showPenOptions && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-white border shadow-md rounded-lg px-3 py-2 flex gap-2 z-50">
            {["default", "marker"].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setPenType(type as "default" | "marker");
                  setShowPenOptions(false);
                }}
                className={`px-3 py-1 text-sm rounded ${
                  penType === type
                    ? "bg-purple-500 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                {type === "default" ? "✏️ Pen" : "🖌️ Marker"}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
