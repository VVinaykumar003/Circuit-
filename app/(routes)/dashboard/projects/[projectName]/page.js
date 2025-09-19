"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  TableFooter,
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
import { Loader2 } from "lucide-react";
import CreateTaskForm from "../../manage-tasks/CreateTaskForm";

export default function ProjectDetails() {
  const pathname = usePathname();
  const router = useRouter();
  const projectName = pathname.split("/").pop() || "";

  // State variables
  const [project, setProject] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todayUpdate, setTodayUpdate] = useState("");
  const [announcementMsg, setAnnouncementMsg] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [updatesByDate, setUpdatesByDate] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [isUserAuthorized, setIsUserAuthorized] = useState(false);
  const [adminCheck, setAdminCheck] = useState(false);
  const [file, setFile] = useState(null);
  const [filePost, setFilePost] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  const today = new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });

  // Fetch project and user data once projectName is available
  useEffect(() => {
    if (!projectName) return;

    async function fetchProjectAndUser() {
      setLoading(true);
      try {
        const [projectRes, userRes] = await Promise.all([
          fetch(`/api/projects/${projectName}`),
          fetch("/api/auth/session"),
        ]);

        if (!projectRes.ok) throw new Error("Project not found");
        if (!userRes.ok) throw new Error("Not authenticated");

        const projectData = await projectRes.json();
        setProject(projectData);

        const userData = await userRes.json();
        setUser(userData);

        // Set admin/manager check
        const isAdminOrManager = ["admin", "manager"].includes(userData.role);
        setAdminCheck(isAdminOrManager);

        // Check if user is participant and authorized
        const isAuthorized = projectData.participants.some(
          (p) =>
            p.email === userData.email &&
            (p.roleInProject === "project-manager" || p.roleInProject === "project-member")
        );
        setIsUserAuthorized(isAuthorized);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProjectAndUser();
  }, [projectName]);

  // Fetch updates & announcements whenever project._id changes
  useEffect(() => {
    if (!project?._id) return;

    async function fetchUpdatesAndAnnouncements() {
      try {
        const res = await fetch(`/api/projectUpdates/${project._id}`);
        if (!res.ok) throw new Error("Failed to fetch updates and announcements");

        const data = await res.json();

        if (data.updates) {
          // Group updates by date
          const grouped = data.updates.reduce((acc, update) => {
            if (!acc[update.date]) acc[update.date] = [];
            acc[update.date].push(update);
            return acc;
          }, {});
          setUpdatesByDate(grouped);
        }

        if (data.announcements) {
          // Reverse to show newest first
          setAnnouncements(data.announcements.slice().reverse());
        }
      } catch (err) {
        console.error("Error fetching updates and announcements:", err);
      }
    }

    fetchUpdatesAndAnnouncements();
  }, [project?._id]);

  // Refresh Tasks (you can call this on demand)
  const refreshTasks = async () => {
    if (!projectName) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required");

      const res = await fetch(`/api/tasks?projectName=${encodeURIComponent(projectName)}`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to refresh tasks");
      }

      const data = await res.json();
      setTasks(Array.isArray(data) ? data : data.tasks || []);
    } catch (err) {
      console.error("Tasks refresh error:", err);
      toast.error(err.message);
    }
  };

  // Submit today's work update
  const handleUpdateToday = async () => {
    if (!todayUpdate.trim()) {
      toast.error("Update can't be empty");
      return;
    }

    setLoadingUpdate(true);

    try {
      let fileUrl = "No Files";

      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) throw new Error("File upload failed");
        const uploadData = await uploadRes.json();

        fileUrl = uploadData.url;
      }

      const body = {
        projectName,
        update: {
          email: user.email,
          date: today,
          workUpdate: {
            msg: todayUpdate,
            source: fileUrl,
          },
        },
      };

      const res = await fetch("/api/projectUpdates/addUpdate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add update");
      }

      toast.success("Work update added successfully!");
      setTodayUpdate("");
      setFile(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingUpdate(false);
    }
  };

  // Submit announcements (only for authorized)
  const handlePostAnnouncement = async () => {
    if (!announcementMsg.trim()) {
      toast.error("Post can't be empty");
      return;
    }

    setLoadingUpdate(true);

    try {
      let fileUrl = "No Files";

      if (filePost) {
        const formData = new FormData();
        formData.append("file", filePost);

        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) throw new Error("File upload failed");
        const uploadData = await uploadRes.json();

        fileUrl = uploadData.url;
      }

      const body = {
        projectName,
        announcement: {
          fromEmail: user.email,
          date: today,
          post: {
            msg: announcementMsg,
            file: fileUrl,
          },
          toEmail: project.participants.map((p) => ({
            email: p.email,
            state: p.email === user.email ? false : true,
          })),
        },
      };

      const res = await fetch("/api/projectUpdates/addAnnouncement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to post announcement");
      }

      toast.success("Announcement posted successfully!");
      setAnnouncementMsg("");
      setFilePost(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingUpdate(false);
    }
  };

  // Modal handlers
  const handleShowModal = (message) => {
    setSelectedMessage(message);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMessage(null);
  };

  // File input handlers
  const handleFileChange = (e) => setFile(e.target.files[0] || null);
  const handleFileChangePost = (e) => setFilePost(e.target.files[0] || null);

  if (loading) return <div className="text-center">Loading...</div>;
  if (!project) return <div className="text-center">Project not found</div>;

  const {
    projectName: pname,
    projectState,
    projectDomain,
    startDate,
    endDate,
    participants,
  } = project;

  const projectManager = participants.find((p) => p.roleInProject === "project-manager");
  const projectMembers = participants.filter((p) => p.roleInProject === "project-member");

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <Tabs defaultValue="information" className="w-full">
        <TabsList className="grid w-full md:grid-cols-3 gap-2 h-full grid-cols-2">
          <TabsTrigger value="information">Information</TabsTrigger>
          <TabsTrigger value="work-updates">Work Updates</TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center justify-center">
            Announcements
          </TabsTrigger>
          {user && user.role !== "member" && <TabsTrigger value="manage-tasks">Create Task</TabsTrigger>}
        </TabsList>

        {/* Information Tab */}
        <TabsContent value="information">
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>Details about the project. {projectDomain}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex md:flex-nowrap flex-wrap gap-2 md:gap-4">
                <div className="space-y-1 w-full">
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input id="projectName" value={pname} readOnly />
                </div>
                <div className="space-y-1 w-full">
                  <Label htmlFor="projectState">Project State</Label>
                  <Input id="projectState" value={projectState} readOnly />
                </div>
              </div>
              <div className="flex flex-row md:flex-nowrap flex-wrap gap-2 md:gap-4">
                <div className="space-y-1 w-full">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" type="date" value={formatDate(startDate)} readOnly />
                </div>
                <div className="space-y-1 w-full">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" type="date" value={formatDate(endDate)} readOnly />
                </div>
              </div>

              {projectManager && (
                <div className="mt-4 pt-2">
                  <strong>Project Manager:</strong>
                  <div className="flex items-center pt-2 space-x-4">
                    <div className="w-10 h-10">
                      <UserHoverCard email={projectManager.email} />
                    </div>
                    <div className="flex flex-col truncate">
                      <div className="font-medium truncate w-48">{projectManager.username}</div>
                      <div className="text-sm text-gray-500 truncate w-48">{projectManager.email}</div>
                      <div className="text-sm text-gray-500 truncate w-32">{projectManager.role}</div>
                    </div>
                  </div>
                </div>
              )}

              {projectMembers.length > 0 && (
                <div className="mt-4 pt-2">
                  <strong>Project Members:</strong>
                  <div className="grid grid-cols-1 pt-2 md:grid-cols-1 lg:grid-cols-2 gap-2">
                    {projectMembers.map((member, idx) => (
                      <div key={idx} className="flex items-center space-x-4">
                        <div className="w-10 h-10">
                          <UserHoverCard email={member.email} />
                        </div>
                        <div className="flex flex-col truncate">
                          <div className="font-medium truncate w-48">{member.username}</div>
                          <div className="text-sm text-gray-500 truncate w-48">{member.email}</div>
                          <div className="text-sm text-gray-500 truncate w-32">{member.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>{user?.role !== "member" && <Link href={`/dashboard/projects/${projectName}/update`}><Button>Update</Button></Link>}</CardFooter>
          </Card>
        </TabsContent>

        {/* Work Updates Tab */}
        <TabsContent value="work-updates">
          <Card>
            <CardHeader>
              <CardTitle>Work Updates</CardTitle>
              <CardDescription>Track the latest work updates for this project.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-2">
              {isUserAuthorized && project.projectState === "ongoing" ? (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="workUpdate">Your Work Update</Label>
                    <Input
                      id="workUpdate"
                      value={todayUpdate}
                      onChange={(e) => setTodayUpdate(e.target.value)}
                      placeholder="Enter your work update for today"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="source">Project Source</Label>
                      <Input id="source" type="file" onChange={handleFileChange} />
                    </div>
                  </div>
                  <Button onClick={handleUpdateToday} disabled={loadingUpdate}>
                    {loadingUpdate ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : "Submit Update"}
                  </Button>
                </>
              ) : (
                <div className="text-center text-gray-500">
                  {!isUserAuthorized && "You are not authorized to submit work updates for this project."}
                  {project.projectState === "completed" && "This Project Completed."}
                </div>
              )}

              {adminCheck && Object.entries(updatesByDate).map(([date, updates]) => (
                <div key={date} className="mb-4">
                  <h3 className="font-semibold">{date}</h3>
                  <Table>
                    <TableCaption>A list of participant updates.</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Update</TableHead>
                        <TableHead>Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participants.map((participant) => {
                        const userUpdate = updates.find((u) => u.email === participant.email);
                        return (
                          <TableRow key={participant.email}>
                            <TableCell>
                              <div className="flex flex-row items-center gap-2 justify-start">
                                <div className="w-9 h-9"><UserHoverCard email={participant.email} /></div>
                                <div>
                                  <p className="truncate overflow-x-hidden">{participant.email}</p>
                                  <p>Role: {participant.role}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{userUpdate ? "✅ Updated" : "❌ Not Updated"}</TableCell>
                            <TableCell>
                              {userUpdate ? (
                                <Button onClick={() => handleShowModal(userUpdate.workUpdate.msg)}>Message</Button>
                              ) : (
                                <div className="text-center">No Updates</div>
                              )}
                            </TableCell>
                            <TableCell>
                              {userUpdate?.workUpdate.source === "No Files" ? (
                                <Button className="text-center w-full cursor-default truncate dark:text-black hover:bg-slate-950 dark:hover:bg-slate-200 text-white overflow-hidden py-2 bg-slate-950 dark:bg-slate-200 rounded-lg px-2">
                                  No Files
                                </Button>
                              ) : (
                                userUpdate && (
                                  <Button className="dark:text-black text-center text-white px-2 py-2 w-full dark:bg-slate-200 bg-slate-950 rounded-lg">
                                    <Link target="_blank" href={userUpdate.workUpdate.source} className="text-center truncate overflow-hidden">
                                      {userUpdate.workUpdate.source.match(/\.(jpg|jpeg|png)$/i) ? "View Image" : "Source Link"}
                                    </Link>
                                  </Button>
                                )
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </CardContent>

            {adminCheck && <CardFooter /> }
          </Card>
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <CardTitle>Announcements</CardTitle>
              <CardDescription>Project announcements and notices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {isUserAuthorized && project.projectState === "ongoing" && user?.role !== "member" ? (
                <div className="space-y-1">
                  <Label htmlFor="announcementMsg">Post</Label>
                  <Input id="announcementMsg" value={announcementMsg} onChange={(e) => setAnnouncementMsg(e.target.value)} placeholder="Enter your announcement for today" />
                  <div className="space-y-1">
                    <Label htmlFor="postImg">Project Source</Label>
                    <Input id="postImg" type="file" onChange={handleFileChangePost} />
                  </div>
                  <Button onClick={handlePostAnnouncement} disabled={loadingUpdate}>
                    {loadingUpdate ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : "Post Announcement"}
                  </Button>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  {!isUserAuthorized && "You are not authorized to post announcements for this project."}
                  {project.projectState === "completed" && "This Project Completed."}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <CardContent className="px-0 w-full">
                {(isUserAuthorized || ["admin", "manager"].includes(user?.role)) ? (
                  <div className="px-0 grid grid-cols-1 gap-1 md:grid-cols-1 lg:grid-cols-2 md:gap-5">
                    {announcements.map((announcement, index) => (
                      <Card key={index} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <div className="flex items-center border-b pb-2 mb-2">
                          <div className="w-10 h-10 flex-shrink-0">
                            <UserHoverCard email={announcement.fromUser?.email} />
                          </div>
                          <div className="ml-2">
                            <div className="font-semibold">{announcement.fromUser?.name || "Unknown User"}</div>
                            <div className="text-sm overflow-x-hidden truncate w-min text-gray-500"></div>
                            <div className="text-sm text-gray-500">{announcement.date}</div>
                          </div>
                        </div>
                        <p className="mb-4">{announcement.post.msg}</p>
                        {announcement.post.file && (
                          <div className="mb-4">
                            {announcement.post.file.match(/\.(jpg|jpeg|png)$/i) ? (
                              <div className="flex justify-center items-center">
                                <Image src={announcement.post.file} alt="Announcement file" width={200} height={150} className="rounded-lg object-cover" />
                              </div>
                            ) : announcement.post.file === "No Files" ? null : (
                              <Link href={announcement.post.file} target="_blank" rel="noopener noreferrer">
                                Download File
                              </Link>
                            )}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center flex items-center justify-center text-gray-500">
                    {!isUserAuthorized && "You are not authorized to view announcements for this project."}
                    {project.projectState === "completed" && "This Project Completed."}
                  </div>
                )}
              </CardContent>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Manage Tasks Tab */}
        {user && user.role !== "member" && (
          <TabsContent value="manage-tasks">
            <CreateTaskForm projectId={project._id} projectName={project.projectName} currentUser={user} onTaskCreated={refreshTasks} />
          </TabsContent>
        )}
      </Tabs>

      <ToastContainer />
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} message={selectedMessage} />
    </div>
  );
}
