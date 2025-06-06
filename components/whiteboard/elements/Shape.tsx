// import React from "react";
// import { Shape as ShapeType } from "@/types/canvas";

// interface ShapeProps {
//   shape: ShapeType;
//   isSelected?: boolean;
//   onClick?: () => void;
//   onDoubleClick?: () => void;
// }

// export default function Shape({
//   shape,
//   isSelected = false,
//   onClick,
//   onDoubleClick,
// }: ShapeProps) {
//   const handleClick = (e: React.MouseEvent) => {
//     e.stopPropagation(); // Prevent canvas click
//     onClick?.();
//   };

//   const handleDoubleClick = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     onDoubleClick?.();
//   };

//   // Selection outline style
//   const selectionStyle = isSelected
//     ? {
//         stroke: "#007AFF",
//         strokeWidth: 2,
//         strokeDasharray: "4,4",
//         fill: "none",
//       }
//     : {};

//   switch (shape.type) {
//     case "rectangle":
//       return (
//         <g>
//           <rect
//             x={shape.x}
//             y={shape.y}
//             width={shape.width}
//             height={shape.height}
//             fill={shape.fill || "transparent"}
//             stroke={shape.stroke || "black"}
//             strokeWidth={shape.strokeWidth || 2}
//             onClick={handleClick}
//             onDoubleClick={handleDoubleClick}
//             style={{ cursor: "pointer" }}
//           />
//           {/* Selection outline */}
//           {isSelected && (
//             <rect
//               x={shape.x - 2}
//               y={shape.y - 2}
//               width={shape.width + 4}
//               height={shape.height + 4}
//               {...selectionStyle}
//               pointerEvents="none"
//             />
//           )}
//           {/* Selection handles */}
//           {isSelected && (
//             <>
//               {/* Top-left handle */}
//               <circle
//                 cx={shape.x}
//                 cy={shape.y}
//                 r={4}
//                 fill="#007AFF"
//                 stroke="white"
//                 strokeWidth={1}
//                 style={{ cursor: "nw-resize" }}
//               />
//               {/* Top-right handle */}
//               <circle
//                 cx={shape.x + shape.width}
//                 cy={shape.y}
//                 r={4}
//                 fill="#007AFF"
//                 stroke="white"
//                 strokeWidth={1}
//                 style={{ cursor: "ne-resize" }}
//               />
//               {/* Bottom-left handle */}
//               <circle
//                 cx={shape.x}
//                 cy={shape.y + shape.height}
//                 r={4}
//                 fill="#007AFF"
//                 stroke="white"
//                 strokeWidth={1}
//                 style={{ cursor: "sw-resize" }}
//               />
//               {/* Bottom-right handle */}
//               <circle
//                 cx={shape.x + shape.width}
//                 cy={shape.y + shape.height}
//                 r={4}
//                 fill="#007AFF"
//                 stroke="white"
//                 strokeWidth={1}
//                 style={{ cursor: "se-resize" }}
//               />
//             </>
//           )}
//         </g>
//       );

//     case "circle":
//       return (
//         <g>
//           <circle
//             cx={shape.cx}
//             cy={shape.cy}
//             r={shape.r}
//             fill={shape.fill || "transparent"}
//             stroke={shape.stroke || "black"}
//             strokeWidth={shape.strokeWidth || 2}
//             onClick={handleClick}
//             onDoubleClick={handleDoubleClick}
//             style={{ cursor: "pointer" }}
//           />
//           {/* Selection outline */}
//           {isSelected && (
//             <circle
//               cx={shape.cx}
//               cy={shape.cy}
//               r={shape.r + 2}
//               {...selectionStyle}
//               pointerEvents="none"
//             />
//           )}
//           {/* Selection handles */}
//           {isSelected && (
//             <>
//               {/* Top handle */}
//               <circle
//                 cx={shape.cx}
//                 cy={shape.cy - shape.r}
//                 r={4}
//                 fill="#007AFF"
//                 stroke="white"
//                 strokeWidth={1}
//                 style={{ cursor: "n-resize" }}
//               />
//               {/* Right handle */}
//               <circle
//                 cx={shape.cx + shape.r}
//                 cy={shape.cy}
//                 r={4}
//                 fill="#007AFF"
//                 stroke="white"
//                 strokeWidth={1}
//                 style={{ cursor: "e-resize" }}
//               />
//               {/* Bottom handle */}
//               <circle
//                 cx={shape.cx}
//                 cy={shape.cy + shape.r}
//                 r={4}
//                 fill="#007AFF"
//                 stroke="white"
//                 strokeWidth={1}
//                 style={{ cursor: "s-resize" }}
//               />
//               {/* Left handle */}
//               <circle
//                 cx={shape.cx - shape.r}
//                 cy={shape.cy}
//                 r={4}
//                 fill="#007AFF"
//                 stroke="white"
//                 strokeWidth={1}
//                 style={{ cursor: "w-resize" }}
//               />
//             </>
//           )}
//         </g>
//       );

