"use client";
import React, { useEffect, useState } from "react";

export default function ApproveAttendancePage() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    async function fetchPending() {
      const res = await fetch("/api/attendance/pending", {
        headers: {
          authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      if (res.ok) setRequests(data.pending);
    }
    fetchPending();
  }, []);

  const handleAction = async (id, action) => {
    const res = await fetch(`/api/attendance/approve/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ action }),
    });

    if (res.ok) {
      setRequests(requests.filter((r) => r._id !== id));
    }
  };

  return (
    <div className="p-5">
      <h1 className="text-xl font-bold mb-4">Pending Attendance Requests</h1>
      {requests.map((req) => (
        <div key={req._id} className="flex justify-between items-center border p-3 mb-2 rounded">
          <div>
            <p className="font-medium">{req.userId?.name || "Unknown User"} ({req.userId?.email || "N/A"})</p>
            <p>Date: {new Date(req.date).toDateString()}</p>
          </div>
          <div className="space-x-2">
            <button
              onClick={() => handleAction(req._id, "approve")}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              Approve
            </button>
            <button
              onClick={() => handleAction(req._id, "reject")}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
      {requests.length === 0 && <p>No pending requests</p>}
    </div>
  );
}
