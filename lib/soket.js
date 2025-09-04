import { Server as IOServer } from "socket.io";

let io;

export function initIO(server) {
  if (!io) {
    io = new IOServer(server, {
      cors: {
        origin: "*", // adjust in production
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log("⚡ User connected:", socket.id);

      // user joins their own room based on userId
      socket.on("join", (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined room`);
      });

      socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);
      });
    });
  }
  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}
