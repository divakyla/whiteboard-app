// "use client";

// import React, { useState, useEffect, useCallback } from "react";
// import { useUIStore } from "@/store/uiStore";
// import { Rectangle, Circle, TextShape } from "@/types/canvas";
// import { useCanvasStore } from "@/store/canvasStore";
// import Shape from "@/components/whiteboard/elements/Shape";

// type Point = { x: number; y: number };
// type CanvasShape = Rectangle | Circle | TextShape;

// interface CanvasProps {
//   boardId: string;
// }

// export default function Canvas({ boardId }: CanvasProps) {
//   const activeTool = useUIStore((state) => state.activeTool);
//   const [isDrawing, setIsDrawing] = useState(false);
//   const [startPoint, setStartPoint] = useState<Point | null>(null);
//   const [currentShape, setCurrentShape] = useState<CanvasShape | null>(null);
//   const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

//   // Text input state
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

//   const saveShape = async (shape: CanvasShape) => {
//     try {
//       await fetch("/api/shapes", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ boardId, shape }),
//       });
//       console.log("Shape berhasil disimpan:", shape);
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
//       console.log("Shapes dari server:", data);
//       setShapes(data);
//     } catch {
//       setShapes([]);
//     }
//   }, [boardId, setShapes]);

//   useEffect(() => {
//     fetchShapes();
//   }, [fetchShapes]);

//   const handleTextInput = async (value: string, position: Point) => {
//     if (!value.trim()) return;

//     const newTextShape: TextShape = {
//       id: crypto.randomUUID(),
//       type: "text",
//       x: position.x,
//       y: position.y + 20,
//       content: value.trim(),
//       fontSize: 16,
//       fill: "black",
//     };

//     addShape(newTextShape);
//     await saveShape(newTextShape);
//   };

//   const handleTextSubmit = async () => {
//     if (textInput && textInput.value.trim()) {
//       await handleTextInput(textInput.value, {
//         x: textInput.x,
//         y: textInput.y,
//       });
//     }
//     setTextInput(null);
//   };

//   const handleTextCancel = () => {
//     setTextInput(null);
//   };

//   const onMouseDown = (e: React.MouseEvent) => {
//     // Jangan handle mouse down jika sedang mengetik
//     if (textInput) return;

//     const { x, y } = getCoordinates(e);

//     // Handle text tool
//     if (activeTool === "text") {
//       e.preventDefault();
//       e.stopPropagation();
//       setTextInput({ x, y, value: "" });
//       return;
//     }

//     // Handle drawing tools
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
//     }
//   };

//   const onMouseMove = (e: React.MouseEvent) => {
//     if (!isDrawing || !startPoint || !currentShape || textInput) return;

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
//     if (textInput) return; // Don't handle mouse up during text input

//     if (isDrawing && currentShape) {
//       // Only save if shape has meaningful size
//       if (
//         currentShape.type === "rectangle" &&
//         (Math.abs(currentShape.width) > 5 || Math.abs(currentShape.height) > 5)
//       ) {
//         addShape(currentShape);
//         await saveShape(currentShape);
//       } else if (currentShape.type === "circle" && currentShape.r > 5) {
//         addShape(currentShape);
//         await saveShape(currentShape);
//       }

//       setCurrentShape(null);
//       setStartPoint(null);
//       setIsDrawing(false);
//     }
//   };

