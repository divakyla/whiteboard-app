import React from "react";
import { Rectangle, Circle, TextShape } from "@/types/canvas";

type ShapeProps = {
  shape: Rectangle | Circle | TextShape;
  isSelected: boolean;
  onClick: () => void;
};

export default function Shape({ shape, isSelected, onClick }: ShapeProps) {
  const strokeColor = isSelected ? "blue" : "black";
  const strokeWidth = isSelected ? 2 : 1;

  if (shape.type === "rectangle") {
    const rect = shape as Rectangle;
    function onRightClick(
      e: React.MouseEvent<SVGRectElement, MouseEvent>,
      id: string
    ) {
      // Example: Show a context menu or handle right-click logic
      // For now, just prevent default and log the id
      e.preventDefault();
      console.log("Right-clicked rectangle with id:", id);
    }

    return (
      <rect
        x={rect.x}
        y={rect.y}
        width={rect.width}
        height={rect.height}
        stroke={strokeColor}
        fill={rect.fill || "transparent"}
        strokeWidth={strokeWidth}
        onClick={onClick}
        onContextMenu={(e) => {
          e.preventDefault();
          onRightClick?.(e, shape.id);
        }}
      />
    );
  }

  if (shape.type === "circle") {
    const circle = shape as Circle;
    function onRightClick(
      e: React.MouseEvent<SVGCircleElement, MouseEvent>,
      id: string
    ) {
      // Example: Show a context menu or handle right-click logic
      // For now, just prevent default and log the id
      e.preventDefault();
      console.log("Right-clicked circle with id:", id);
    }

    return (
      <circle
        cx={circle.cx}
        cy={circle.cy}
        r={circle.r}
        stroke={strokeColor}
        fill={circle.fill || "transparent"}
        strokeWidth={strokeWidth}
        onClick={onClick}
        onContextMenu={(e) => {
          e.preventDefault();
          onRightClick?.(e, shape.id);
        }}
      />
    );
  }

  if (shape.type === "text") {
    const textShape = shape as TextShape;
    return (
      <text
        x={textShape.x}
        y={textShape.y}
        fontSize={textShape.fontSize ?? 16}
        fill={textShape.fill || "black"}
        onClick={onClick}
      >
        {textShape.content}
      </text>
    );
  }

  return null;
}
