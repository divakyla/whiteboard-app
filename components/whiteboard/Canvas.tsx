"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import debounce from "lodash.debounce";
import { useUIStore } from "@/store/uiStore";
// import type { Tool } from "@/store/uiStore";

import { Wifi, WifiOff, Users } from "lucide-react";
import {
  Rectangle,
  Circle,
  TextShape,
  PenShape,
  ArrowCurveShape,
  ArrowElbowShape,
  ArrowStraightShape,
} from "@/types/canvas";
import { useCanvasStore } from "@/store/canvasStore";
import Shape from "@/components/whiteboard/elements/Shape";
import { io, Socket } from "socket.io-client";
import Cursor from "@/components/whiteboard/Cursor";
import { v4 as uuidv4 } from "uuid"; // ✅ Gunakan UUID unik untuk semua shape
import { useSession } from "next-auth/react";
import { isAnyArrowShape } from "@/lib/utils/shapeGuards";

// import Toolbar from "./Toolbar";

type Point = { x: number; y: number };
type CanvasShape =
  | Rectangle
  | Circle
  | TextShape
  | PenShape
  | ArrowStraightShape
  | ArrowElbowShape
  | ArrowCurveShape;

// ✨ Smooth pen drawing utilities
interface SmoothPoint extends Point {
  pressure?: number;
  timestamp?: number;
}

class PenSmoother {
  private points: SmoothPoint[] = [];
  private lastPoint: SmoothPoint | null = null;
  private minDistance = 2; // Minimum distance between points
  private smoothingFactor = 0.5; // How much to smooth (0-1)

  addPoint(point: SmoothPoint): SmoothPoint[] {
    // Skip if too close to last point
    if (this.lastPoint) {
      const distance = Math.sqrt(
        Math.pow(point.x - this.lastPoint.x, 2) +
          Math.pow(point.y - this.lastPoint.y, 2)
      );

      if (distance < this.minDistance) {
        return this.points;
      }
    }

    // Add timestamp if not provided
    if (!point.timestamp) {
      point.timestamp = Date.now();
    }

    this.points.push(point);
    this.lastPoint = point;

    // Keep only recent points for performance
    if (this.points.length > 100) {
      this.points = this.points.slice(-50);
    }

    return this.getSmoothedPoints();
  }

  private getSmoothedPoints(): SmoothPoint[] {
    if (this.points.length < 3) return this.points;

    const smoothed: SmoothPoint[] = [this.points[0]];

    for (let i = 1; i < this.points.length - 1; i++) {
      const prev = this.points[i - 1];
      const curr = this.points[i];
      const next = this.points[i + 1];

      // Apply smoothing algorithm
      const smoothX =
        curr.x + (prev.x + next.x - 2 * curr.x) * this.smoothingFactor;
      const smoothY =
        curr.y + (prev.y + next.y - 2 * curr.y) * this.smoothingFactor;

      smoothed.push({
        x: smoothX,
        y: smoothY,
        pressure: curr.pressure,
        timestamp: curr.timestamp,
      });
    }

    // Always include the last point
    if (this.points.length > 1) {
      smoothed.push(this.points[this.points.length - 1]);
    }

    return smoothed;
  }

  getPathDataFromPoints(pointsToSmooth: SmoothPoint[]): string {
    if (pointsToSmooth.length < 2) return "";

    let path = `M ${pointsToSmooth[0].x} ${pointsToSmooth[0].y}`;

    if (pointsToSmooth.length === 2) {
      path += ` L ${pointsToSmooth[1].x} ${pointsToSmooth[1].y}`;
      return path;
    }

    for (let i = 1; i < pointsToSmooth.length - 1; i++) {
      const curr = pointsToSmooth[i];
      const next = pointsToSmooth[i + 1];

      const cpX = curr.x;
      const cpY = curr.y;

      const endX = (curr.x + next.x) / 2;
      const endY = (curr.y + next.y) / 2;

      path += ` Q ${cpX} ${cpY} ${endX} ${endY}`;
    }

    const lastPoint = pointsToSmooth[pointsToSmooth.length - 1];
    path += ` L ${lastPoint.x} ${lastPoint.y}`;

    return path;
  }

  // Convert points to SVG path for even smoother curves
  getPathData(): string {
    const points = this.getSmoothedPoints();
    if (points.length < 2) return "";

    let path = `M ${points[0].x} ${points[0].y}`;

    if (points.length === 2) {
      path += ` L ${points[1].x} ${points[1].y}`;
      return path;
    }

    // Use quadratic curves for smoothness
    for (let i = 1; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];

      // Control point is the current point
      const cpX = curr.x;
      const cpY = curr.y;

      // End point is midway to next point
      const endX = (curr.x + next.x) / 2;
      const endY = (curr.y + next.y) / 2;

      path += ` Q ${cpX} ${cpY} ${endX} ${endY}`;
    }

