// hooks/useSocket.ts
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NODE_ENV === "production"
    ? "https://your-production-url.com"
    : "http://localhost:3001";

export function useSocket(boardId?: string, userId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!boardId || !userId) return;

    // Create socket connection
    const socketInstance = io(SOCKET_URL, {
      path: "/api/socket",
      transports: ["websocket", "polling"],
    });

    // Connection event handlers
    socketInstance.on("connect", () => {
      console.log("✅ Connected to socket server");
      setIsConnected(true);

      // Join board room
      socketInstance.emit("join-board", {
        boardId,
        userId,
        username: userId, // atau bisa diganti dengan username yang sebenarnya
      });
    });

    socketInstance.on("disconnect", () => {
      console.log("❌ Disconnected from socket server");
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [boardId, userId]);

  return { socket, isConnected };
}

// Tambahan: Hook khusus untuk Canvas yang include event listeners
export function useCanvasSocket(
  boardId: string,
  userId: string,
  clearAllShapes: () => void
) {
  const { socket, isConnected } = useSocket(boardId, userId);

  useEffect(() => {
    if (!socket) return;

    // Listen untuk clear-all event dari user lain
    const handleClearAll = () => {
      console.log("Received clear-all event from server");
      clearAllShapes();
    };

    socket.on("clear-all", handleClearAll);

    return () => {
      socket.off("clear-all", handleClearAll);
    };
  }, [socket, clearAllShapes]);

  return { socket, isConnected };
}
