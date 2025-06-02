// "use client";

// import React from "react";
// import { useUIStore } from "@/store/uiStore";
// import type { Tool } from "@/store/uiStore";

// const tools: { id: Tool; label: string }[] = [
//   { id: "select", label: "Select" },
//   { id: "rectangle", label: "Rectangle" },
//   { id: "circle", label: "Circle" },
//   { id: "text", label: "Text" },
// ];

// export default function Toolbar() {
//   const activeTool = useUIStore((state) => state.activeTool);
//   const setActiveTool = useUIStore((state) => state.setActiveTool);

//   return (
//     <div className="flex space-x-2 p-2 bg-gray-100 border-b border-gray-300">
//       {tools.map((tool) => (
//         <button
//           key={tool.id}
//           onClick={() => setActiveTool(tool.id)}
//           className={`px-3 py-1 rounded ${
//             activeTool === tool.id
//               ? "bg-blue-500 text-white"
//               : "bg-white text-gray-700"
//           } hover:bg-blue-400 hover:text-white transition`}
//           type="button"
//           aria-pressed={activeTool === tool.id}
//           title={tool.label}
//         >
//           {tool.label}
//         </button>
//       ))}
//     </div>
//   );
// }

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
  const clearShapes: () => void = useCanvasStore(
    (state: { clearShapes: () => void }) => state.clearShapes
  );

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all shapes?")) {
      clearShapes();
      // TODO: Also emit clear event to other users via socket
    }
  };

  return (
    <div className="flex flex-col items-center py-4 gap-2">
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id as Tool)}
            className={`
              w-10 h-10 rounded-lg flex items-center justify-center transition-colors
              ${
                activeTool === tool.id
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }
            `}
            title={tool.label}
          >
            <Icon size={20} />
          </button>
        );
      })}

      {/* Separator */}
      <div className="w-6 h-px bg-gray-300 my-2" />

      {/* Clear All Button */}
      <button
        onClick={handleClearAll}
        className="w-10 h-10 rounded-lg flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors"
        title="Clear All"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
}
