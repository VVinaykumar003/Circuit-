"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function TaskForm({
  projectId,
  projectName,
  currentUser,
  onTaskSaved,
  existingTask, // pass existing task object for update, or null for create
}) {
  const [title, setTitle] = useState(existingTask?.title || "");
  const [description, setDescription] = useState(existingTask?.description || "");
  const [participants, setParticipants] = useState([]);
  const [assigneeIds, setAssigneeIds] = useState(
    existingTask?.assignees?.map((a) => a.user) || []
  );
  const [priority, setPriority] = useState(existingTask?.priority || "medium");
  const [estimatedHours, setEstimatedHours] = useState(existingTask?.estimatedHours || "");
  const [dueDate, setDueDate] = useState(existingTask?.dueDate?.slice(0, 10) || "");
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
    setError("");

    if (!title.trim() || !description.trim()) {
      setError("Please fill in both title and description.");
      return;
    }
    if (assigneeIds.length === 0) {
      setError("Please select at least one person to assign this task.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentication required");
      router.push("/login");
      return;
    }

    setSubmitting(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      projectId,
      projectName,
      userId: currentUser._id,
      assignees: assigneeIds.map((id) => ({
        user: id,
        state: "assigned",
      })),
      priority,
      estimatedHours,
      dueDate,
    };

    try {
      const res = await fetch(existingTask ? `/api/tasks/${existingTask._id}` : "/api/tasks", {
        method: existingTask ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save task");
      }

      toast.success(existingTask ? "Task updated successfully!" : "Task created successfully!");

      // Show notification for assigned users if permission granted
      if ("Notification" in window && Notification.permission === "granted") {
        assigneeIds.forEach(() => {
          new Notification(existingTask ? "Task Updated" : "New Task Assigned", {
            body: `Task: ${title}`,
            icon: "/Logo.jpeg",
          });
        });
      }

      onTaskSaved?.(data);
      if (!existingTask) {
        setTitle("");
        setDescription("");
        setAssigneeIds([]);
        setPriority("medium");
        setEstimatedHours("");
        setDueDate("");
      }
    } catch (err) {
      console.error("Task save error:", err);
      setError(err.message || "Something went wrong");
      toast.error(err.message || "Failed to save task");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 dark:bg-gray-900  border rounded bg-gray-50">
      <h2 className="text-xl font-bold">{existingTask ? "Update Task" : "Create Task"}</h2>

      {error && <p className="text-red-600">{error}</p>}

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        required
        className="border rounded w-full px-3 py-2 dark:text-gray-300"
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Task description"
        rows={4}
        required
        className="border rounded w-full px-3 py-2 dark:text-gray-300"
      />

      <label className="block font-semibold mb-1">Priority</label>
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        className="border rounded w-full px-3 py-2 dark:text-gray-300"
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>

      <input
        type="number"
        value={estimatedHours}
        onChange={(e) => setEstimatedHours(e.target.value)}
        placeholder="Estimated hours"
        min="1"
        className="border rounded w-full px-3 py-2 dark:text-gray-300"
      />

      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="border rounded w-full px-3 py-2"
      />

      <label className="block font-semibold mb-1 dark:text-gray-300">Assign Task To</label>
      <select
        multiple
        value={assigneeIds}
        onChange={(e) => setAssigneeIds(Array.from(e.target.selectedOptions).map((o) => o.value))}
        className="border rounded w-full px-3 py-2 h-36 dark:text-gray-300"
        required
      >
        {participants.length === 0 && <option disabled>No participants in project</option>}
        {participants
          .filter((p) => (p.userId || p._id) !== currentUser._id)
          .map((p) => (
            <option key={p.userId || p._id} value={p.userId || p._id}>
              {p.username || p.name || p.email} ({p.roleInProject})
            </option>
          ))}
      </select>
      <small className="text-gray-500">Hold Ctrl / Cmd to select multiple participants.</small>

      <button
        type="submit"
        disabled={submitting}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? (existingTask ? "Updating..." : "Creating...") : existingTask ? "Update Task" : "Create Task"}
      </button>

      <ToastContainer />
    </form>
  );
}
