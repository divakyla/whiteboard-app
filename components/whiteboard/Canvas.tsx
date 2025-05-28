// "use client";

// import React, { useState, useEffect, useCallback } from "react";
// import { useUIStore } from "@/store/uiStore";
// import { Rectangle, Circle, TextShape } from "@/types/canvas";
// import { useCanvasStore } from "@/store/canvasStore";

// type Point = { x: number; y: number };
// type Shape = Rectangle | Circle | TextShape;

// interface CanvasProps {
//   boardId: string;
// }

// export default function Canvas({ boardId }: CanvasProps) {
//   const activeTool = useUIStore((state) => state.activeTool);
//   const [isDrawing, setIsDrawing] = useState(false);
//   const [startPoint, setStartPoint] = useState<Point | null>(null);
//   const [currentShape, setCurrentShape] = useState<Shape | null>(null);
//   const [textInput, setTextInput] = useState<{
//     x: number;
//     y: number;
//     value: string;
//   } | null>(null);

//   const shapes = useCanvasStore((state) => state.shapes);
//   const addShape = useCanvasStore((state) => state.addShape);
//   const setShapes = useCanvasStore((state) => state.setShapes);

//   const getCoordinates = (e: React.MouseEvent): Point => {
//     const svg = e.currentTarget as SVGSVGElement;
//     const rect = svg.getBoundingClientRect();
//     return {
//       x: e.clientX - rect.left,
//       y: e.clientY - rect.top,
//     };
//   };

//   const saveShape = async (shape: Shape) => {
//     try {
//       await fetch("/api/shapes", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ boardId, shape }),
//       });
//       console.log("Kirim shape ke server:", { boardId, shape });
//     } catch (err) {
//       console.error("Gagal menyimpan shape:", err);
//     }
//   };

//   const fetchShapes = useCallback(async () => {
//     try {
//       const res = await fetch(`/api/shapes?boardId=${boardId}`);
//       if (!res.ok) {
//         setShapes([]);
//         return;
//       }
//       const text = await res.text();
//       if (!text) {
//         setShapes([]);
//         return;
//       }
//       const data = JSON.parse(text);
//       setShapes(data);
//       // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     } catch (err) {
//       setShapes([]);
//     }
//   }, [boardId, setShapes]);

//   useEffect(() => {
//     fetchShapes();
//   }, [fetchShapes]);

//   const onMouseDown = (e: React.MouseEvent) => {
//     const { x, y } = getCoordinates(e);
//     setStartPoint({ x, y });

//     if (activeTool === "rectangle") {
//       setIsDrawing(true);
//       setCurrentShape({
//         id: crypto.randomUUID(),
//         type: "rectangle",
//         x,
//         y,
//         width: 0,
//         height: 0,
//         fill: "transparent",
//         stroke: "black",
//         strokeWidth: 2,
//       });
//     } else if (activeTool === "circle") {
//       setIsDrawing(true);
//       setCurrentShape({
//         id: crypto.randomUUID(),
//         type: "circle",
//         cx: x,
//         cy: y,
//         r: 0,
//         fill: "transparent",
//         stroke: "black",
//         strokeWidth: 2,
//       });
//     } else if (activeTool === "text") {
//       setTextInput({ x, y, value: "" });
//     }
//   };

//   const onMouseMove = (e: React.MouseEvent) => {
//     if (!isDrawing || !startPoint || !currentShape) return;

//     const { x, y } = getCoordinates(e);

//     if (currentShape.type === "rectangle") {
//       setCurrentShape({
//         ...currentShape,
//         width: x - startPoint.x,
//         height: y - startPoint.y,
//       });
//     } else if (currentShape.type === "circle") {
//       const dx = x - startPoint.x;
//       const dy = y - startPoint.y;
//       setCurrentShape({
//         ...currentShape,
//         r: Math.sqrt(dx * dx + dy * dy),
//       });
//     }
//   };

