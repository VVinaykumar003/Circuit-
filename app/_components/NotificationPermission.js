"use client";
// components/NotificationPermission.js
import { useEffect, useRef, useState } from "react";
import { getMessaging, getToken } from "firebase/messaging";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { auth, firestore } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

const NotificationPermission = () => {
  const registrationRef = useRef(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const registerServiceWorkerAndRequestToken = async (user) => {
      try {
        if (!registrationRef.current) {
          registrationRef.current = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js"
          );
        }

        const messaging = getMessaging();
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
          const fcmToken = await getToken(messaging, {
            vapidKey:
              "BJDlK88EZFINwvRvsoze11NcYHC_pbQ8SX5faZUqfYxO77m8IiBs_ZBgmuACiy-XDMMdAtYqCZxTrZjDAs09qlE",
            serviceWorkerRegistration: registrationRef.current,
          });

          if (fcmToken) {
            // Check if the token is already stored to prevent duplicates
            const q = query(
              collection(firestore, "pushNotifications"),
              where("token", "==", fcmToken)
            );
            const existingDocs = await getDocs(q);

            if (existingDocs.empty) {
              await addDoc(collection(firestore, "pushNotifications"), {
                email: user.email,
                token: fcmToken,
              });
              // console.log("FCM Token stored successfully:", fcmToken);
            } else {
              console.log("FCM Token already exists in Firestore.");
            }
          } else {
            console.log("No FCM token received.");
          }
        } else {
          console.log("Notification permission denied.");
        }

        setIsRegistered(true); // Mark as registered
      } catch (error) {
        console.error("Error getting notification permission or token:", error);
      }
    };

    const unsubscribeFromAuth = onAuthStateChanged(auth, (user) => {
      if (user && !isRegistered) {
        registerServiceWorkerAndRequestToken(user);
      }
    });

    return () => {
      if (unsubscribeFromAuth) {
        unsubscribeFromAuth();
      }
    };
  }, [isRegistered]); // Add isRegistered to dependency array

  return null; // This component doesn't render any UI
};

export default NotificationPermission;
