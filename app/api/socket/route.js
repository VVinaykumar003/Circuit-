import { Server } from "socket.io";

let io;

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log("🔌 Initializing Socket.io");

    io = new Server(res.socket.server, {
      path: "/api/socket.io", // must match vercel.json route
      addTrailingSlash: false,
      transports: ["polling"], // 👈 enforce long-polling for Vercel
      cors: {
        origin: "*",
      },
    });

    io.on("connection", (socket) => {
      console.log("✅ Client connected:", socket.id);

      socket.on("message", (msg) => {
        console.log("💬 Message received:", msg);
        io.emit("message", msg); // broadcast to all
      });

      socket.on("disconnect", () => {
        console.log("❌ Client disconnected:", socket.id);
      });
    });

    res.socket.server.io = io;
  } else {
    console.log("⚡️ Socket.io already running");
  }

  res.end();
}
