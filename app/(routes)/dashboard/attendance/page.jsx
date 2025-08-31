"use client";
import React, { useState, useEffect } from "react";

export default function AttendancePage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);

  // Mark attendance
  const handleMarkAttendance = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/attendance/mark", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: "present" }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Attendance marked successfully!");
        setStatus(data.status || "Pending"); // backend should return default
      } else {
        setMessage(data.error || "Failed to mark attendance");
      }
    } catch (error) {
      setMessage("Error marking attendance");
    } finally {
      setLoading(false);
    }
  };

  // Fetch latest attendance status for this user
  const fetchMyAttendance = async () => {
    try {
      const res = await fetch("/api/attendance/my-latest", {
        headers: {
          authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchMyAttendance();
  }, []);

  return (
    <div className="p-5">
      <h1 className="text-xl font-bold mb-4">Mark Attendance</h1>
      <button
        onClick={handleMarkAttendance}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? "Marking..." : "Mark Present"}
      </button>

      {message && <p className="mt-3 text-green-600">{message}</p>}

      {status && (
        <p className="mt-2">
          <span className="font-bold">Status:</span>{" "}
          <span
            className={
              status === "Approved"
                ? "text-green-600"
                : status === "Rejected"
                ? "text-red-600"
                : "text-yellow-600"
            }
          >
            {status}
          </span>
        </p>
      )}
    </div>
  );
}
