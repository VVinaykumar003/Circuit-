"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function TaskUpdatePage({ currentUser, projectId }) {
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId;

  const [task, setTask] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [managers, setManagers] = useState([]);
  const [members, setMembers] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [managerId, setManagerId] = useState("");
  const [memberIds, setMemberIds] = useState([]);

  const [tickets, setTickets] = useState([]);
  const [newTicket, setNewTicket] = useState({
    issueTitle: "",
    description: "",
    assignedTo: "",
    priority: "medium",
    startDate: "",
    dueDate: "",
    tag: "other",
  });

  const [loadingTask, setLoadingTask] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTask() {
      try {
        setLoadingTask(true);
        const res = await fetch(`/api/tasks/${taskId}`);
        if (!res.ok) throw new Error("Failed to load task");
        const data = await res.json();
        setTask(data);
        setTitle(data.title || "");
        setDescription(data.description || "");
        setManagerId(data.managerId || (data.manager && data.manager._id) || "");
        setMemberIds(data.assignees?.map((u) => u._id || u) || []);
      } catch (e) {
        setError(e.message || "Error loading task");
      } finally {
        setLoadingTask(false);
      }
    }

    async function fetchParticipants() {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) throw new Error("Failed to load project participants");
        const project = await res.json();
        const parts = project.participants || [];
        setParticipants(parts);

        const mgrs = parts.filter((p) =>
          ["admin", "manager", "project-manager"].includes(p.role?.toLowerCase())
        );
        const membs = parts.filter(
          (p) => !["admin", "manager", "project-manager"].includes(p.role?.toLowerCase())
        );

        setManagers(mgrs);
        setMembers(membs);
      } catch (e) {
        setError(e.message);
      }
    }

    async function fetchTickets() {
      try {
        setLoadingTickets(true);
        const res = await fetch(`/api/tasks/${taskId}/ticket`);
        if (!res.ok) throw new Error("Failed to load tickets");
        const data = await res.json();
        setTickets(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoadingTickets(false);
      }
    }

    fetchTask();
    fetchParticipants();
    fetchTickets();
  }, [taskId, projectId]);

  async function handleTaskSubmit(e) {
    e.preventDefault();
    setError("");
    if (!title.trim() || !description.trim()) {
      setError("Please fill in title and description.");
      return;
    }
    if (!managerId) {
      setError("Please select a manager.");
      return;
    }
    setSubmittingTask(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          managerId,
          memberIds,
          assignedBy: currentUser._id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update task");
      toast.success("Task updated!");
      setTask(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmittingTask(false);
    }
  }

  function handleMemberChange(e) {
    const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
    setMemberIds(selected);
  }

  // Ticket Handlers ----------------------------------------------

  function handleNewTicketChange(e) {
    const { name, value } = e.target;
    setNewTicket((prev) => ({ ...prev, [name]: value }));
  }

  async function createTicket(e) {
    e.preventDefault();
    setError("");
    if (!newTicket.issueTitle.trim()) {
      setError("Please enter ticket issue title.");
      return;
    }
    setSubmittingTicket(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/ticket`, {
        method: "POST",
        headers: {
        'Content-Type': 'application/json',
        // ✅👇 This is the missing part!
        'Authorization': `Bearer ${token}`
      },
        body: JSON.stringify(newTicket),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create ticket");
      toast.success("Ticket created!");
      setTickets((prev) => [...prev, data.ticket]);
      setNewTicket({
        issueTitle: "",
        description: "",
        assignedTo: "",
        priority: "medium",
        startDate: "",
        dueDate: "",
        tag: "other",
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmittingTicket(false);
    }
  }

  const canAssignManager = currentUser?.role === "admin";
  const canAssignMembers = ["admin", "manager"].includes(currentUser?.role);

  // Render ------------------------------------------------------

  if (loadingTask) return <p>Loading task...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow space-y-6">
      <h1 className="text-2xl font-bold">Update Task</h1>

      <form onSubmit={handleTaskSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-semibold">Title</label>
          <input
            className="border rounded w-full px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Description</label>
          <textarea
            className="border rounded w-full px-3 py-2"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Manager</label>
          <select
            className="border rounded w-full px-3 py-2"
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            disabled={!canAssignManager}
            required
          >
            <option value="">Select a manager</option>
            {managers.map((m) => (
              <option key={m.userId || m._id} value={m.userId || m._id}>
                {m.username || m.name || m.email} ({m.role})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-semibold">Members</label>
          <select
            multiple
            className="border rounded w-full px-3 py-2 h-32"
            value={memberIds}
            onChange={handleMemberChange}
            disabled={!canAssignMembers}
          >
            {members.map((m) => (
              <option key={m.userId || m._id} value={m.userId || m._id}>
                {m.username || m.name || m.email} ({m.role})
              </option>
            ))}
          </select>
          <small className="text-gray-500 mt-1">
            Hold Ctrl / Cmd to select multiple members.
          </small>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
          disabled={submittingTask}
        >
          {submittingTask ? "Updating task..." : "Update Task"}
        </button>
      </form>

      {/* Tickets Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-3">Tickets</h2>

        {!tickets.length && <p>No tickets yet.</p>}

        {tickets.map((t) => (
          <div
            key={t._id || t.id}
            className="border rounded p-4 mb-3 shadow-sm bg-gray-50 dark:bg-gray-800"
          >
            <strong>{t.issueTitle}</strong>{" "}
            <span className="italic text-sm">[{t.status}]</span>
            <p>{t.description}</p>
            <p>
              Assigned to: {t.assignedTo?.username || t.assignedTo?.name || "Unassigned"}
            </p>
          </div>
        ))}

        {/* New Ticket Form */}
        <form onSubmit={createTicket} className="mt-6 space-y-4 border-t pt-4">
          <h3 className="text-lg font-semibold">Raise a New Ticket</h3>

          <input
            type="text"
            name="issueTitle"
            placeholder="Issue Title"
            value={newTicket.issueTitle}
            onChange={handleNewTicketChange}
            className="border rounded w-full px-3 py-2"
            required
          />
          <textarea
            name="description"
            placeholder="Description"
            rows={3}
            value={newTicket.description}
            onChange={handleNewTicketChange}
            className="border rounded w-full px-3 py-2"
          />

          <select
            name="assignedTo"
            value={newTicket.assignedTo}
            onChange={handleNewTicketChange}
            className="border rounded w-full px-3 py-2"
          >
            <option value="">Assign To (optional)</option>
            {[...managers, ...members].map((p) => (
              <option key={p.userId || p._id} value={p.userId || p._id}>
                {p.username || p.name || p.email} ({p.role})
              </option>
            ))}
          </select>

          <select
            name="priority"
            value={newTicket.priority}
            onChange={handleNewTicketChange}
            className="border rounded w-full px-3 py-2"
            required
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent</option>
          </select>

          <label>
            Start Date{" "}
            <input
              type="date"
              name="startDate"
              value={newTicket.startDate}
              onChange={handleNewTicketChange}
              className="border rounded px-2 py-1"
            />
          </label>

          <label>
            Due Date{" "}
            <input
              type="date"
              name="dueDate"
              value={newTicket.dueDate}
              onChange={handleNewTicketChange}
              className="border rounded px-2 py-1"
            />
          </label>

          <select
            name="tag"
            value={newTicket.tag}
            onChange={handleNewTicketChange}
            className="border rounded w-full px-3 py-2"
          >
            <option value="bug">Bug</option>
            <option value="development">Development</option>
            <option value="other">Other</option>
          </select>

          <button
            type="submit"
            disabled={submittingTicket}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-60"
          >
            {submittingTicket ? "Creating Ticket..." : "Raise Ticket"}
          </button>
        </form>
      </div>

      <ToastContainer />
    </div>
  );
}
