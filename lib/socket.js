// lib/socket.js
const { Server } = require("socket.io");

let io;

function initIO(server) {
  if (!io) {
    io = new Server(server, {
      cors: { origin: "*", methods: ["GET", "POST"] },
    });

    io.on("connection", (socket) => {
      console.log("⚡ User connected:", socket.id);

     socket.on("TaskCreated", (notif) => {
    console.log("📌 TaskCreated event:", notif);

    // send to specific assignees
    notif.assigneeIds.forEach((userId) => {
      for (let [socketId, info] of Object.entries(onlineUsers)) {
        if (info.userId === userId) {
          io.to(socketId).emit("notification", {
            id: Date.now(),
            title: "New Task Assigned",
            ...notif,
          });
        }
      }
    });
  });

    

      socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);
      });
    });
  }
  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}

module.exports = { initIO, getIO };
