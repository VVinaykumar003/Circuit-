"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ManageTasksPage({ projectId }) {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch("/api/tasks");
        if (!res.ok) throw new Error("Failed to load tasks");
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message);
      }
    }
    fetchTasks();
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (tasks.length === 0) return <p>No tasks found.</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Manage Tasks</h1>
      <Link href={`./create`} className="inline-block mb-5 bg-blue-600 text-white px-4 py-2 rounded">
        Create New Task
      </Link>
      <ul className="divide-y">
        {tasks.map((task) => (
          <li key={task._id} className="py-2 flex justify-between items-center">
            <div>
              <strong>{task.title}</strong><br />
              <small>Status: {task.status || "Open"}</small>
            </div>
            <Link
              href={`./task/${task._id}/update`}
              className="text-blue-600 underline hover:no-underline"
            >
              Edit
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
