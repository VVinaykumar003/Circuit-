"use client";
import { useState, useEffect } from "react";

export default function CreateTaskPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [users, setUsers] = useState([]);
  const [managerId, setManagerId] = useState("");
  const [memberIds, setMemberIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        if (!res.ok) throw new Error("Failed to load users");
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message);
      }
    };
    fetchUsers();
  }, []);

  const handleMembersChange = (e) => {
    const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
    setMemberIds(opts);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!managerId) {
      setError("Please select a Manager.");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, managerId, memberIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.msg || "Failed to create task");
      alert(data.msg || "Task created!");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create task.");
    } finally {
      setSubmitting(false);
    }
  };

  const managers = users.filter((u) => u.role?.toLowerCase() === "manager");
  const members = users.filter((u) => u.role?.toLowerCase() !== "manager");

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Create Task</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? <p className="text-red-600">{error}</p> : null}

        <input
          type="text"
          placeholder="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 w-full rounded"
          required
        />
        <textarea
          placeholder="Task Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 w-full rounded"
          required
        />

        <div className="space-y-2">
          <label className="font-medium">Manager</label>
          <select
            className="border p-2 w-full rounded"
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            required
          >
            <option value="">Select a manager</option>
            {managers.map((u) => (
              <option key={u._id} value={String(u._id)}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="font-medium">Members</label>
          <select
            multiple
            className="border p-2 w-full rounded h-32"
            value={memberIds}
            onChange={handleMembersChange}
          >
            {members.map((u) => (
              <option key={u._id} value={String(u._id)}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-600">Hold Ctrl/Cmd to select multiple.</p>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? "Creating..." : "Create"}
        </button>
      </form>
    </div>
  );
}
