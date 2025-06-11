// socket-server.ts (server WebSocket mandiri pakai port 3001)
import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "*", // ganti jika kamu ingin batasi domain
  },
  path: "/api/socket", // sesuaikan dengan path di client
});

type CursorData = {
  x: number;
  y: number;
  username: string;
  color: string;
};

const cursorMap = new Map<string, CursorData>();

io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // Saat menerima pergerakan cursor dari client
  socket.on("cursor-move", (data) => {
    const { userId, x, y, username, color } = data;

    cursorMap.set(userId, { x, y, username, color });

    // Broadcast ke user lain
    socket.broadcast.emit("cursor-move", {
      userId,
      x,
      y,
      username,
      color,
    });
  });

  // Tangani event lainnya seperti shape-add, shape-update, dll
  socket.on("shape-add", (data) => {
    socket.broadcast.emit("shape-add", data);
  });

  socket.on("shape-update", (data) => {
    socket.broadcast.emit("shape-update", data);
  });

  socket.on("shape-remove", (data) => {
    socket.broadcast.emit("shape-remove", data);
  });

  socket.on("shape-preview", (data) => {
    socket.broadcast.emit("shape-preview", data);
  });

  // Saat user disconnect
  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);

    // Tidak tahu userId di sini, jadi user-disconnected tidak bisa dikirim akurat
    // Kalau mau, kamu bisa simpan mapping socket.id ⇄ userId saat join
  });
});

httpServer.listen(3001, () => {
  console.log("🚀 Socket.IO server running at http://localhost:3001");
});
