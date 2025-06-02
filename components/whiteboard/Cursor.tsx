// components/whiteboard/Cursor.tsx
import React from "react";

interface CursorProps {
  x: number;
  y: number;
  username: string;
  color: string;
}

export default function Cursor({ x, y, username, color }: CursorProps) {
  return (
    <div
      className="absolute z-50 transition-all duration-75 pointer-events-none"
      style={{
        transform: `translate(${x}px, ${y}px)`,
      }}
    >
      <div className="flex flex-col items-center">
        <div
          className="w-4 h-4 rounded-full border-2"
          style={{ backgroundColor: color, borderColor: "#ffffff" }}
        ></div>
        <span
          className="text-xs font-medium mt-1 px-1 rounded"
          style={{ backgroundColor: color, color: "#fff" }}
        >
          {username}
        </span>
      </div>
    </div>
  );
}
