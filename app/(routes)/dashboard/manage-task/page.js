"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function ManageTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch("/api/tasks");
        if (!res.ok) throw new Error("Failed to load tasks");
        const data = await res.json();
        setTasks(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, []);

  if (loading) {
    return <p className="p-4">Loading tasks...</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Tasks</h1>

      <div className="flex justify-end mb-4">
        <Link href="/dashboard/manage-tasks/create">
          <Button>Create Task</Button>
        </Link>
      </div>

      {tasks.length === 0 ? (
        <p>No tasks found.</p>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="p-4 border rounded-lg shadow-sm bg-white dark:bg-slate-900"
            >
              <h2 className="text-lg font-semibold">{task.title}</h2>
              <p className="text-sm text-gray-500">{task.description}</p>
              <div className="mt-2 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`/dashboard/manage-tasks/${task._id}/update`)
                  }
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (confirm("Are you sure?")) {
                      await fetch(`/api/tasks/${task._id}`, {
                        method: "DELETE",
                      });
                      setTasks(tasks.filter((t) => t._id !== task._id));
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ManageTasksPage;
