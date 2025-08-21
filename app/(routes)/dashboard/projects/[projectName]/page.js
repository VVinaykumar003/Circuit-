"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
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

export default function ProjectDetails() {
  const [updatesByDate, setUpdatesByDate] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todayUpdate, setTodayUpdate] = useState("");
  const [announcementMsg, setAnnouncementMsg] = useState("");
  const [user, setUser] = useState(null);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [isUserAuthorized, setIsUserAuthorized] = useState(false);
  const [file, setFile] = useState(null);
  const [filePost, setFilePost] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const { projectName } = useParams();

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      }),
    []
  );

  // --- helpers ---
  const isoToYMD = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");
  const prettyDate = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "";

  // ---- fetch project + user
  useEffect(() => {
    async function fetchProjectAndUser() {
      if (!projectName) return;
      setLoading(true);
      try {
        const projectRes = await fetch(`/api/projects/${projectName}`);
        if (!projectRes.ok) throw new Error("Project not found");
        const projectData = await projectRes.json();
       
        setProject(projectData);


        const userRes = await fetch("/api/auth/session");
        if (!userRes.ok) throw new Error("Not authenticated");
        const userData = await userRes.json();
        // console.log("UserData : ",userData);
        setUser(userData);

       

        const isAuthorized = projectData?.participants?.some(
          (p) =>
            p.email === userData.email &&
            (p.role === "project-manager" || p.role === "project-member")
        );
        setIsUserAuthorized(!!isAuthorized);
      } catch (err) {
        console.error("Fetch Error:", err);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProjectAndUser();
  }, [projectName]);

  // ---- fetch updates & announcements
  useEffect(() => {
    if (!projectName) return;

    async function fetchAnnouncements() {
      try {
        const res = await fetch(
          `/api/projectUpdates/announcements?projectName=${projectName}`
        );
        if (!res.ok) throw new Error("Failed to load announcements");
        const data = await res.json();
        setAnnouncements(data.announcement?.slice().reverse() || []);
      } catch (err) {
        toast.error(err.message);
      }
    }

    async function fetchUpdates() {
      try {
        const res = await fetch(
          `/api/projectUpdates/updates?projectName=${projectName}`
        );
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const data = await res.json();

        const grouped = data.updates.reduce((acc, update) => {
          if (!acc[update.date]) acc[update.date] = [];
          acc[update.date].push(update);
          return acc;
        }, {});
        const sorted = Object.keys(grouped)
          .sort((a, b) => new Date(b) - new Date(a))
          .reduce((acc, d) => {
            acc[d] = grouped[d];
            return acc;
          }, {});
        setUpdatesByDate(sorted);
      } catch (err) {
        toast.error(err.message);
      }
    }

    fetchAnnouncements();
    fetchUpdates();
  }, [projectName]);

  const handleFileChange = (e) => setFile(e.target.files[0] || null);
  const handleFileChangePost = (e) => setFilePost(e.target.files[0] || null);

  const handleUpdateToday = async () => {
    if (!todayUpdate) {
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
          workUpdate: { msg: todayUpdate, source: fileUrl },
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
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handlePostAnnouncement = async () => {
    if (!announcementMsg) {
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
          post: { msg: announcementMsg, file: fileUrl },
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
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleShowModal = (message) => {
    setSelectedMessage(message);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMessage(null);
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!project) return <div className="text-center py-10">Project not found</div>;

  const {
    projectName: pname,
    projectState,
    projectDomain,
    startDate,
    endDate,
    participants = [],
  } = project || {};

  const projectManager = participants.find((p) => p.role === "project-manager");
  const projectMembers = participants.filter((p) => p.responsibility === "project-member");

  console.log("role" , user?.role)


  return (
    <div className="max-w-5xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <Tabs defaultValue="information" className="w-full">
        <TabsList className="grid w-full md:grid-cols-3 gap-2 h-full grid-cols-2">
          <TabsTrigger value="information">Information</TabsTrigger>
          <TabsTrigger value="work-updates">Work Updates</TabsTrigger>
          <TabsTrigger value="announcements" className="w-full">
            Announcements
          </TabsTrigger>
        </TabsList>

        {/* ========== INFORMATION TAB ========== */}
        <TabsContent value="information">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-3">
                <span className="truncate">{pname}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    projectState === "ongoing"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {projectState}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                  {projectDomain}
                </span>
              </CardTitle>
              <CardDescription>
                Timeline:{" "}
                <span className="font-medium">
                  {prettyDate(startDate)} — {prettyDate(endDate)}
                </span>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Dates (read-only inputs expect YYYY-MM-DD) */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" type="date" value={isoToYMD(startDate)} readOnly />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" type="date" value={isoToYMD(endDate)} readOnly />
                </div>
              </div>

              {/* Team & Responsibilities */}
              <div>
                <h4 className="text-lg font-semibold mb-2">Team & Responsibilities</h4>

                {/* Manager */}
                {projectManager && (
                  <div className="mb-4 p-3 rounded-xl border bg-gray-50 dark:bg-gray-800/50">
                    <div className="text-sm text-gray-500 mb-2">Project Manager</div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10">
                             <UserHoverCard  email={projectManager.email} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          
                          {projectManager.username || projectManager.email}
                        </span>
                        <span className="text-xs text-gray-500">
                          Responsibility:{" "}
                          <span className="inline-block px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                            {projectManager.responsibility || "—"}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Members */}
                <div className="grid sm:grid-cols-2 gap-3">
                  {projectMembers.length > 0 ? (
                    projectMembers.map((m, idx) => (
                     
                      <div
                        key={idx}
                        className="p-3 rounded-xl border bg-white dark:bg-gray-800/30 flex items-center gap-3"
                      >
                        
                        <div className="w-10 h-10">
                          <UserHoverCard email={m.email} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{m.username || m.email}</span>
                          <div className="text-xs text-gray-500 flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700">
                              {m.role}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                              {m.responsibility || "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No members added yet.</div>
                  )}
                </div>
              </div>
            </CardContent>

            <CardFooter className="justify-end">
              {(user?.role === "admin" || user?.role === "manager") && (
                <Link href={`/dashboard/projects/${projectName}/update`}>
                  <Button>Update</Button>
                </Link>
              )}
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ========== WORK UPDATES TAB ========== */}
        <TabsContent value="work-updates">
          <Card>
            <CardHeader>
              <CardTitle>Work Updates</CardTitle>
              <CardDescription>Track the latest work updates for this project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isUserAuthorized && project.projectState === "ongoing" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="workUpdate">Your Work Update</Label>
                    <Input
                      id="workUpdate"
                      value={todayUpdate}
                      onChange={(e) => setTodayUpdate(e.target.value)}
                      placeholder="Enter your work update for today"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="source">Attach File (optional)</Label>
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

              {(isUserAuthorized || ["admin", "manager"].includes(user?.role)) && (
                <div className="mt-2">
                  {Object.entries(updatesByDate).map(([date, updates]) => (
                    <div key={date} className="mb-6">
                      <h3 className="font-semibold mb-2">{date}</h3>
                      <Table>
                        <TableCaption>Participant updates</TableCaption>
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
                            const userUpdate = updates.find(
                              (u) => u.email === participant.email
                            );
                            return (
                              <TableRow key={participant.email}>
                                <TableCell className="truncate">
                                  <div className="flex items-center gap-2">
                                    <div className="w-9 h-9">
                                      <UserHoverCard email={participant.email} />
                                    </div>
                                    <div>
                                      <p className="truncate">{participant.email}</p>
                                      <p className="text-xs text-gray-500">
                                        Role: {participant.role} • Resp:{" "}
                                        {participant.responsibility || "—"}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>

                                <TableCell>
                                  {userUpdate ? "✅ Updated" : "❌ Not Updated"}
                                </TableCell>

                                <TableCell className="truncate">
                                  {userUpdate ? (
                                    <Button
                                      variant="outline"
                                      onClick={() => handleShowModal(userUpdate.workUpdate.msg)}
                                    >
                                      View Message
                                    </Button>
                                  ) : (
                                    <div className="text-center text-gray-500">No Updates</div>
                                  )}
                                </TableCell>

                                <TableCell>
                                  {userUpdate?.workUpdate?.source === "No Files" ? (
                                    <span className="inline-block text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700">
                                      No Files
                                    </span>
                                  ) : (
                                    userUpdate && (
                                      <Button variant="outline" className="w-full">
                                        <Link
                                          target="_blank"
                                          href={userUpdate.workUpdate.source}
                                          className="truncate block"
                                        >
                                          {/\.(jpg|jpeg|png|gif|webp)$/i.test(
                                            userUpdate.workUpdate.source
                                          )
                                            ? "View Image"
                                            : "Open File"}
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== ANNOUNCEMENTS TAB ========== */}
        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <CardTitle>Announcements</CardTitle>
              <CardDescription>Project announcements and notices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isUserAuthorized && project.projectState === "ongoing" && user?.role !== "member" ? (
                <div className="space-y-2">
                  <Label htmlFor="announcementMsg">Post</Label>
                  <Input
                    id="announcementMsg"
                    value={announcementMsg}
                    onChange={(e) => setAnnouncementMsg(e.target.value)}
                    placeholder="Enter your announcement"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="postImg">Attach File (optional)</Label>
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

              {(isUserAuthorized || ["admin", "manager"].includes(user?.role)) && (
                <div className="grid md:grid-cols-2 gap-4">
                  {announcements.map((a, idx) => (
                    <Card key={idx} className="p-4">
                      <div className="flex items-center border-b pb-2 mb-2">
                        <div className="w-10 h-10 flex-shrink-0">
                          <UserHoverCard email={a.fromUser?.email || a.fromEmail} />
                        </div>
                        <div className="ml-2">
                          <div className="font-semibold">{a.fromUser?.name || a.fromEmail}</div>
                          <div className="text-sm text-gray-500">{a.date}</div>
                        </div>
                      </div>
                      <p className="mb-3">{a.post?.msg}</p>
                      {a.post?.file && a.post.file !== "No Files" && (
                        <div>
                          {/\.png|\.jpe?g|\.gif|\.webp$/i.test(a.post.file) ? (
                            <div className="flex justify-center">
                              <Image
                                src={a.post.file}
                                alt="Announcement file"
                                width={360}
                                height={220}
                                className="rounded-md object-cover"
                              />
                            </div>
                          ) : (
                            <Link
                              href={a.post.file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline text-sm"
                            >
                              Download File
                            </Link>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
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
