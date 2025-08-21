"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import Modal from "../../_components/Model";
import UserHoverCard from "@/app/_components/UserHoverCard";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Loader2 } from "lucide-react";
import CreateTaskForm from "@/app/(routes)/dashboard/manage-tasks/CreateTaskForm";

export default function ProjectDetails() {
  const [updatesByDate, setUpdatesByDate] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todayUpdate, setTodayUpdate] = useState("");
  const [announcementMsg, setAnnouncementMsg] = useState("");
  const [user, setUser] = useState(null);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [isUserAuthorized, setIsUserAuthorized] = useState(false);
  const [file, setFile] = useState(null);
  const [filePost, setFilePost] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  const router = useRouter();
  const { projectName } = useParams();

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      }),
    []
  );

  const isoToYMD = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");
  const prettyDate = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "";

  // Fetch project and user
  useEffect(() => {
    async function fetchProjectAndUser() {
      if (!projectName) return;
      setLoading(true);
      try {
        const projectRes = await fetch(`/api/projects/${projectName}`, {
          credentials: "include", // REQUIRED for cookie auth
        });
        if (!projectRes.ok) {
          console.error("Project fetch error", await projectRes.text(), projectRes.status);
          throw new Error("Project not found");
        }
        const projectData = await projectRes.json();
        setProject(projectData);

        const userRes = await fetch("/api/auth/session", {
          credentials: "include", // REQUIRED for cookie auth
        });
        if (!userRes.ok) {
          console.error("Session fetch error", await userRes.text(), userRes.status);
          throw new Error("Not authenticated");
        }
        const userData = await userRes.json();
        setUser(userData);

        const isAuthorized = projectData?.participants?.some(
          (p) =>
            p.email === userData.email && (p.role === "project-manager" || p.role === "project-member")
        );
        setIsUserAuthorized(!!isAuthorized);
      } catch (err) {
        console.error("Fetch error", err);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProjectAndUser();
  }, [projectName]);

  // Fetch tasks
  useEffect(() => {
    if (!projectName) return;
    async function fetchTasks() {
      setTasksLoading(true);
      try {
        const res = await fetch(`/api/tasks?projectName=${encodeURIComponent(projectName)}`, {
          credentials: "include", // REQUIRED for cookie auth
        });
        if (!res.ok) {
          console.error("Tasks fetch error", await res.text(), res.status);
          throw new Error("Failed to load tasks");
        }
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : data.tasks || []);
      } catch (e) {
        console.error("Tasks error", e);
        toast.error(e.message || "Failed to load tasks");
      } finally {
        setTasksLoading(false);
      }
    }
    fetchTasks();
  }, [projectName]);

  // Refresh tasks (e.g., after create)
  const refreshTasks = async () => {
    try {
      const res = await fetch(`/api/tasks?projectName=${encodeURIComponent(projectName)}`, {
        credentials: "include", // REQUIRED for cookie auth
      });
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : data.tasks || []);
    } catch (e) {
      console.error("Tasks refresh error", e);
    }
  };

  const projectManager = project?.participants.find((p) => p.role === "project-manager");
  const projectMembers = project?.participants.filter((p) => p.role === "project-member");

  // Modal close handler
  function handleCloseModal() {
    setIsModalOpen(false);
    setSelectedMessage(null);
  }

  // Show loading until user and project are set
  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!project || !user) return <div className="text-center py-10">Project not found</div>;

  // Render UI
  return (
    <div className="max-w-5xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <Tabs defaultValue="information" className="w-full">
        <TabsList className="grid w-full md:grid-cols-4 gap-2 h-full grid-cols-3">
          <TabsTrigger value="information">Information</TabsTrigger>
          <TabsTrigger value="work-updates">Work Updates</TabsTrigger>
          <TabsTrigger value="announcements" className="w-full">
            Announcements
          </TabsTrigger>
          <TabsTrigger value="manage-tasks" className="w-full">
            Tasks
          </TabsTrigger>
        </TabsList>

        {/* Other tabs omitted for brevity */}

        <TabsContent value="manage-tasks">
          <Card>
            <CardHeader>
              <CardTitle>Manage Tasks</CardTitle>
              <CardDescription>Create and track tasks for this project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(["admin", "manager"].includes(user?.role) || projectManager?.email === user?.email) ? (
                <>
                  <CreateTaskForm
                    projectId={project._id}
                    currentUser={user}
                    onTaskCreated={refreshTasks}
                  />
                  {tasksLoading ? (
                    <p className="text-gray-500">Loading tasks…</p>
                  ) : tasks.length === 0 ? (
                    <p className="text-gray-500">No tasks yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Manager</TableHead>
                          <TableHead>Members</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tasks.map((t) => (
                          <TableRow key={t._id || t.id}>
                            <TableCell className="font-medium">{t.title}</TableCell>
                            <TableCell>{t.manager?.name || t.manager?.email || t.managerName || "—"}</TableCell>
                            <TableCell>
                              {(t.members || t.memberIds || []).map((m, i) => (
                                <span
                                  key={i}
                                  className="inline-block mr-2 mb-1 text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700"
                                >
                                  {m.name || m.email || m.username || String(m)}
                                </span>
                              ))}
                            </TableCell>
                            <TableCell>{t.status || "open"}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                onClick={() => router.push(`/dashboard/manage-tasks/${t._id || t.id}/update`)}
                              >
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </>
              ) : (
                <p className="text-center text-gray-500">
                  Only project managers or admins can create tasks for this project.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <ToastContainer />
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} message={selectedMessage} />
    </div>
  );
}
