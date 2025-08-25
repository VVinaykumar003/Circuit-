"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import { Button } from "@/components/ui/button";
import "react-toastify/dist/ReactToastify.css";

export default function ManageAllTasks() {
  const [activeTab, setActiveTab] = useState("tasks"); // "tasks" or "tickets"
  const [tasks, setTasks] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [error, setError] = useState("");
  const [newTicket, setNewTicket] = useState({
    issueTitle: "",
    description: "",
    assignedTo: "",
    priority: "medium",
    startDate: "",
    dueDate: "",
    tag: "other",
  });

  const [loading, setLoading] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  const router = useRouter();

  useEffect(() => {
    async function fetchTasks() {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        setTasksLoading(true);
        const res = await fetch(`/api/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load tasks");
        const data = await res.json();
        const tasksArray = Array.isArray(data) ? data : data.tasks || [];
        setTasks(tasksArray);
        setError("");

        // Extract all tickets from tasks
        const allTickets = tasksArray.flatMap(task => task.tickets || []);
        setTickets(allTickets);

      } catch (e) {
        setError(e.message || "Failed to load tasks");
        toast.error(e.message || "Failed to load tasks");
      } finally {
        setTasksLoading(false);
        setTicketsLoading(false);
      }
    }

    fetchTasks();
  }, [router]);

  function switchTab(tab) {
    setActiveTab(tab);
  }

  async function handleDeleteTask(taskId) {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required.");
        router.push("/login");
        return;
      }
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete task");
      }
      toast.success("Task deleted successfully.");

      // Update UI before refresh
      setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
      setTickets(prevTickets => prevTickets.filter(ticket => ticket.taskId !== taskId));

    } catch (error) {
      toast.error(error.message);
    }
  }

  function handleTicketInputChange(e) {
    const { name, value } = e.target;
    setNewTicket(prev => ({ ...prev, [name]: value }));
  }

  async function createTicket(e) {
    e.preventDefault();

    if (!newTicket.issueTitle.trim()) {
      toast.error("Issue title is required");
      return;
    }

    setSubmittingTicket(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required.");
        router.push("/login");
        return;
      }

      // TODO: Adjust taskId accordingly if multiple tasks; here assumed selected task context needed
      const taskId = ""; // Provide the appropriate taskId

      const res = await fetch(`/api/tasks/${taskId}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newTicket),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create ticket");
      }

      const data = await res.json();
      toast.success("Ticket created successfully.");
      setTickets(prev => [...prev, data.ticket]);
      setNewTicket({
        issueTitle: "",
        description: "",
        assignedTo: "",
        priority: "medium",
        startDate: "",
        dueDate: "",
        tag: "other",
      });

    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingTicket(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex border-b border-gray-300 mb-6">
        <button
          className={`px-4 pb-2 font-semibold ${activeTab === "tasks" ? "border-b-2 border-blue-600" : "text-gray-500"}`}
          onClick={() => switchTab("tasks")}
        >
          Tasks
        </button>
        <button
          className={`ml-6 px-4 pb-2 font-semibold ${activeTab === "tickets" ? "border-b-2 border-blue-600" : "text-gray-500"}`}
          onClick={() => switchTab("tickets")}
        >
          Tickets
        </button>
      </div>

      {activeTab === "tasks" && (
        <>
          {tasksLoading ? (
            <p className="text-center py-10 text-gray-500">Loading tasks…</p>
          ) : error ? (
            <p className="text-center py-10 text-red-600">{error}</p>
          ) : tasks.length === 0 ? (
            <p className="text-center py-10 text-gray-500">No tasks found.</p>
          ) : (
            <table className="w-full table-auto border border-gray-300 rounded">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2 text-left">Title</th>
                  <th className="border px-4 py-2 text-left">Manager</th>
                  <th className="border px-4 py-2 text-left">Members</th>
                  <th className="border px-4 py-2 text-left">Status</th>
                  <th className="border px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t._id} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">{t.title}</td>
                    <td className="border px-4 py-2">{t.manager?.email || "-"}</td>
                    <td className="border px-4 py-2">{(t.assignees || []).map(a => a.user?.email || a.user).join(", ") || "-"}</td>
                    <td className="border px-4 py-2 capitalize">{t.status || "open"}</td>
                    <td className="border px-4 py-2 space-x-2">
                      <Button onClick={() => router.push(`/dashboard/manage-tasks/${t._id}/update`)}>Edit</Button>
                      <Button variant="destructive" onClick={() => handleDeleteTask(t._id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {activeTab === "tickets" && (
        <>
          {ticketsLoading ? (
            <p className="text-center py-10 text-gray-500">Loading tickets…</p>
          ) : tickets.length === 0 ? (
            <p className="text-center py-10 text-gray-500">No tickets found.</p>
          ) : (
            tickets.map(t => (
              <div key={t._id || t.id} className="border p-4 mb-4 rounded bg-gray-50 dark:bg-gray-800">
                <h3 className="text-lg font-semibold">{t.issueTitle}</h3>
                <p className="italic text-sm mb-2">Status: {t.status}</p>
                <p>{t.description}</p>
                <p>Assigned to: {t.assignedTo?.username || t.assignedTo?.email || "Unassigned"}</p>
                <p>Priority: {t.priority}</p>
                <p>Start date: {t.startDate ? new Date(t.startDate).toLocaleDateString() : "-"}</p>
                <p>Due date: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-"}</p>
                <p>Tag: {t.tag}</p>
              </div>
            ))
          )}
        </>
      )}

      <ToastContainer />
    </div>
  );
}