//   const onMouseUp = async () => {
//     if (isDrawing && currentShape) {
//       addShape(currentShape);
//       await saveShape(currentShape);
//       setCurrentShape(null);
//       setStartPoint(null);
//       setIsDrawing(false);
//     }
//   };

//   return (
//     <div className="relative w-full h-full pointer-events-auto">
//       {textInput && (
//         <input
//           autoFocus
//           type="text"
//           value={textInput.value}
//           onChange={(e) =>
//             setTextInput({ ...textInput, value: e.target.value })
//           }
//           onBlur={() => {
//             const trimmed = textInput.value.trim();
//             if (trimmed !== "") {
//               console.log("Menambahkan text:", trimmed);
//               const newTextShape: TextShape = {
//                 id: crypto.randomUUID(),
//                 type: "text",
//                 x: textInput.x,
//                 y: textInput.y,
//                 text: trimmed,
//                 fontSize: 16,
//                 fill: "black",
//               };
//               addShape(newTextShape);
//               saveShape(newTextShape);
//             }
//             setTextInput(null);
//           }}
//           onKeyDown={(e) => {
//             if (e.key === "Enter") {
//               e.currentTarget.blur(); // Trigger onBlur
//             }
//           }}
//           style={{
//             position: "absolute",
//             top: textInput.y,
//             left: textInput.x,
//             transform: "translate(-2px, -16px)",
//             fontSize: "16px",
//             padding: "0",
//             border: "1px solid #ccc",
//             background: "white",
//             zIndex: 50, // Naikkan zIndex
//           }}
//         />
//       )}

//       <svg
//         className="w-full h-full border border-gray-300"
//         onMouseDown={onMouseDown}
//         onMouseMove={onMouseMove}
//         onMouseUp={onMouseUp}
//         style={{ zIndex: 0 }} // Pastikan SVG tidak menutupi <input>
//       >
//         {shapes.map((shape) => {
//           switch (shape.type) {
//             case "rectangle":
//               return (
//                 <rect
//                   key={shape.id}
//                   x={shape.x}
//                   y={shape.y}
//                   width={shape.width}
//                   height={shape.height}
//                   stroke={shape.stroke || "black"}
//                   fill={shape.fill || "transparent"}
//                   strokeWidth={shape.strokeWidth || 2}
//                 />
//               );
//             case "circle":
//               return (
//                 <circle
//                   key={shape.id}
//                   cx={shape.cx}
//                   cy={shape.cy}
//                   r={shape.r}
//                   stroke={shape.stroke || "black"}
//                   fill={shape.fill || "transparent"}
//                   strokeWidth={shape.strokeWidth || 2}
//                 />
//               );
//             case "text":
//               return (
//                 <text
//                   key={shape.id}
//                   x={shape.x}
//                   y={shape.y}
//                   dy="-0.25em"
//                   fontSize={shape.fontSize || 16}
//                   fill={shape.fill || "black"}
//                   style={{ userSelect: "none", pointerEvents: "none" }}
//                 >
//                   {shape.text}
//                 </text>
//               );
//             default:
//               return null;
//           }
//         })}

//         {currentShape && (
//           <>
//             {currentShape.type === "rectangle" && (
//               <rect
//                 x={currentShape.x}
//                 y={currentShape.y}
//                 width={currentShape.width}
//                 height={currentShape.height}
//                 stroke="blue"
//                 strokeDasharray="5,5"
//                 fill="transparent"
//                 strokeWidth={2}
//               />
//             )}
//             {currentShape.type === "circle" && (
//               <circle
//                 cx={currentShape.cx}
//                 cy={currentShape.cy}
//                 r={currentShape.r}
//                 stroke="blue"
//                 strokeDasharray="5,5"
//                 fill="transparent"
//                 strokeWidth={2}
//               />
//             )}
//           </>
//         )}
//       </svg>
//     </div>
//   );
// }

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUIStore } from "@/store/uiStore";
import { Rectangle, Circle, TextShape } from "@/types/canvas";
import { useCanvasStore } from "@/store/canvasStore";
import Shape from "@/components/whiteboard/elements/Shape";