    // Final line to last point
    const lastPoint = points[points.length - 1];
    path += ` L ${lastPoint.x} ${lastPoint.y}`;

    return path;
  }

  reset() {
    this.points = [];
    this.lastPoint = null;
  }

  getPoints(): SmoothPoint[] {
    return this.points;
  }
}

// Types for collaboration
interface UserCursor {
  userId: string;
  username: string;
  x: number;
  y: number;
  color: string;
  lastSeen: number;
}

interface CanvasProps {
  boardId: string;
  localUser: {
    id: string;
    username: string;
    email?: string;
  };
  svgRef: React.RefObject<SVGSVGElement | null>;
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

const StatusBar: React.FC<{
  isConnected: boolean;
  otherUsersCount: number;
}> = ({ isConnected, otherUsersCount }) => (
  <div className="fixed top-16 right-4 z-50">
    <div className="flex items-center gap-3 bg-white rounded-xl shadow border border-gray-200 px-3 py-1.5">
      <div className="flex items-center gap-2">
        {isConnected ? (
          <Wifi size={16} className="text-green-500" />
        ) : (
          <WifiOff size={16} className="text-red-500" />
        )}
        <span className="text-sm text-gray-600">
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>
      {otherUsersCount > 0 && (
        <div className="flex items-center gap-2">
          <Users size={16} className="text-blue-500" />
          <span className="text-sm text-gray-600">
            +{otherUsersCount} user{otherUsersCount > 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  </div>
);

// Fungsi untuk render arrow berdasarkan type
const getArrowPathData = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  type: string
): string => {
  // Hitung koordinat relatif terhadap startX, startY
  const relEndX = endX - startX;
  const relEndY = endY - startY;

  let pathData = "";

  if (type === "arrow-straight") {
    // Path untuk garis lurus: Mulai dari (0,0) relatif, berakhir di (relEndX, relEndY)
    pathData = `M 0 0 L ${relEndX} ${relEndY}`;
  } else if (type === "arrow-elbow") {
    // Untuk siku: midX dan midY juga harus relatif
    const relMidX = relEndX / 2;
    // const relMidY = relEndY / 2; // ini tidak digunakan dalam contoh ini, tapi bisa berguna untuk elbow yang berbeda

    // Asumsi elbow yang horizontal-then-vertical
    // M 0 0 L relMidX 0 L relMidX relEndY L relEndX relEndY
    pathData = `M 0 0 L ${relMidX} 0 L ${relMidX} ${relEndY} L ${relEndX} ${relEndY}`;

    // Jika elbow yang vertical-then-horizontal, ini akan berbeda:
    // pathData = `M 0 0 L 0 ${relMidY} L ${relEndX} ${relMidY} L ${relEndX} ${relEndY}`;
  } else if (type === "arrow-curve") {
    // Untuk kurva: control points juga harus relatif terhadap (0,0)
    const relMidX = relEndX / 2;
    const relMidY = relEndY / 2;
    const dx = relEndX; // dx dan dy sudah relatif
    const dy = relEndY;
    const curveDirection = dy >= 0 ? 1 : -1;

    const controlX = relMidX + curveDirection * Math.abs(dy) * 0.3;
    const controlY = relMidY - curveDirection * Math.abs(dx) * 0.3;

    pathData = `M 0 0 Q ${controlX} ${controlY} ${relEndX} ${relEndY}`;
  }
  return pathData;
};

export default function Canvas({ boardId, svgRef }: CanvasProps) {
  // const svgRef = useRef<SVGSVGElement>(null);
  const { data: session } = useSession();
  const [localUser, setLocalUser] = useState<{
    id: string;
    username: string;
  } | null>(null);
  const activeTool = useUIStore((state) => state.activeTool);
  // const setActiveTool = useUIStore((state) => state.setActiveTool);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentShape, setCurrentShape] = useState<CanvasShape | null>(null);

  // Collaborative states
  const [socket, setSocket] = useState<Socket | null>(null);
  const [otherUsers, setOtherUsers] = useState<Map<string, UserCursor>>(
    new Map()
  );
  const [isConnected, setIsConnected] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const userColor = useMemo(() => {
    return localUser ? generateUserColor(localUser.id) : "#000000";
  }, [localUser]);

  const [shapePreviews, setShapePreviews] = useState<Map<string, CanvasShape>>(
    new Map()
  );
  const generateUniqueId = () => `${localUser?.id ?? "nouser"}-${uuidv4()}`;

  // ✨ Smooth pen drawing states
  const penSmoother = useRef(new PenSmoother());
  const [currentPenPath, setCurrentPenPath] = useState<string>("");
  // const [isDrawingPen, setIsDrawingPen] = useState(false);

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
  const clearAllShapesRequest = useCanvasStore((s) => s.clearAllShapesRequest);
  const clearAllShapes = useCanvasStore((s) => s.clearAllShapes);

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
  const penColor = useCanvasStore((s) => s.penColor);
  const penType = useCanvasStore((s) => s.penType);
  //   const canvasWidth = 1920;
  // const canvasHeight = 1080;
  const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1080 });
  // const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentArrowPreview, setCurrentArrowPreview] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    type: string;
  } | null>(null);
  const [otherUsersArrowPreviews, setOtherUsersArrowPreviews] = useState<
    Map<
      string,
      {
        startX: number;
        startY: number;
        endX: number;
        endY: number;
        type: string;
      }
    >
  >(new Map());

