import { Server as NetServer } from "http";
import { Server as IOServer } from "socket.io";

export default function handler(req, res) {
  if (!res.socket.server.io) {
    const io = new IOServer(res.socket.server, {
      path: "/api/socketio",
      cors: { origin: "*" },
    });
    res.socket.server.io = io;

    // Save globally so App Router or other routes can emit events
    global._io = io;

    io.on("connection", (socket) => {
      // Client should immediately join their user room after auth
      socket.on("join", (userId) => {
        socket.join(`user:${userId}`);
      });

      socket.on("disconnect", () => {
        // Optional: handle disconnect logic here
      });
    });
  }

  res.end();
}