type Point = { x: number; y: number };
type Shape = Rectangle | Circle | TextShape;

interface CanvasProps {
  boardId: string;
}

export default function Canvas({ boardId }: CanvasProps) {
  const activeTool = useUIStore((state) => state.activeTool);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [textInput, setTextInput] = useState<{
    id: "";
    type: "";
    x: number;
    y: number;
    value: string;
  } | null>(null);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    shapeId: string;
  } | null>(null);

  const shapes = useCanvasStore((state) => state.shapes);
  const addShape = useCanvasStore((state) => state.addShape);
  const setShapes = useCanvasStore((state) => state.setShapes);
  const [textValue, setTextValue] = useState("");
  const [textPosition, setTextPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const getCoordinates = (e: React.MouseEvent): Point => {
    const svg = e.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const saveShape = async (shape: Shape) => {
    try {
      await fetch("/api/shapes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId, shape }),
      });
      console.log("Shape berhasil disimpan:", shape);
    } catch (err) {
      console.error("Gagal menyimpan shape:", err);
    }
  };

  const handleDeleteShape = async () => {
    if (!selectedShapeId) return;

    try {
      await fetch(`/api/shapes?id=${selectedShapeId}`, {
        method: "DELETE",
      });

      setShapes((prev) => prev.filter((s) => s.id !== selectedShapeId));
      setSelectedShapeId(null);
    } catch (error) {
      console.error("Failed to delete shape:", error);
    }
  };

  // Ketika user klik di canvas
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (activeTool === "text") {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setTextPosition({ x, y });
      setTextValue("");
      setIsTyping(true); // munculkan input
    }
  };

  const fetchShapes = useCallback(async () => {
    try {
      const res = await fetch(`/api/shapes?boardId=${boardId}`);
      if (!res.ok) {
        setShapes([]);
        return;
      }
      const text = await res.text();
      if (!text) {
        setShapes([]);
        return;
      }
      const data = JSON.parse(text);
      console.log("Shapes dari server:", fetchShapes);
      setShapes(data);
    } catch {
      setShapes([]);
    }
  }, [boardId, setShapes]);

  useEffect(() => {
    fetchShapes();
  }, [fetchShapes]);
  // console.log("Shapes dari server:", fetchShapes);

  const onMouseDown = (e: React.MouseEvent) => {
    const { x, y } = getCoordinates(e);
    setStartPoint({ x, y });

    if (activeTool === "rectangle") {
      setIsDrawing(true);
      setCurrentShape({
        id: crypto.randomUUID(),
        type: "rectangle",
        x,
        y,
        width: 0,
        height: 0,
        fill: "transparent",
        stroke: "black",
        strokeWidth: 2,
      });
    } else if (activeTool === "circle") {
      setIsDrawing(true);
      setCurrentShape({
        id: crypto.randomUUID(),
        type: "circle",
        cx: x,
        cy: y,
        r: 0,
        fill: "transparent",
        stroke: "black",
        strokeWidth: 2,
      });
    } else if (activeTool === "text") {
      setTextInput({ id: "", type: "", x, y, value: "" });
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !startPoint || !currentShape) return;

    const { x, y } = getCoordinates(e);

    if (currentShape.type === "rectangle") {
      setCurrentShape({
        ...currentShape,
        width: x - startPoint.x,
        height: y - startPoint.y,
      });
    } else if (currentShape.type === "circle") {
      const dx = x - startPoint.x;
      const dy = y - startPoint.y;
      setCurrentShape({
        ...currentShape,
        r: Math.sqrt(dx * dx + dy * dy),
      });
    }
  };

  const onMouseUp = async () => {
    if (isDrawing && currentShape) {
      addShape(currentShape);
      await saveShape(currentShape);
      setCurrentShape(null);
      setStartPoint(null);
      setIsDrawing(false);
    }
  };

  return (
    <div className="relative w-full h-full pointer-events-auto">
      {textInput && (
        <input
          autoFocus
          type="text"
          value={textInput.value}
          onChange={(e) =>
            setTextInput({ ...textInput, value: e.target.value })
          }
          onBlur={() => {
            if (textInput && textInput.value.trim() !== "") {
              const newTextShape: TextShape = {
                id: crypto.randomUUID(),
                type: "text",
                x: textInput.x,
                y: textInput.y,
                content: textInput.value.trim(),
                fontSize: 16,
                fill: "black",
              };
              addShape(newTextShape);
              saveShape(newTextShape);
            }
            setTextInput(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur(); // Trigger onBlur
            }
          }}
          style={{
            position: "absolute",
            top: textInput.y,
            left: textInput.x,
            transform: "translate(-2px, -16px)",
            fontSize: "16px",
            padding: "0",
            border: "1px solid #ccc",
            background: "white",
            zIndex: 50,
          }}
        />
      )}

      <svg
        className="w-full h-full border border-gray-300"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onClick={handleCanvasClick} // ← Tambahkan ini
        style={{ zIndex: 0 }}
      >
        {shapes.map((shape) => (
          <Shape
            key={shape.id}
            shape={shape}
            isSelected={shape.id === selectedShapeId}
            onClick={() => setSelectedShapeId(shape.id)}
          />
        ))}

        {/* {shapes.map((shape) => {
          switch (shape.type) {
            case "rectangle":
              return (
                <rect
                  key={shape.id}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  stroke={shape.stroke || "black"}
                  fill={shape.fill || "transparent"}
                  strokeWidth={shape.strokeWidth || 2}
                />
              );
            case "circle":
              return (
                <circle
                  key={shape.id}
                  cx={shape.cx}
                  cy={shape.cy}
                  r={shape.r}
                  stroke={shape.stroke || "black"}
                  fill={shape.fill || "transparent"}
                  strokeWidth={shape.strokeWidth || 2}
                />
              );
            case "text":
              return (
                <text
                  key={shape.id}
                  x={shape.x}
                  y={shape.y}
                  fontSize={shape.fontSize ?? 16}
                  fill={shape.fill ?? "black"}
                  // style={{ userSelect: "none", pointerEvents: "none" }}
                >
                  {shape.content}
                </text>
              );
            default:
              return null;
          }
        })} */}

        {isTyping && textPosition && (
          <input
            autoFocus
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (!textValue.trim()) return;

                const newTextShape: Shape = {
                  id: crypto.randomUUID(),
                  type: "text",
                  x: textPosition.x,
                  y: textPosition.y,
                  content: textValue,
                  fontSize: 24,
                  fill: "black",
                  // boardId,
                };

                addShape(newTextShape); // tambahkan ke store
                fetch("/api/shapes", {
                  method: "POST",
                  body: JSON.stringify({ boardId, shape: newTextShape }),
                });

                setIsTyping(false);
                setTextValue("");
                setTextPosition(null);
              }
            }}
            style={{
              position: "absolute",
              left: textPosition.x,
              top: textPosition.y,
              fontSize: "24px",
              border: "1px solid gray",
              background: "white",
            }}
          />
        )}

        {currentShape && (
          <>
            {currentShape.type === "rectangle" && (
              <rect
                x={currentShape.x}
                y={currentShape.y}
                width={currentShape.width}
                height={currentShape.height}
                stroke="blue"
                strokeDasharray="5,5"
                fill="transparent"
                strokeWidth={2}
              />
            )}
            {currentShape.type === "circle" && (
              <circle
                cx={currentShape.cx}
                cy={currentShape.cy}
                r={currentShape.r}
                stroke="blue"
                strokeDasharray="5,5"
                fill="transparent"
                strokeWidth={2}
              />
            )}
          </>
        )}
      </svg>
    </div>
  );
}
