// socket-server.ts
import { createServer } from "http";
import { Server } from "socket.io";

const server = createServer();

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // frontend
    methods: ["GET", "POST"],
  },
  path: "/api/socket",
});

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

  socket.on("shape-update", ({ boardId, id, updates, userId }) => {
    socket.to(boardId).emit("shape-update", { id, updates, userId });
  });

  socket.on("shape-remove", ({ boardId, id, userId }) => {
    socket.to(boardId).emit("shape-remove", { id, userId });
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

server.listen(3001, () => {
  console.log("🚀 Socket.IO server running on port 3001");
});