//   return (
//     <div className="relative w-full h-full pointer-events-auto">
//       {/* Text Input Overlay */}
//       {textInput && (
//         <div
//           className="absolute z-50"
//           style={{
//             left: textInput.x,
//             top: textInput.y - 25, // Offset ke atas agar tidak menutupi area click
//             pointerEvents: "auto",
//           }}
//           onClick={(e) => e.stopPropagation()} // Prevent canvas click
//         >
//           <input
//             autoFocus
//             type="text"
//             value={textInput.value}
//             onChange={(e) =>
//               setTextInput({ ...textInput, value: e.target.value })
//             }
//             onBlur={handleTextSubmit}
//             onKeyDown={(e) => {
//               e.stopPropagation(); // Prevent event bubbling
//               if (e.key === "Enter") {
//                 e.preventDefault();
//                 handleTextSubmit();
//               } else if (e.key === "Escape") {
//                 e.preventDefault();
//                 handleTextCancel();
//               }
//             }}
//             className="px-2 py-1 text-base border border-gray-300 rounded shadow-lg bg-white min-w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
//             placeholder="Enter text..."
//           />
//         </div>
//       )}

//       {/* Background overlay untuk mencegah interaksi saat text input aktif */}
//       {textInput && (
//         <div
//           className="absolute inset-0 z-40"
//           onClick={handleTextSubmit}
//           style={{ background: "transparent" }}
//         />
//       )}

//       <svg
//         className="w-full h-full border border-gray-300"
//         onMouseDown={onMouseDown}
//         onMouseMove={onMouseMove}
//         onMouseUp={onMouseUp}
//         style={{
//           zIndex: textInput ? 30 : 0,
//           pointerEvents: textInput ? "none" : "auto", // Disable SVG events during text input
//         }}
//       >
//         {/* Render saved shapes */}
//         {shapes.map((shape) => (
//           <Shape
//             key={shape.id}
//             shape={shape}
//             isSelected={shape.id === selectedShapeId}
//             onClick={() => !textInput && setSelectedShapeId(shape.id)}
//           />
//         ))}

//         {/* Render current drawing shape (preview) */}
//         {currentShape && !textInput && (
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

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useUIStore } from "@/store/uiStore";
import { Rectangle, Circle, TextShape } from "@/types/canvas";
import { useCanvasStore } from "@/store/canvasStore";
import Shape from "@/components/whiteboard/elements/Shape";
import { io, Socket } from "socket.io-client";
import Cursor from "@/components/whiteboard/Cursor";

type Point = { x: number; y: number };
type CanvasShape = Rectangle | Circle | TextShape;

// Types for collaboration
interface UserCursor {
  userId: string;
  username: string;
  x: number;
  y: number;
  color: string;
  lastSeen: number;
}

// interface CollaborativeEvent {
//   type: 'cursor-move' | 'shape-add' | 'shape-update' | 'shape-remove' | 'user-join' | 'user-leave';
//   userId: string;
//   username: string;
//   data: any;
//   boardId: string;
// }

interface CanvasProps {
  boardId: string;
  currentUser: {
    id: string;
    username: string;
    email?: string;
  };
}

// Generate random color for user cursor
const generateUserColor = (userId: string): string => {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
    "#F8C471",
    "#82E0AA",
  ];
  const hash = userId.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
  return colors[Math.abs(hash) % colors.length];
};

