"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

let socket;

export default function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;

    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_BASE_URL, { transports: ["websocket"] });
    }

    socket.on("connect", () => {
      console.log("🔗 Connected to socket:", socket.id);
      socket.emit("join", userId); // join personal room
    });

    socket.on("notification", (notif) => {
      console.log("📌 New notification:", notif);
      setNotifications((prev) => [notif, ...prev]);
    });

    return () => {
      socket?.off("notification");
    };
  }, [userId]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full bg-gray-200 dark:bg-gray-700"
      >
        🔔
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Notifications</h3>
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No notifications</p>
          ) : (
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {notifications.map((n, i) => (
                <li key={i} className="p-2 rounded bg-gray-100 dark:bg-gray-700">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{n.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
