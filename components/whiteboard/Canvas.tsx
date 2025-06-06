"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useUIStore } from "@/store/uiStore";
import { Rectangle, Circle, TextShape } from "@/types/canvas";
import { useCanvasStore } from "@/store/canvasStore";
import Shape from "@/components/whiteboard/elements/Shape";
import { io, Socket } from "socket.io-client";
import Cursor from "@/components/whiteboard/Cursor";
import { v4 as uuidv4 } from "uuid"; // ✅ Gunakan UUID unik untuk semua shape

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
  // const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

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
  const generateUniqueId = () => `${currentUser.id}-${uuidv4()}`;

  // Text input state
  const [textInput, setTextInput] = useState<{
    x: number;
    y: number;
    value: string;
  } | null>(null);

  const selectedShapeId = useCanvasStore((s) => s.selectedShapeId);
  const setSelectedShapeId = useCanvasStore((s) => s.setSelectedShapeId);

  const shapes = useCanvasStore((state) => state.shapes);
  const addShape = useCanvasStore((state) => state.addShape);
  const setShapes = useCanvasStore((state) => state.setShapes);
  const updateShape = useCanvasStore((state) => state.updateShape);
  const removeShape = useCanvasStore((state) => state.removeShape);
  const [isDragging, setIsDragging] = useState(false);
  const [draggingShapeId, setDraggingShapeId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const [selectionRect, setSelectionRect] = useState<null | {
    x: number;
    y: number;
    width: number;
    height: number;
  }>(null);
  const zoom = useCanvasStore((s) => s.zoom);
  const setZoom = useCanvasStore((s) => s.setZoom);

  // 🧼 Tambahkan validasi agar Shape ID tidak duplikat saat rendering
  const uniqueSavedShapes = useMemo(() => {
    const seen = new Set<string>();
    return shapes.filter((shape) => {
      const key = `${shape.type}-${shape.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [shapes]);

  useEffect(() => {
    const ids = uniqueSavedShapes.map((s) => `${s.type}-${s.id}`);
    const duplicates = ids.filter(
      (id: string, idx: number) => ids.indexOf(id) !== idx
    );
    if (duplicates.length > 0) {
      console.warn("❗ Duplicate saved shapes keys:", duplicates);
    }
  }, [uniqueSavedShapes]);

  useEffect(() => {
    const ids = Array.from(shapePreviews.values()).map(
      (s) => `${s.type}-${s.id}`
    );
    const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
    if (duplicates.length > 0) {
      console.warn("❗ Duplicate preview shape keys:", duplicates);
    }
  }, [shapePreviews]);

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

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return; // hanya zoom saat Ctrl ditekan

      e.preventDefault();

      const delta = -e.deltaY * 0.001;
      const newZoom = Math.min(2, Math.max(0.2, zoom + delta));

      setZoom(newZoom);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [zoom, setZoom]);

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
            setShapePreviews((prev) => {
              const map = new Map(prev);
              map.delete(userId); // ✅ hilangkan bayangan
              return map;
            });
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

  const deleteShape = useCallback(
    async (id: string) => {
      try {
        console.log("🧼 Menghapus shape dengan ID:", id);
        const res = await fetch(`/api/shapes/${id}`, { method: "DELETE" });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            `HTTP ${res.status}: ${data.message || "Failed to delete"}`
          );
        }

        removeShape(id);

        if (socket && isConnected) {
          socket.emit("shape-remove", { boardId, id, userId: currentUser.id });
        }

        await fetchShapes();
      } catch (err) {
        console.error("❌ Gagal hapus shape:", err);
      }
    },
    [removeShape, socket, isConnected, boardId, currentUser.id, fetchShapes]
  );

  useEffect(() => {
    useCanvasStore.setState({ deleteShape });
  }, [deleteShape]);

  useEffect(() => {
    fetchShapes();
  }, [fetchShapes]);

  const handleTextInput = async (value: string, position: Point) => {
    if (!value.trim()) return;

    const newTextShape: TextShape = {
      id: generateUniqueId(),
      type: "text",
      x: position.x,
      y: position.y + 20,
      content: value.trim(),
      fontSize: 16,
      fill: "black",
    };

    addShape(newTextShape);
    await saveShape(newTextShape, boardId);
    if (socket && isConnected) {
      socket.emit("shape-add", {
        boardId,
        shape: newTextShape,
        userId: currentUser.id,
      });
    }
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

  // 🧹 Tangani tombol delete
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Delete" && selectedShapeId) {
        deleteShape(selectedShapeId);
        setSelectedShapeId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedShapeId, deleteShape, setSelectedShapeId]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (textInput) return;

    const { x, y } = getCoordinates(e);

    if (activeTool === "text") {
      e.preventDefault();
      e.stopPropagation();
      setTextInput({ x, y, value: "" });
      return;
    }

    if (activeTool === "move") {
      const clickedShape = shapes.find((shape) => {
        if (shape.type === "rectangle") {
          return (
            x >= shape.x &&
            x <= shape.x + shape.width &&
            y >= shape.y &&
            y <= shape.y + shape.height
          );
        } else if (shape.type === "circle") {
          const dx = x - shape.cx;
          const dy = y - shape.cy;
          return Math.sqrt(dx * dx + dy * dy) <= shape.r;
        } else if (shape.type === "text") {
          return (
            x >= shape.x &&
            x <= shape.x + 100 &&
            y >= shape.y - 20 &&
            y <= shape.y
          );
        }
        return false;
      });

      if (clickedShape) {
        if (
          clickedShape.type === "rectangle" &&
          x >= clickedShape.x + clickedShape.width - 10 &&
          y >= clickedShape.y + clickedShape.height - 10
        ) {
          setIsResizing(true);
        } else {
          setIsDragging(true);
        }
        setSelectedShapeId(clickedShape.id);
        setStartPoint({ x, y });
      } else {
        // Start group selection box
        setSelectionRect({ x, y, width: 0, height: 0 });
        setStartPoint({ x, y });
      }

      if (!clickedShape) {
        setSelectedShapeId(null); // ✅ reset seleksi kalau klik kosong
      }

      return;
    }

    setStartPoint({ x, y });

    if (activeTool === "rectangle") {
      setIsDrawing(true);
      setCurrentShape({
        id: generateUniqueId(),
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
        id: generateUniqueId(),
        type: "circle",
        cx: x,
        cy: y,
        r: 0,
        fill: "transparent",
        stroke: "black",
        strokeWidth: 2,
      });
    } else if (activeTool === "select") {
      setSelectedShapeId(null);
    }
  };

  const onMouseMoveCanvas = (e: React.MouseEvent) => {
    handleMouseMove(e);
    const { x, y } = getCoordinates(e);

    if (activeTool === "move" && draggingShapeId) {
      setDraggingShapeId(null);
      setStartPoint(null);
    }

    // 🟦 Multi-select rectangle in progress
    if (activeTool === "move" && startPoint && selectionRect) {
      const width = x - startPoint.x;
      const height = y - startPoint.y;
      setSelectionRect({
        x: startPoint.x,
        y: startPoint.y,
        width,
        height,
      });

      return;
    }

    // 🟨 Single shape move/resize
    if (activeTool === "move" && selectedShapeId && startPoint) {
      const dx = x - startPoint.x;
      const dy = y - startPoint.y;

      const shape = shapes.find((s) => s.id === selectedShapeId);
      if (shape) {
        let updated: CanvasShape = shape;

        if (isResizing && shape.type === "rectangle") {
          updated = {
            ...shape,
            width: shape.width + dx,
            height: shape.height + dy,
          };
        } else if (isDragging) {
          if (shape.type === "rectangle") {
            updated = { ...shape, x: shape.x + dx, y: shape.y + dy };
          } else if (shape.type === "circle") {
            updated = { ...shape, cx: shape.cx + dx, cy: shape.cy + dy };
          } else if (shape.type === "text") {
            updated = { ...shape, x: shape.x + dx, y: shape.y + dy };
          }
        }

        updateShape(updated.id, updated);

        if (socket && isConnected) {
          socket.emit("shape-update", {
            boardId,
            userId: currentUser.id,
            id: updated.id,
            updates: updated,
          });
        }

        setStartPoint({ x, y });
      }

      return;
    }

    // ⛔ Skip if not drawing
    if (!isDrawing || !startPoint || !currentShape || textInput) return;

    // 🟩 Drawing mode
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

    if (selectionRect) {
      const { x, y, width, height } = selectionRect;
      const minX = Math.min(x, x + width);
      const maxX = Math.max(x, x + width);
      const minY = Math.min(y, y + height);
      const maxY = Math.max(y, y + height);

      const selected = shapes
        .filter((shape) => {
          if (shape.type === "rectangle") {
            return (
              shape.x >= minX &&
              shape.x + shape.width <= maxX &&
              shape.y >= minY &&
              shape.y + shape.height <= maxY
            );
          } else if (shape.type === "circle") {
            return (
              shape.cx - shape.r >= minX &&
              shape.cx + shape.r <= maxX &&
              shape.cy - shape.r >= minY &&
              shape.cy + shape.r <= maxY
            );
          } else if (shape.type === "text") {
            return (
              shape.x >= minX &&
              shape.x <= maxX &&
              shape.y >= minY &&
              shape.y <= maxY
            );
          }
          return false;
        })
        .map((s) => s.id);

      setSelectedShapeIds(selected);
      setSelectionRect(null);
      setStartPoint(null);
      return;
    }

    if (isDragging || isResizing) {
      setIsDragging(false);
      setIsResizing(false);
      setDraggingShapeId(null);
      setStartPoint(null);
      setSelectedShapeId(null); // ✅ reset seleksi
      return;
    }

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

      setShapePreviews((prev) => {
        const newMap = new Map(prev);
        newMap.delete(currentUser.id);
        return newMap;
      });

      setCurrentShape(null);
      setStartPoint(null);
      setIsDrawing(false);
    }
  };

  // const onMouseDown = (e: React.MouseEvent) => {
  //   if (textInput) return;

  //   const { x, y } = getCoordinates(e);

  //   // ✏️ Text Tool
  //   if (activeTool === "text") {
  //     e.preventDefault();
  //     e.stopPropagation();
  //     setTextInput({ x, y, value: "" });
  //     return;
  //   }

  //   // 🔀 Move Tool (cari shape yang diklik)
  //   if (activeTool === "move") {
  //     const clickedShape = shapes.find((shape) => {
  //       if (shape.type === "rectangle") {
  //         return (
  //           x >= shape.x &&
  //           x <= shape.x + shape.width &&
  //           y >= shape.y &&
  //           y <= shape.y + shape.height
  //         );
  //       } else if (shape.type === "circle") {
  //         const dx = x - shape.cx;
  //         const dy = y - shape.cy;
  //         return Math.sqrt(dx * dx + dy * dy) <= shape.r;
  //       } else if (shape.type === "text") {
  //         return (
  //           x >= shape.x &&
  //           x <= shape.x + 100 && // perkiraan lebar teks
  //           y >= shape.y - 20 &&
  //           y <= shape.y
  //         );
  //       }
  //       return false;
  //     });

  //     if (clickedShape) {
  //       setIsDragging(true);
  //       setSelectedShapeId(clickedShape.id);
  //       setStartPoint({ x, y }); // simpan titik awal mouse
  //     }

  //     return; // ⛔ Jangan lanjut ke drawing
  //   }

  //   // 🧱 Drawing tool (rectangle/circle)
  //   setStartPoint({ x, y });

  //   if (activeTool === "rectangle") {
  //     setIsDrawing(true);
  //     setCurrentShape({
  //       id: crypto.randomUUID(),
  //       type: "rectangle",
  //       x,
  //       y,
  //       width: 0,
  //       height: 0,
  //       fill: "transparent",
  //       stroke: "black",
  //       strokeWidth: 2,
  //     });
  //   } else if (activeTool === "circle") {
  //     setIsDrawing(true);
  //     setCurrentShape({
  //       id: crypto.randomUUID(),
  //       type: "circle",
  //       cx: x,
  //       cy: y,
  //       r: 0,
  //       fill: "transparent",
  //       stroke: "black",
  //       strokeWidth: 2,
  //     });
  //   }
  // };

  // const onMouseMoveCanvas = (e: React.MouseEvent) => {
  //   handleMouseMove(e);

  //   const { x, y } = getCoordinates(e);

  //   // 🟡 MOVE TOOL
  //   if (activeTool === "move" && selectedShapeId && startPoint) {
  //     const dx = x - startPoint.x;
  //     const dy = y - startPoint.y;

  //     const shape = shapes.find((s) => s.id === selectedShapeId);
  //     if (shape) {
  //       let updated: CanvasShape;

  //       if (shape.type === "rectangle") {
  //         updated = { ...shape, x: shape.x + dx, y: shape.y + dy };
  //       } else if (shape.type === "circle") {
  //         updated = { ...shape, cx: shape.cx + dx, cy: shape.cy + dy };
  //       } else if (shape.type === "text") {
  //         updated = { ...shape, x: shape.x + dx, y: shape.y + dy };
  //       } else {
  //         updated = shape;
  //       }

  //       updateShape(updated.id, updated);

  //       if (socket && isConnected) {
  //         socket.emit("shape-update", {
  //           boardId,
  //           userId: currentUser.id,
  //           id: updated.id,
  //           updates: updated,
  //         });
  //       }

  //       setStartPoint({ x, y });
  //     }

  //     return; // ⛔ keluar supaya tidak lanjut ke draw
  //   }

  //   // ⛔ Jika sedang tidak menggambar, berhenti di sini
  //   if (!isDrawing || !startPoint || !currentShape || textInput) return;

  //   // 🟢 DRAWING MODE
  //   if (currentShape.type === "rectangle") {
  //     const newShape = {
  //       ...currentShape,
  //       width: x - startPoint.x,
  //       height: y - startPoint.y,
  //     };
  //     setCurrentShape(newShape);

  //     if (socket && isConnected) {
  //       socket.emit("shape-preview", {
  //         boardId,
  //         userId: currentUser.id,
  //         shape: newShape,
  //       });
  //     }
  //   } else if (currentShape.type === "circle") {
  //     const dx = x - startPoint.x;
  //     const dy = y - startPoint.y;
  //     const newShape = {
  //       ...currentShape,
  //       r: Math.sqrt(dx * dx + dy * dy),
  //     };
  //     setCurrentShape(newShape);

  //     if (socket && isConnected) {
  //       socket.emit("shape-preview", {
  //         boardId,
  //         userId: currentUser.id,
  //         shape: newShape,
  //       });
  //     }
  //   }
  // };

  // const onMouseUp = async () => {
  //   if (textInput) return;

  //   if (isDragging) {
  //     setIsDragging(false);
  //     setDraggingShapeId(null);
  //     setStartPoint(null);
  //     return;
  //   }

  //   if (isDrawing && currentShape) {
  //     let shouldSave = false;

  //     if (
  //       currentShape.type === "rectangle" &&
  //       (Math.abs(currentShape.width) > 5 || Math.abs(currentShape.height) > 5)
  //     ) {
  //       shouldSave = true;
  //     } else if (currentShape.type === "circle" && currentShape.r > 5) {
  //       shouldSave = true;
  //     }

  //     if (activeTool === "move" && draggingShapeId) {
  //       setDraggingShapeId(null);
  //       setStartPoint(null);
  //     }

  //     if (shouldSave) {
  //       try {
  //         const saved = await saveShape(currentShape, boardId);
  //         addShape(saved);

  //         if (socket && isConnected) {
  //           socket.emit("shape-add", {
  //             boardId,
  //             shape: saved,
  //             userId: currentUser.id,
  //           });
  //         }
  //       } catch (err) {
  //         console.error("❌ Gagal simpan shape:", err);
  //       }
  //     }

  //     // 🔥 Bersihkan preview saat mouse dilepas
  //     setShapePreviews((prev) => {
  //       const newMap = new Map(prev);
  //       newMap.delete(currentUser.id); // hapus preview user ini
  //       return newMap;
  //     });

  //     // Reset semua state terkait
  //     setCurrentShape(null);
  //     setStartPoint(null);
  //     setIsDrawing(false);
  //   }
  // };

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full bg-white overflow-scroll touch-none hide-scrollbar"
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
        className="w-full h-full "
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMoveCanvas}
        onMouseUp={onMouseUp}
        style={{
          backgroundColor: "#fff", // Bersih seperti Figma
          transform: `scale(${zoom})`,
          transformOrigin: "top left",
          pointerEvents: textInput ? "none" : "auto",
          zIndex: textInput ? 30 : 0,
        }}
      >
        <defs>
          <pattern
            id="dot-pattern"
            x="0"
            y="0"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="1" fill="#e5e7eb" />{" "}
            {/* Tailwind gray-200 */}
          </pattern>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="url(#dot-pattern)" />

        {/* Render saved shapes */}
        {uniqueSavedShapes.map((shape) => (
          <Shape
            key={`saved-${shape.type}-${shape.id}`}
            shape={shape}
            isSelected={
              shape.id === selectedShapeId ||
              selectedShapeIds.includes(shape.id)
            }
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
// function setIsResizing(arg0: boolean) {
//   throw new Error("Function not implemented.");
// }