export default function Canvas({ boardId, currentUser }: CanvasProps) {
  const activeTool = useUIStore((state) => state.activeTool);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentShape, setCurrentShape] = useState<CanvasShape | null>(null);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

  // Collaborative states
  const [socket, setSocket] = useState<Socket | null>(null);
  const [otherUsers, setOtherUsers] = useState<Map<string, UserCursor>>(
    new Map()
  );
  const [isConnected, setIsConnected] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const userColor = useRef(generateUserColor(currentUser.id));
  const [shapePreviews, setShapePreviews] = useState<Map<string, CanvasShape>>(
    new Map()
  );

  // Text input state
  const [textInput, setTextInput] = useState<{
    x: number;
    y: number;
    value: string;
  } | null>(null);

  const shapes = useCanvasStore((state) => state.shapes);
  const addShape = useCanvasStore((state) => state.addShape);
  const setShapes = useCanvasStore((state) => state.setShapes);
  const updateShape = useCanvasStore((state) => state.updateShape);
  const removeShape = useCanvasStore((state) => state.removeShape);

  useEffect(() => {
    const loadShapes = async () => {
      try {
        const res = await fetch(`/api/shapes?boardId=${boardId}`);
        if (!res.ok) throw new Error("Gagal load shapes");

        const loadedShapes = await res.json();
        setShapes(loadedShapes);
      } catch (err) {
        console.error("❌ Gagal load shapes:", err);
      }
    };

    loadShapes();
  }, [boardId, setShapes]);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!boardId || !currentUser?.id || !currentUser?.username) return;

    const initSocket = async () => {
      try {
        // Wake up the Socket.IO server (Next.js App Router)
        const res = await fetch("/api/socket", { method: "POST" });
        const text = await res.text();
        console.log("🛰️ Socket POST:", text);

        const socketInstance = io("http://localhost:3001", {
          path: "/api/socket",
          transports: ["websocket"],
          timeout: 10000,
        });

        // Join board
        socketInstance.on("connect", () => {
          console.log("✅ Connected to collaboration server");
          setIsConnected(true);

          socketInstance.emit("join-board", {
            boardId,
            userId: currentUser.id,
            username: currentUser.username,
          });
        });

        socketInstance.on("connect_error", (err) => {
          console.error("❌ Socket connection error:", err.message);
        });

        socketInstance.on("disconnect", () => {
          console.warn("🔌 Disconnected from collaboration server");
          setIsConnected(false);
        });

        // 👥 User events
        socketInstance.on("user-join", ({ username }) => {
          console.log(`👋 ${username} joined the board`);
        });

        socketInstance.on("user-leave", ({ userId, username }) => {
          console.log(`👋 ${username} left the board`);
          setOtherUsers((prev) => {
            const map = new Map(prev);
            map.delete(userId);
            return map;
          });
        });

        // 🖱️ Cursor movement
        socketInstance.on("cursor-move", (data) => {
          if (data.userId !== currentUser.id) {
            setOtherUsers((prev) => {
              const map = new Map(prev);
              map.set(data.userId, { ...data, lastSeen: Date.now() });
              return map;
            });
          }
        });

        // 🧩 Shape events
        socketInstance.on("shape-add", ({ shape, userId }) => {
          if (userId !== currentUser.id) {
            addShape(shape);
          }
        });

        socketInstance.on("shape-update", ({ id, updates, userId }) => {
          if (userId !== currentUser.id) {
            updateShape(id, updates);
          }
        });

        socketInstance.on("shape-remove", ({ id, userId }) => {
          if (userId !== currentUser.id) {
            removeShape(id);
          }
        });

        socketInstance.on("shape-preview", ({ userId, shape }) => {
          if (userId !== currentUser.id) {
            setShapePreviews((prev) => {
              const map = new Map(prev);
              map.set(userId, shape);
              return map;
            });
          }
        });

        // Simpan socket
        setSocket(socketInstance);

        // Bersihkan koneksi saat unmount
        return () => {
          console.log("🧹 Disconnecting socket...");
          socketInstance.disconnect();
        };
      } catch (err) {
        console.error("❌ Failed to initialize socket:", err);
      }
    };

    initSocket();
  }, [
    boardId,
    currentUser.id,
    currentUser.username,
    addShape,
    updateShape,
    removeShape,
  ]);

  // Clean up inactive users
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setOtherUsers((prevUsers) => {
        const newMap = new Map();
        prevUsers.forEach((user, userId) => {
          if (now - user.lastSeen < 10000) {
            // Keep users active for 10 seconds
            newMap.set(userId, user);
          }
        });
        return newMap;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getCoordinates = (e: React.MouseEvent): Point => {
    const svg = e.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const getCanvasCoordinates = (e: React.MouseEvent): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Emit cursor movement
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (socket && isConnected) {
        const { x, y } = getCanvasCoordinates(e);

        socket.emit("cursor-move", {
          boardId,
          userId: currentUser.id,
          username: currentUser.username,
          x,
          y,
          color: userColor.current,
        });
      }
    },
    [socket, isConnected, boardId, currentUser]
  );
  console.log("📍 Other users:", Array.from(otherUsers.entries()));

  const saveShape = async (shape: CanvasShape, boardId: string) => {
    try {
      console.log("🔵 Board ID:", boardId);
      console.log("📦 Shape to send:", JSON.stringify(shape, null, 2));

      const response = await fetch("/api/shapes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId, shape }),
      });

      if (!response.ok) {
        let errorText = "Unknown error";
        try {
          const errorData = await response.json();
          errorText = errorData?.message || errorText;
        } catch {
          console.error("⚠️ Gagal parse error JSON");
        }
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const savedShape = await response.json();
      console.log("✅ Shape berhasil disimpan:", savedShape);
      return savedShape;
    } catch (err) {
      console.error("❌ Gagal menyimpan shape:", err);
      throw err;
    }
  };

  // const saveShape = async (shape: CanvasShape) => {
  //   try {
  //     await fetch("/api/shapes", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ boardId, shape }),
  //     });

  //     // Emit to other users
  //     if (socket && isConnected) {
  //       socket.emit("shape-add", {
  //         boardId,
  //         shape,
  //         userId: currentUser.id,
  //       });
  //     }

  //     console.log("Shape berhasil disimpan:", shape);
  //   } catch (err) {
  //     console.error("Gagal menyimpan shape:", err);
  //   }
  // };

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
      console.log("Shapes dari server:", data);
      setShapes(data);
    } catch {
      setShapes([]);
    }
  }, [boardId, setShapes]);

  useEffect(() => {
    fetchShapes();
  }, [fetchShapes]);

  const handleTextInput = async (value: string, position: Point) => {
    if (!value.trim()) return;

    const newTextShape: TextShape = {
      id: crypto.randomUUID(),
      type: "text",
      x: position.x,
      y: position.y + 20,
      content: value.trim(),
      fontSize: 16,
      fill: "black",
    };

    addShape(newTextShape);
    await saveShape(newTextShape, boardId);
  };

  const handleTextSubmit = async () => {
    if (textInput && textInput.value.trim()) {
      await handleTextInput(textInput.value, {
        x: textInput.x,
        y: textInput.y,
      });
    }
    setTextInput(null);
  };

  const handleTextCancel = () => {
    setTextInput(null);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (textInput) return;

    const { x, y } = getCoordinates(e);

    if (activeTool === "text") {
      e.preventDefault();
      e.stopPropagation();
      setTextInput({ x, y, value: "" });
      return;
    }

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
    }
  };

  const onMouseMoveCanvas = (e: React.MouseEvent) => {
    handleMouseMove(e);

    if (!isDrawing || !startPoint || !currentShape || textInput) return;

    const { x, y } = getCoordinates(e);

    // const newShape = { ...currentShape };

    if (currentShape.type === "rectangle") {
      const newShape = {
        ...currentShape,
        width: x - startPoint.x,
        height: y - startPoint.y,
      };
      setCurrentShape(newShape);

      if (socket && isConnected) {
        socket.emit("shape-preview", {
          boardId,
          userId: currentUser.id,
          shape: newShape,
        });
      }
    } else if (currentShape.type === "circle") {
      const dx = x - startPoint.x;
      const dy = y - startPoint.y;
      const newShape = {
        ...currentShape,
        r: Math.sqrt(dx * dx + dy * dy),
      };
      setCurrentShape(newShape);

      if (socket && isConnected) {
        socket.emit("shape-preview", {
          boardId,
          userId: currentUser.id,
          shape: newShape,
        });
      }
    }
  };

  const onMouseUp = async () => {
    if (textInput) return;

    if (isDrawing && currentShape) {
      let shouldSave = false;

      if (
        currentShape.type === "rectangle" &&
        (Math.abs(currentShape.width) > 5 || Math.abs(currentShape.height) > 5)
      ) {
        shouldSave = true;
      } else if (currentShape.type === "circle" && currentShape.r > 5) {
        shouldSave = true;
      }

      if (shouldSave) {
        try {
          const saved = await saveShape(currentShape, boardId);
          addShape(saved);

          if (socket && isConnected) {
            socket.emit("shape-add", {
              boardId,
              shape: saved,
              userId: currentUser.id,
            });
          }
        } catch (err) {
          console.error("❌ Gagal simpan shape:", err);
        }
      }

      // 🔥 Bersihkan preview saat mouse dilepas
      setShapePreviews((prev) => {
        const newMap = new Map(prev);
        newMap.delete(currentUser.id); // hapus preview user ini
        return newMap;
      });

      // Reset semua state terkait
      setCurrentShape(null);
      setStartPoint(null);
      setIsDrawing(false);
    }
  };

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full pointer-events-auto"
      onMouseMove={handleMouseMove}
    >
      {/* Connection status */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-sm text-gray-600">
          {isConnected ? "Connected" : "Disconnected"}
        </span>
        {otherUsers.size > 0 && (
          <span className="text-sm text-gray-500">
            +{otherUsers.size} user{otherUsers.size > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Other users' cursors */}
      {Array.from(otherUsers.entries()).map(([userId, user]) => (
        <Cursor
          key={userId}
          x={user.x}
          y={user.y}
          username={user.username}
          color={user.color}
        />
      ))}

      {/* Text Input Overlay */}
      {textInput && (
        <div
          className="absolute z-50"
          style={{
            left: textInput.x,
            top: textInput.y - 25,
            pointerEvents: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            autoFocus
            type="text"
            value={textInput.value}
            onChange={(e) =>
              setTextInput({ ...textInput, value: e.target.value })
            }
            onBlur={handleTextSubmit}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") {
                e.preventDefault();
                handleTextSubmit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                handleTextCancel();
              }
            }}
            className="px-2 py-1 text-base border border-gray-300 rounded shadow-lg bg-white min-w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter text..."
          />
        </div>
      )}

      {/* Background overlay untuk mencegah interaksi saat text input aktif */}
      {textInput && (
        <div
          className="absolute inset-0 z-40"
          onClick={handleTextSubmit}
          style={{ background: "transparent" }}
        />
      )}

      <svg
        className="w-full h-full border border-gray-300"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMoveCanvas}
        onMouseUp={onMouseUp}
        style={{
          zIndex: textInput ? 30 : 0,
          pointerEvents: textInput ? "none" : "auto",
        }}
      >
        {/* Render saved shapes */}
        {shapes.map((shape) => (
          <Shape
            key={`shape-${shape.id}`}
            shape={shape}
            isSelected={shape.id === selectedShapeId}
            onClick={() => !textInput && setSelectedShapeId(shape.id)}
          />
        ))}

        {/* Render preview shapes from other users */}
        {Array.from(shapePreviews.values()).map((shape) => {
          if (shape.type === "rectangle") {
            return (
              <rect
                key={`preview-rect-${shape.id}`}
                x={shape.x}
                y={shape.y}
                width={shape.width}
                height={shape.height}
                stroke="gray"
                fill="transparent"
                strokeDasharray="4 2"
              />
            );
          } else if (shape.type === "circle") {
            return (
              <circle
                key={`preview-circle-${shape.id}`}
                cx={shape.cx}
                cy={shape.cy}
                r={shape.r}
                stroke="gray"
                fill="transparent"
                strokeDasharray="4 2"
              />
            );
          }
          return null;
        })}

        {/* Render current drawing shape */}
        {currentShape && !textInput && (
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

      {/* {Array.from(shapePreviews.values()).map((shape, index) => (
        <Shape key={`preview-${index}`} shape={shape} isSelected={false} />
      ))} */}
    </div>
  );
}
