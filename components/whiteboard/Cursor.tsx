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
      className="absolute pointer-events-none z-40 transition-all duration-75"
      style={{ left: x, top: y, transform: "translate(-2px, -2px)" }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        className="drop-shadow-sm"
      >
        <path
          d="M2 2L18 8L8 12L2 18L2 2Z"
          fill={color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>
      <div
        className="absolute left-5 top-0 px-2 py-1 text-xs text-white rounded-md whitespace-nowrap"
        style={{ backgroundColor: color }}
      >
        {username}
      </div>
    </div>
  );
}
