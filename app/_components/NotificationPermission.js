"use client";
import { useEffect, useState } from "react";

const NotificationPermission = () => {
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          return data.email || null;
        }
      } catch (error) {
        console.error("Failed to fetch user session:", error);
      }
      return null;
    };

    const requestAndSavePermission = async (userEmail) => {
      if (!userEmail || registered) return;

      try {
        if ("Notification" in window) {
          let permission = Notification.permission;

          // Only request if it's not already granted/denied
          if (permission === "default") {
            permission = await Notification.requestPermission();
          }

          // Save result in DB regardless of choice
          await fetch("/api/notificationsPermission", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: userEmail,
              notificationPermission: permission, // "granted" | "denied" | "default"
              time: new Date().toISOString(),
            }),
          });

          setRegistered(true);
        }
      } catch (error) {
        console.error(
          "Error requesting notification permission or saving to MongoDB:",
          error
        );
      }
    };

    fetchUserEmail().then((email) => {
      if (email) requestAndSavePermission(email);
    });
  }, [registered]);

  return null; // no UI, just side effect
};

export default NotificationPermission;
