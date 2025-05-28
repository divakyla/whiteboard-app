"use client";

import React from "react";
import { useUIStore } from "@/store/uiStore";
import type { Tool } from "@/store/uiStore";

const tools: { id: Tool; label: string }[] = [
  { id: "select", label: "Select" },
  { id: "rectangle", label: "Rectangle" },
  { id: "circle", label: "Circle" },
  { id: "text", label: "Text" },
];

export default function Toolbar() {
  const activeTool = useUIStore((state) => state.activeTool);
  const setActiveTool = useUIStore((state) => state.setActiveTool);

  return (
    <div className="flex space-x-2 p-2 bg-gray-100 border-b border-gray-300">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => setActiveTool(tool.id)}
          className={`px-3 py-1 rounded ${
            activeTool === tool.id
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-700"
          } hover:bg-blue-400 hover:text-white transition`}
          type="button"
          aria-pressed={activeTool === tool.id}
          title={tool.label}
        >
          {tool.label}
        </button>
      ))}
    </div>
  );
}
