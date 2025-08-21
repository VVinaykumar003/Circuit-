"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import UserHoverCard from "@/app/_components/UserHoverCard";

// Utility: check if file is image
const isImage = (url) => /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(url);

export default function NotificationPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch current logged-in user
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data) setCurrentUser(data);
      } catch (err) {
        console.error("Error fetching session:", err);
      }
    }
    fetchUser();
  }, []);

  // Fetch all users
  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/user/");
        const data = await res.json();
        if (Array.isArray(data)) setAllUsers(data);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    }
    fetchUsers();
  }, []);

  // Fetch notifications for current user
  useEffect(() => {
    if (!currentUser?.email) return;
    async function fetchNotifications() {
      try {
        const res = await fetch(`/api/notifications?email=${currentUser.email}`);
        const data = await res.json();
        if (Array.isArray(data?.notifications)) {
          setNotifications(data.notifications);
        } else {
          setNotifications([]);
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    }
    fetchNotifications();
  }, [currentUser]);

  // File upload handler
  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const { url } = await res.json();
      return url || "No Files";
    } catch (err) {
      console.error("File upload failed:", err);
      return "No Files";
    }
  };

  // Send notification handler
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!currentUser?.email) {
      toast.error("You must be logged in to send notifications.");
      return;
    }

    setLoading(true);

    let fileURL = "No Files";
    if (selectedFile) {
      fileURL = await handleFileUpload(selectedFile);
    }

    const toEmail = isPublic
      ? allUsers.map((user) => ({ email: user.email, state: "unread" }))
      : selectedUsers.map((user) => ({ email: user.email, state: "unread" }));

    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    const notificationData = {
      fromEmail: currentUser.email,
      msg: { msgcontent: message, source: fileURL },
      dataTo: isPublic ? "public" : "private",
      toEmail,
      date: today,
    };

    try {
      const res = await fetch("/api/notifications/create/w", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(notificationData),
      });

      if (!res.ok) throw new Error("Failed to send notification");

      toast.success("Notification sent successfully!");
      setMessage("");
      setSelectedFile(null);
      setSelectedUsers([]);
      setIsPublic(true);
    } catch (err) {
      console.error("Error sending notification:", err);
      toast.error("Error sending notification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="md:p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold md:mb-6 mb-4 text-gray-900 dark:text-gray-100">
        Notification Page
      </h1>

      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-2xl p-0">
        <Tabs defaultValue="view" className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="view" className="font-semibold text-lg">
              View Notifications
            </TabsTrigger>
            <TabsTrigger value="send" className="font-semibold text-lg">
              Send Notification
            </TabsTrigger>
          </TabsList>

          {/* Send Notification Tab */}
          <TabsContent value="send">
            <Card className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md px-6 py-6 max-w-2xl mx-auto">
              <form onSubmit={handleSendNotification} className="space-y-6">
                {/* Message */}
                <div>
                  <Label
                    htmlFor="message"
                    className="block mb-2 text-base font-semibold text-gray-800 dark:text-gray-100"
                  >
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter your message"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 p-3 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>

                {/* File upload */}
                <div className="p-4 bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                  <Label
                    htmlFor="file"
                    className="block mb-2 font-semibold text-gray-700 dark:text-gray-200"
                  >
                    Add File <span className="text-gray-400 font-normal">(Optional)</span>
                  </Label>
                  <input
                    id="file"
                    type="file"
                    onChange={(e) =>
                      setSelectedFile(e.target.files?.[0] || null)
                    }
                    className="block w-full max-w-xs text-sm border border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition"
                  />
                </div>

                {/* Public/Private Radios */}
                <div className="flex items-center gap-8 ml-1">
                  <Label className="flex items-center cursor-pointer gap-3 text-gray-800 dark:text-gray-100 font-medium">
                    <input
                      type="radio"
                      name="dataTo"
                      checked={isPublic}
                      onChange={() => setIsPublic(true)}
                      className="form-radio h-5 w-5 accent-blue-600 transition-all border-gray-300 focus:ring-2 focus:ring-blue-300"
                    />
                    Public
                  </Label>
                  <Label className="flex items-center cursor-pointer gap-3 text-gray-800 dark:text-gray-100 font-medium">
                    <input
                      type="radio"
                      name="dataTo"
                      checked={!isPublic}
                      onChange={() => setIsPublic(false)}
                      className="form-radio h-5 w-5 accent-blue-600 transition-all border-gray-300 focus:ring-2 focus:ring-blue-300"
                    />
                    Private
                  </Label>
                </div>

                {/* Select Users if Private */}
                {!isPublic && (
                  <div>
                    <Label className="block mb-3 text-base font-semibold text-gray-700 dark:text-gray-200">
                      Select Users:
                    </Label>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-2">
                      {allUsers.map((user) => (
                        <label
                          key={user._id || user.email}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow duration-150"
                        >
                          <input
                            type="checkbox"
                            value={user.email}
                            checked={selectedUsers.some((u) => u.email === user.email)}
                            onChange={(e) => {
                              setSelectedUsers((prev) =>
                                e.target.checked
                                  ? [...prev, user]
                                  : prev.filter((u) => u.email !== user.email)
                              );
                            }}
                            className="h-4 w-4 accent-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-400"
                          />
                          {/* <img
                            src={user.profileImgUrl}
                            alt={user.email}
                            className="h-8 w-8 rounded-full object-cover border border-gray-300 dark:border-gray-600 bg-gray-100"
                          /> */}
                          <span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">
                            {user.email}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full font-semibold py-3 px-6 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow transition"
                >
                  {loading ? "Sending..." : "Send"}
                </Button>
              </form>
            </Card>
          </TabsContent>

          {/* View Notifications Tab */}
          <TabsContent value="view">
            <Card className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md px-6 py-6 max-w-4xl mx-auto">
              <CardHeader className="mb-4">
                <CardTitle>Notifications</CardTitle>
              </CardHeader>

              {notifications.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No notifications found.</p>
              ) : (
                <ul className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {notifications.map((notification, index) => (
                    <li key={notification._id || index}>
                      <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow">
                        <CardHeader className="p-0 mb-2">
                          <div className="flex items-center gap-3">
                            <UserHoverCard email={notification.fromEmail} />
                            <div className="flex flex-col flex-grow min-w-0">
                              <p className="truncate font-semibold text-gray-900 dark:text-gray-100">
                                {notification.fromEmail}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {notification.date}
                              </p>
                              <span
                                className={`inline-block text-xs rounded px-2 py-0.5 mt-1 w-max ${
                                  notification.dataTo === "public"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {notification.dataTo}
                              </span>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="p-0 mt-2 text-gray-800 dark:text-gray-100">
                          <p>
                            <strong>Message:</strong> {notification.msg?.msgcontent}
                          </p>
                          {notification.msg?.source &&
                            notification.msg.source !== "No Files" &&
                            (isImage(notification.msg.source) ? (
                              <div className="flex justify-center mt-3">
                                <img
                                  src={notification.msg.source}
                                  alt="Notification file"
                                  className="rounded-lg object-contain max-w-full max-h-48 border border-gray-300"
                                />
                              </div>
                            ) : (
                              <Link
                                href={notification.msg.source}
                                target="_blank"
                                className="inline-block mt-3 text-blue-600 font-medium hover:underline"
                              >
                                View File
                              </Link>
                            ))}
                        </CardContent>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </Card>

      <ToastContainer />
    </div>
  );
}
