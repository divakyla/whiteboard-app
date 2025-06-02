import { Server as IOServer } from "socket.io";
// import type { NextRequest } from "next/server";

// Cache di globalThis
const IO_KEY = Symbol.for("app.socket.io");

type GlobalWithIO = typeof globalThis & {
  [IO_KEY]?: IOServer;
};

export async function POST() {
  const globalRef = globalThis as GlobalWithIO;

  if (!globalRef[IO_KEY]) {
    console.log("✅ Initializing Socket.IO (standalone)");

    const io = new IOServer({
      cors: {
        origin: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
      },
      path: "/api/socket",
    });

    globalRef[IO_KEY] = io;

    io.on("connection", (socket) => {
      console.log("🟢 Client connected:", socket.id);

      socket.on("join-board", ({ boardId, userId, username }) => {
        socket.join(boardId);
        socket.to(boardId).emit("user-join", { userId, username });
      });

      socket.on("cursor-move", ({ boardId, ...rest }) => {
        socket.to(boardId).emit("cursor-move", rest);
      });

      socket.on("shape-preview", (data) => {
        socket.to(data.boardId).emit("shape-preview", data);
      });

      socket.on("shape-add", (data) => {
        socket.to(data.boardId).emit("shape-add", data);
      });

      socket.on("disconnect", () => {
        console.log("🔴 Disconnected:", socket.id);
      });
    });

    // Mulai di port terpisah (misalnya 3001)
    const { createServer } = await import("http");
    const server = createServer();
    io.attach(server);

    server.listen(3001, () => {
      console.log("🚀 Socket.IO standalone server on :3001");
    });
  } else {
    console.log("♻️ Reusing existing IO server");
  }

  return new Response("Socket.IO server ready");
}

export async function GET() {
  return new Response("WebSocket endpoint active");
}