//     case "text":
//       return (
//         <g>
//           <text
//             x={shape.x}
//             y={shape.y}
//             fontSize={shape.fontSize}
//             fill={shape.fill || "black"}
//             stroke={shape.stroke}
//             strokeWidth={shape.strokeWidth}
//             onClick={handleClick}
//             onDoubleClick={handleDoubleClick}
//             style={{
//               cursor: "pointer",
//               userSelect: "none",
//               fontFamily: "Arial, sans-serif",
//             }}
//           >
//             {shape.content}
//           </text>
//           {/* Selection outline for text */}
//           {isSelected && (
//             <>
//               {/* Text background highlight */}
//               <rect
//                 x={shape.x - 4}
//                 y={shape.y - shape.fontSize}
//                 width={shape.content.length * (shape.fontSize * 0.6) + 8}
//                 height={shape.fontSize + 8}
//                 fill="rgba(0, 122, 255, 0.1)"
//                 stroke="#007AFF"
//                 strokeWidth={1}
//                 strokeDasharray="2,2"
//                 pointerEvents="none"
//               />
//               {/* Corner handles for text */}
//               <circle
//                 cx={shape.x}
//                 cy={shape.y - shape.fontSize}
//                 r={3}
//                 fill="#007AFF"
//                 stroke="white"
//                 strokeWidth={1}
//                 style={{ cursor: "move" }}
//               />
//             </>
//           )}
//         </g>
//       );

//     default:
//       return null;
//   }
// }
import React from "react";
import { Shape as ShapeType } from "@/types/canvas";

interface ShapeProps {
  shape: ShapeType;
  isSelected?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

export default function Shape({
  shape,
  isSelected = false,
  onClick,
  onDoubleClick,
}: ShapeProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick?.();
  };

  const selectionOutline = {
    stroke: "#007AFF",
    strokeWidth: 1.5,
    strokeDasharray: "4 2",
    fill: "none",
    pointerEvents: "none" as const,
  };

  switch (shape.type) {
    case "rectangle":
      return (
        <g>
          {/* Main rectangle */}
          <rect
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            fill={shape.fill || "transparent"}
            stroke={shape.stroke || "black"}
            strokeWidth={shape.strokeWidth || 2}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            style={{ cursor: "pointer" }}
          />
          {/* Selection outline */}
          {isSelected && (
            <rect
              x={shape.x - 2}
              y={shape.y - 2}
              width={shape.width + 4}
              height={shape.height + 4}
              {...selectionOutline}
            />
          )}
        </g>
      );

    case "circle":
      return (
        <g>
          {/* Main circle */}
          <circle
            cx={shape.cx}
            cy={shape.cy}
            r={shape.r}
            fill={shape.fill || "transparent"}
            stroke={shape.stroke || "black"}
            strokeWidth={shape.strokeWidth || 2}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            style={{ cursor: "pointer" }}
          />
          {/* Selection outline */}
          {isSelected && (
            <circle
              cx={shape.cx}
              cy={shape.cy}
              r={shape.r + 3}
              {...selectionOutline}
            />
          )}
        </g>
      );

    case "text":
      const approxWidth = shape.content.length * (shape.fontSize * 0.6);
      return (
        <g>
          {/* Main text */}
          <text
            x={shape.x}
            y={shape.y}
            fontSize={shape.fontSize}
            fill={shape.fill || "black"}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            style={{
              cursor: "pointer",
              userSelect: "none",
              fontFamily: "Arial, sans-serif",
            }}
          >
            {shape.content}
          </text>
          {/* Selection outline */}
          {isSelected && (
            <rect
              x={shape.x - 4}
              y={shape.y - shape.fontSize}
              width={approxWidth + 8}
              height={shape.fontSize + 8}
              {...selectionOutline}
            />
          )}
        </g>
      );

    default:
      return null;
  }
}
