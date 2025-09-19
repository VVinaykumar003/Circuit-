import { Server } from "socket.io";

let io;

export async function GET(req) {
  if (!io) {
    io = new Server(3001, {
      cors: { origin: "*", methods: ["GET", "POST"] },
    });

    io.on("connection", (socket) => {
      console.log("⚡ Socket connected:", socket.id);

      socket.on("join", (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined room`);
      });
    });
  }

  return new Response("Socket.io running");
}