  // Set current user dari session
  useEffect(() => {
    if (session?.user?.id && session.user.username) {
      setLocalUser({
        id: session.user.id,
        username: session.user.username,
      });
    }
  }, [session]);

  useEffect(() => {
    const updateSize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

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

  useEffect(() => {
    if (clearAllShapesRequest) {
      const clear = async () => {
        await fetch(`/api/shapes?boardId=${boardId}`, { method: "DELETE" });
        clearAllShapes();
        if (socket && isConnected) {
          socket.emit("clear-all", { boardId, userId: localUser });
        }
      };
      clear();
      useCanvasStore.setState({ clearAllShapesRequest: false }); // reset trigger
    }
  }, [
    clearAllShapesRequest,
    clearAllShapes,
    boardId,
    socket,
    isConnected,
    localUser,
  ]);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!boardId || !localUser?.id || !localUser?.username) return;

    const socketInstance = io("http://localhost:3001", {
      path: "/api/socket",
      transports: ["websocket"],
    });

    setSocket(socketInstance); // Simpan ke state React

    socketInstance.on("connect", () => {
      console.log("✅ Connected to collaboration server");
      setIsConnected(true);

      // Simpan socketId milik sendiri (bukan currentUser.id)
      // if (socketInstance.id) {
      //   setSocketId(socketInstance.id);
      // }

      // Emit join board event
      socketInstance.emit("join-board", {
        boardId,
        userId: localUser.id,
        username: localUser.username,
      });
    });

    socketInstance.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    socketInstance.on("disconnect", () => {
      console.warn("🔌 Disconnected from collaboration server");
      setIsConnected(false);
      // setSocketId(null);
    });

    // 👥 User join & leave log
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
      if (data.userId !== localUser?.id) {
        setOtherUsers((prev) => {
          const map = new Map(prev);
          map.set(data.userId, { ...data, lastSeen: Date.now() });
          return map;
        });
      }
    });

    // 🧩 Shape events
    socketInstance.on("shape-add", ({ shape, userId }) => {
      if (userId !== localUser.id) {
        addShape(shape);
        setShapePreviews((prev) => {
          const map = new Map(prev);
          map.delete(userId);
          return map;
        });
      }
    });

    socketInstance.on("shape-update", ({ id, updates, userId }) => {
      if (userId !== localUser.id) {
        updateShape(id, updates);
      }
    });

    socketInstance.on("shape-remove", ({ id, userId }) => {
      if (userId !== localUser.id) {
        removeShape(id);
      }
    });

    socketInstance.on("shape-preview", ({ userId, shape }) => {
      if (userId !== localUser.id) {
        setShapePreviews((prev) => {
          const map = new Map(prev);
          map.set(userId, shape);
          return map;
        });
      }
    });

    socketInstance.on("clear-all", ({ userId }) => {
      console.log(`🧹 Semua shape dihapus oleh ${userId}`);
      setShapes([]);
    });

    // Tambahkan socket listeners untuk arrow preview (dalam useEffect socket)
    socketInstance.on("arrow-preview", (data) => {
      if (data.userId !== localUser?.id) {
        setOtherUsersArrowPreviews((prev) => {
          const map = new Map(prev);
          map.set(data.userId, {
            startX: data.startX,
            startY: data.startY,
            endX: data.endX,
            endY: data.endY,
            type: data.type,
          });
          return map;
        });
      }
    });

    socketInstance.on("arrow-preview-clear", (data) => {
      if (data.userId !== localUser?.id) {
        setOtherUsersArrowPreviews((prev) => {
          const map = new Map(prev);
          map.delete(data.userId);
          return map;
        });
      }
    });

    // 🧹 Clean up disconnected users
    socketInstance.on("user-disconnected", (userId) => {
      setOtherUsers((prev) => {
        const map = new Map(prev);
        map.delete(userId);
        return map;
      });
    });

    // Cleanup on unmount
    return () => {
      console.log("🧹 Disconnecting socket...");
      socketInstance.disconnect();
    };
  }, [
    boardId,
    localUser?.id,
    localUser?.username,
    addShape,
    updateShape,
    removeShape,
    setShapes,
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

  const getCoordinates = useCallback(
    (e: React.MouseEvent): Point => {
      const svg = e.currentTarget as SVGSVGElement;
      const rect = svg.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / zoom,
        y: (e.clientY - rect.top) / zoom,
      };
    },
    [zoom]
  ); // tambahkan zoom sebagai dependency jika zoom bisa berubah

  // const handleMouseMove = useCallback(
  //   (e: React.MouseEvent) => {
  //     if (socket && isConnected) {
  //       const { x, y } = getCoordinates(e);

  //       socket.emit("cursor-move", {
  //         boardId,
  //         userId: currentUser.id,
  //         username: currentUser.username,
  //         x,
  //         y,
  //         color: userColor.current,
  //       });
  //     }
  //   },
  //   [socket, isConnected, boardId, currentUser, getCoordinates]
  // );
  // console.log("📍 Other users:", Array.from(otherUsers.entries()));

  useEffect(() => {
    if (!socket || !localUser) return;

    const handleMouseMove = (e: MouseEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      socket.emit("cursor-move", {
        boardId,
        userId: localUser.id,
        username: localUser.username,
        x,
        y,
        color: userColor,
      });

      // Debugging
      console.log("📤 Cursor dikirim:", {
        userId: localUser.id,
        username: localUser.username,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [socket, localUser, boardId, userColor, svgRef]);

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
          socket.emit("shape-remove", { boardId, id, userId: localUser?.id });
        }

        await fetchShapes();
      } catch (err) {
        console.error("❌ Gagal hapus shape:", err);
      }
    },
    [removeShape, socket, isConnected, boardId, localUser?.id, fetchShapes]
  );

  useEffect(() => {
    useCanvasStore.setState({ deleteShape });
  }, [deleteShape]);

  useEffect(() => {
    fetchShapes();
  }, [fetchShapes]);

  const updateShaped = useRef(
    debounce(async (id: string, updates: Partial<CanvasShape>) => {
      try {
        await fetch(`/api/shapes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates }),
        });
      } catch (err) {
        console.error("Gagal update shape realtime:", err);
      }
    }, 300) // ⏱️ delay 300ms setelah user berhenti drag
  ).current;

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
        userId: localUser?.id,
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

    const svg = e.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const mousePoint = {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };

    const { x, y } = mousePoint;

    // 🏹 Arrow Tool - Start drawing dengan preview
    if (activeTool?.startsWith("arrow")) {
      e.preventDefault();
      setIsDrawing(true);
      setStartPoint({ x, y });
      setCurrentArrowPreview({
        startX: x,
        startY: y,
        endX: x,
        endY: y,
        type: activeTool,
      });
      return;
    }

    // 🖊️ ✨ Enhanced Pen Tool with smoothing
    if (activeTool === "pen") {
      e.preventDefault();
      setIsDrawing(true);

      // Reset the smoother for new stroke
      penSmoother.current.reset();

      // Add first point
      penSmoother.current.addPoint({
        x,
        y,
        pressure: 1.0,
        timestamp: Date.now(),
      });

      const initialPath = `M ${x} ${y}`;
      setCurrentPenPath(initialPath);
      return;
    }

    // 🧽 Eraser Tool
    if (activeTool === "eraser") {
      e.preventDefault();
      setIsDrawing(true);
      // Hapus shape yang diklik
      const { x, y } = mousePoint;
      const shapeToDelete = shapes.find((shape) => {
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
        } else if (shape.type === "pen") {
          return shape.points?.some(
            (point) => Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2) < 10
          );
        } else if (shape.type === "text") {
          return (
            x >= shape.x &&
            x <= shape.x + 100 &&
            y >= shape.y - 20 &&
            y <= shape.y
          );
        } else if (isAnyArrowShape(shape)) {
          return (
            x >= shape.x &&
            x <= shape.x + shape.width &&
            y >= shape.y &&
            y <= shape.y + shape.height
          );
        }
        return false;
      });

      if (shapeToDelete) {
        deleteShape(shapeToDelete.id);
      }
      return;
    }

    //   setCurrentPenPath(penSmoother.current.getPathData());
    //   return;
    // }

    // 🅰️ Text Tool
    if (activeTool === "text") {
      e.preventDefault();
      e.stopPropagation();
      setTextInput({ x, y, value: "" });
      return;
    }

    // 🖐️ Move Tool
    if (activeTool === "move") {
      const clickedShape = shapes.find((shape) => {
        const tolerance = 10;
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
          // Bounding box untuk text
          return (
            x >= shape.x &&
            x <= shape.x + 100 && // Asumsi lebar text max 100
            y >= shape.y - 20 && // Asumsi tinggi text max 20
            y <= shape.y
          );
        } else if (shape.type === "pen") {
          // Cek klik di sekitar titik-titik pen
          return shape.points?.some(
            (point) =>
              Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2) < tolerance
          );
        } else if (isAnyArrowShape(shape)) {
          // Bounding box untuk panah
          const arrowX1 = shape.x;
          const arrowY1 = shape.y;
          const arrowX2 = shape.x + shape.width;
          const arrowY2 = shape.y + shape.height;

          const minArrowX = Math.min(arrowX1, arrowX2);
          const maxArrowX = Math.max(arrowX1, arrowX2);
          const minArrowY = Math.min(arrowY1, arrowY2);
          const maxArrowY = Math.max(arrowY1, arrowY2);

          return (
            x >= minArrowX - tolerance &&
            x <= maxArrowX + tolerance &&
            y >= minArrowY - tolerance &&
            y <= maxArrowY + tolerance
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
        setDraggingShapeId(clickedShape.id); // ✅ Tambahkan ini
        setStartPoint({ x, y });
      } else {
        setSelectionRect({ x, y, width: 0, height: 0 });
        setStartPoint({ x, y });
        setSelectedShapeId(null); // Reset selection
      }

      return;
    }

    // 🟥 Rectangle Tool
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
      setStartPoint({ x, y });
      return;
    }

    // ⚪ Circle Tool
    if (activeTool === "circle") {
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
      setStartPoint({ x, y });
      return;
    }

    // 🔍 Select Tool
    if (activeTool === "select") {
      setSelectedShapeId(null);
      setStartPoint({ x, y });
    }
  };

  const onMouseMoveCanvas = (e: React.MouseEvent) => {
    // Send cursor position to other users
    if (socket && isConnected && localUser) {
      const { x, y } = getCoordinates(e);
      socket.emit("cursor-move", {
        boardId,
        userId: localUser.id,
        username: localUser.username,
        x,
        y,
        color: userColor,
      });
    }
    const { x, y } = getCoordinates(e);

    // 🏹 Arrow Tool Preview - Update preview saat mouse move
    if (activeTool?.startsWith("arrow") && isDrawing && startPoint) {
      setCurrentArrowPreview({
        startX: startPoint.x,
        startY: startPoint.y,
        endX: x,
        endY: y,
        type: activeTool,
      });

      // Emit arrow preview ke user lain
      if (socket && isConnected) {
        socket.emit("arrow-preview", {
          boardId,
          userId: localUser?.id,
          startX: startPoint.x,
          startY: startPoint.y,
          endX: x,
          endY: y,
          type: activeTool,
        });
      }
      return;
    }

    if (activeTool === "move" && draggingShapeId) {
      setDraggingShapeId(null);
      setStartPoint(null);
    }

    // ✏️ ✅ Pen tool → tambah titik baru ke path HANYA saat mouse ditekan
    if (activeTool === "pen" && isDrawing) {
      penSmoother.current.addPoint({
        x,
        y,
        pressure: 1.0,
        timestamp: Date.now(),
      });

      const pathData = penSmoother.current.getPathData();
      setCurrentPenPath(pathData);

      // Emit preview stroke ke user lain secara real-time
      if (socket && isConnected && pathData) {
        socket.emit("pen-preview", {
          boardId,
          userId: localUser?.id,
          pathData,
          color: penColor,
          strokeWidth: penType === "marker" ? 4 : 2,
        });
      }

      return;
    }

    // ✏️ Pen tool → tambah titik baru ke path
    if (activeTool === "pen" && isDrawing) {
      penSmoother.current.addPoint({
        x,
        y,
        pressure: 1.0,
        timestamp: Date.now(),
      });

      const pathData = penSmoother.current.getPathData();
      setCurrentPenPath(pathData);

      // Emit preview stroke ke user lain secara real-time
      if (socket && isConnected && pathData) {
        socket.emit("pen-preview", {
          boardId,
          userId: localUser?.id,
          pathData,
          color: penColor,
          strokeWidth: penType === "marker" ? 4 : 2,
        });
      }

      return;
    }

    // 🧽 Eraser tool - hapus shape saat drag
    if (activeTool === "eraser" && isDrawing) {
      const shapeToDelete = shapes.find((shape) => {
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
        } else if (shape.type === "pen") {
          return shape.points?.some(
            (point) => Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2) < 10
          );
        } else if (isAnyArrowShape(shape)) {
          return (
            x >= shape.x &&
            x <= shape.x + shape.width &&
            y >= shape.y &&
            y <= shape.y + shape.height
          );
        }
        return false;
      });

      if (shapeToDelete) {
        deleteShape(shapeToDelete.id);
      }
      return;
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
          } else if (shape.type === "pen") {
            // ✅ PERBAIKAN: Gerakkan setiap titik di dalam array points
            updated = {
              ...shape,
              points: shape.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
              // Perbarui pathData berdasarkan titik-titik baru
              pathData: penSmoother.current.getPathDataFromPoints(
                shape.points.map((p) => ({ x: p.x + dx, y: p.y + dy }))
              ),
            } as PenShape; // Cast untuk memastikan tipe benar
          } else if (isAnyArrowShape(shape)) {
            // ✅ PERBAIKAN: Gerakkan start point dan perbarui pathData
            updated = {
              ...shape,
              x: shape.x + dx,
              y: shape.y + dy,
              pathData: getArrowPathData(
                shape.x + dx,
                shape.y + dy,
                shape.x + shape.width + dx,
                shape.y + shape.height + dy,
                shape.type
              ),
            } as ArrowStraightShape | ArrowElbowShape | ArrowCurveShape;
          }
        }

        updateShape(updated.id, updated);

        if (socket && isConnected) {
          socket.emit("shape-update", {
            boardId,
            userId: localUser?.id,
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

    // 🟩 Drawing rectangle/circle mode
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
          userId: localUser?.id,
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
    } else if (currentShape.type?.startsWith("arrow")) {
      const newShape = {
        ...currentShape,
        // Hanya update x dan y endpoint
        width: x - startPoint.x,
        height: y - startPoint.y,
      };
      setCurrentShape(newShape);

      if (socket && isConnected) {
        socket.emit("shape-preview", {
          boardId,
          userId: localUser?.id,
          shape: newShape,
        });
      }
    }
  };

  const onMouseUp = async (event: React.MouseEvent<SVGSVGElement>) => {
    if (textInput) return;

    // 🏹 Arrow Tool Completion
    if (activeTool?.startsWith("arrow") && startPoint) {
      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const endX = (event.clientX - rect.left) / zoom;
      const endY = (event.clientY - rect.top) / zoom;

      // Hitung panjang arrow untuk validasi minimum
      const length = Math.sqrt(
        Math.pow(endX - startPoint.x, 2) + Math.pow(endY - startPoint.y, 2)
      );

      // Hanya simpan jika arrow cukup panjang
      if (length > 10) {
        // Panggil getArrowPathData di sini untuk mendapatkan string path
        const pathData = getArrowPathData(
          startPoint.x,
          startPoint.y,
          endX,
          endY,
          activeTool // activeTool sudah memiliki nilai "arrow-straight", "arrow-elbow", atau "arrow-curve"
        );

        const arrowShape:
          | ArrowStraightShape
          | ArrowElbowShape
          | ArrowCurveShape = {
          id: generateUniqueId(),
          type: activeTool as "arrow-straight" | "arrow-elbow" | "arrow-curve",
          x: startPoint.x,
          y: startPoint.y,
          width: endX - startPoint.x,
          height: endY - startPoint.y,
          stroke: "black", // Sesuaikan dengan warna panah aktif jika ada
          strokeWidth: 2, // Sesuaikan dengan ukuran panah aktif jika ada
          pathData: pathData, // <-- MASUKKAN NILAI pathData DI SINI
        };

        try {
          const saved = await saveShape(arrowShape, boardId);
          addShape(saved);

          if (socket && isConnected) {
            socket.emit("shape-add", {
              boardId,
              shape: saved,
              userId: localUser?.id,
            });
          }
        } catch (err) {
          console.error("❌ Gagal simpan arrow:", err);
        }
      }

      // Reset arrow states
      setIsDrawing(false);
      setStartPoint(null);
      setCurrentArrowPreview(null);

      // Clear preview dari socket
      if (socket && isConnected) {
        socket.emit("arrow-preview-clear", {
          boardId,
          userId: localUser?.id,
        });
      }
      return;
    }

    //   const minX = Math.min(startPoint.x, endX);
    //   const minY = Math.min(startPoint.y, endY);
    //   const width = Math.abs(endX - startPoint.x);
    //   const height = Math.abs(endY - startPoint.y);

    //   const arrowShape: ArrowShape = {
    //     id: generateUniqueId(),
    //     type: activeTool as "arrow-straight" | "arrow-elbow" | "arrow-curve",
    //     x: minX,
    //     y: minY,
    //     width,
    //     height,
    //     stroke: "black",
    //     strokeWidth: 2,
    //   };

    //   try {
    //     const saved = await saveShape(arrowShape, boardId);
    //     addShape(saved);

    //     if (socket && isConnected) {
    //       socket.emit("shape-add", {
    //         boardId,
    //         shape: saved,
    //         userId: localUser?.id,
    //       });
    //     }
    //   } catch (err) {
    //     console.error("❌ Gagal simpan arrow:", err);
    //   }
    // }

    // ✨ Enhanced pen tool completion with path smoothing
    if (activeTool === "pen" && isDrawing) {
      const smoothedPoints = penSmoother.current.getPoints();

      if (smoothedPoints.length > 1) {
        const pathData = penSmoother.current.getPathData();

        const penShape: PenShape = {
          id: generateUniqueId(),
          type: "pen",
          points: smoothedPoints.map((p) => ({ x: p.x, y: p.y })), // Convert to simple points
          pathData, // Store the smooth path data
          stroke: penColor,
          strokeWidth: penType === "marker" ? 4 : 2,
        };

        try {
          const saved = await saveShape(penShape, boardId);
          addShape(saved);

          if (socket && isConnected) {
            socket.emit("shape-add", {
              boardId,
              shape: saved,
              userId: localUser?.id,
            });
          }
        } catch (err) {
          console.error("❌ Gagal simpan pen:", err);
        }
      }

      // Reset pen states
      setIsDrawing(false);
      setCurrentPenPath("");
      penSmoother.current.reset();
      return;
    }
    // 🟦 Multi-select selesai
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

    // 🧽 Eraser selesai
    if (activeTool === "eraser" && isDrawing) {
      setIsDrawing(false);
      return;
    }

    // 🟨 Selesai drag/resize
    if (isDragging || isResizing) {
      const shape = shapes.find((s) => s.id === selectedShapeId);
      if (shape) {
        try {
          await updateShaped(shape.id, shape); // <--- Simpan perubahan posisi ke server

          if (socket && isConnected) {
            socket.emit("shape-update", {
              boardId,
              userId: localUser?.id,
              id: shape.id,
              updates: shape,
            });
          }
        } catch (err) {
          console.error("❌ Gagal simpan shape setelah move:", err);
        }
      }

      setIsDragging(false);
      setIsResizing(false);
      setDraggingShapeId(null);
      setStartPoint(null);
      setSelectedShapeId(null);
      return;
    }

    // 🟥 Selesai menggambar rectangle/circle
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
              userId: localUser?.id,
            });
          }
        } catch (err) {
          console.error("❌ Gagal simpan shape:", err);
        }
      }

      setShapePreviews((prev) => {
        const newMap = new Map(prev);
        if (localUser) {
          newMap.delete(localUser.id);
        }
        return newMap;
      });

      setCurrentShape(null);
      setStartPoint(null);
      setIsDrawing(false);
    }
  };

  return (
    <div
      ref={canvasRef}
      // className="relative w-full h-full bg-white overflow-scroll touch-none hide-scrollbar"
      className="relative w-full h-screen bg-gray-50 overflow-hidden"
      // className="fixed inset-0 bg-gray-50 overflow-hidden"
      // className="relative w-full h-screen bg-gray-50 overflow-auto"
      // onMouseMove={handleMouseMove}
      // style={{

      //   minWidth: "100%",
      //   minHeight: "100%",
      // }}
    >
      {/* <Toolbar
        activeTool={activeTool ?? "select"}
        onToolChange={setActiveTool}
      /> */}

      {/* <SidebarLeft zoom={zoom} setZoom={setZoom} /> */}
      {/* <SidebarRight /> */}
      <StatusBar isConnected={isConnected} otherUsersCount={otherUsers.size} />

      {/* Connection status */}
      {/* <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
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
      </div> */}

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
        ref={svgRef}
        className="w-full h-full "
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMoveCanvas}
        onMouseUp={onMouseUp}
        viewBox={`0 0 ${canvasSize} ${canvasSize}`}
        style={{
          backgroundColor: "#fff", // Bersih seperti Figma
          transform: `scale(${zoom})`,
          transformOrigin: "0 0", // <- GANTI dari "top left" ke "0 0"
          width: `${100 / zoom}%`,
          height: `${100 / zoom}%`,
          pointerEvents: textInput ? "none" : "auto",
          zIndex: textInput ? 30 : 0,
          cursor: activeTool === "eraser" ? "crosshair" : "default",
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
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="black" />
          </marker>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="url(#dot-pattern)" />

        {/* Render saved shapes */}
        {uniqueSavedShapes.map((shape) => {
          if (shape.type === "pen") {
            return (
              <path
                key={`pen-${shape.id}`}
                d={shape.pathData} // gunakan pathData hasil smoothing
                fill="none"
                stroke={shape.stroke}
                strokeWidth={shape.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          }

          return (
            <Shape
              key={`saved-${shape.type}-${shape.id}`}
              shape={shape}
              isSelected={
                shape.id === selectedShapeId ||
                selectedShapeIds.includes(shape.id)
              }
              onClick={() => !textInput && setSelectedShapeId(shape.id)}
            />
          );
        })}

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
            // } else if (
            //   shape.type === "arrow-straight" ||
            //   shape.type === "arrow-elbow" ||
            //   shape.type === "arrow-curve"
            // ) {
            //   const arrowShape = shape as ArrowShape;
            //   const endX = arrowShape.x + (arrowShape.width || 0);
            //   const endY = arrowShape.y + (arrowShape.height || 0);

            //   return (
            //     <line
            //       key={`preview-arrow-${arrowShape.id}`}
            //       x1={arrowShape.x}
            //       y1={arrowShape.y}
            //       x2={endX}
            //       y2={endY}
            //       stroke="gray"
            //       strokeWidth={2}
            //       strokeDasharray="4 2"
            //       markerEnd="url(#arrowhead)"
            //     />
            //   );
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
            {/* {currentShape.type?.startsWith("arrow") &&
              "x" in currentShape &&
              "y" in currentShape &&
              "width" in currentShape &&
              "height" in currentShape && (
                <line
                  x1={currentShape.x}
                  y1={currentShape.y}
                  x2={currentShape.x + (currentShape.width || 0)}
                  y2={currentShape.y + (currentShape.height || 0)}
                  stroke="blue"
                  strokeDasharray="5,5"
                  strokeWidth={2}
                  markerEnd="url(#arrowhead)"
                />
              )} */}
          </>
        )}

        {/* Render current arrow preview */}
        {currentArrowPreview && (
          <g
            transform={`translate(${currentArrowPreview.startX}, ${currentArrowPreview.startY})`}
          >
            <path
              d={getArrowPathData(
                currentArrowPreview.startX,
                currentArrowPreview.startY,
                currentArrowPreview.endX,
                currentArrowPreview.endY,
                currentArrowPreview.type
              )}
              fill="none"
              stroke="gray" // Gunakan warna panah yang aktif
              strokeWidth={2} // Gunakan ukuran panah yang aktif
              strokeDasharray="3,3" // Untuk pratinjau
              markerEnd="url(#arrowhead)"
              opacity={0.8}
            />
          </g>
        )}

        {/* Render other users' arrow previews */}
        {Array.from(otherUsersArrowPreviews.entries()).map(
          ([userId, preview]) => (
            <g
              key={`arrow-preview-${userId}`}
              transform={`translate(${preview.startX}, ${preview.startY})`}
            >
              <path
                d={getArrowPathData(
                  preview.startX,
                  preview.startY,
                  preview.endX,
                  preview.endY,
                  preview.type
                )}
                fill="none"
                stroke="blue" // Sesuaikan warna jika ada untuk user lain
                strokeWidth={2} // Sesuaikan
                strokeDasharray="3,3" // Sesuaikan
                markerEnd="url(#arrowhead)"
                opacity={0.8}
              />
            </g>
          )
        )}

        {/* PINDAHKAN pen path preview ke LUAR currentShape check: */}
        {activeTool === "pen" && isDrawing && currentPenPath && (
          <path
            d={currentPenPath}
            fill="none"
            stroke={penColor}
            strokeWidth={penType === "marker" ? 4 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="2,2"
            opacity={0.7} // <- GANTI dari 10 ke 0.7
          />
        )}
      </svg>
    </div>
  );
}
// function isAnyArrowShape(shape: TextShape) {
//   throw new Error("Function not implemented.");
// }
