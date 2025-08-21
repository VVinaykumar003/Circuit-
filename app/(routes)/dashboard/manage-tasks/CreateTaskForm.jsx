"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CreateTaskForm({ projectId, currentUser, onTaskCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [participants, setParticipants] = useState([]);
  const [assigneeIds, setAssigneeIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchParticipants() {
      try {
        setError("");
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) throw new Error("Failed to load project participants");
        const project = await res.json();
        setParticipants(project.participants || []);
      } catch (e) {
        setError(e.message);
        setParticipants([]);
      }
    }
    if (projectId) fetchParticipants();
  }, [projectId]);

  async function handleSubmit(e) {
    e.preventDefault();
    // Field validation
    if (!title.trim() || !description.trim()) {
      setError("Please fill in both title and description.");
      return;
    }
    if (assigneeIds.length === 0) {
      setError("Please select at least one person to assign this task.");
      return;
    }

    // 🔹 Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setError("Please log in to create a task.");
      return; // Optional: replace with router.push('/login') to redirect
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        assigneeIds,
        projectId,
        assignedBy: currentUser._id,
      };

      // 🔹 Send token in Authorization header
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create task");
      toast.success("Task created successfully!");
      setTitle("");
      setDescription("");
      setAssigneeIds([]);
      onTaskCreated?.();
      router.push("/dashboard/manage-tasks");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded bg-gray-50">
      <h2 className="text-xl font-bold">Create Task</h2>
      {error && <p className="text-red-600">{error}</p>}

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        required
        className="border rounded w-full px-3 py-2"
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Task description"
        rows={4}
        required
        className="border rounded w-full px-3 py-2"
      />

      <label className="block font-semibold mb-1">Assign Task To</label>
      <select
        multiple
        value={assigneeIds}
        onChange={(e) => setAssigneeIds(Array.from(e.target.selectedOptions).map((o) => o.value))}
        className="border rounded w-full px-3 py-2 h-36"
        required
      >
        {participants.length === 0 && <option disabled>No participants in project</option>}
        {participants
          .filter((p) => (p.userId || p._id) !== currentUser._id)
          .map((p) => (
            <option key={p.userId || p._id} value={p.userId || p._id}>
              {p.username || p.name || p.email} ({p.role})
            </option>
          ))}
      </select>
      <small className="text-gray-500">Hold Ctrl / Cmd to select multiple participants.</small>

      <button
        type="submit"
        disabled={submitting}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? "Creating..." : "Create Task"}
      </button>

      <ToastContainer />
    </form>
  );
}
