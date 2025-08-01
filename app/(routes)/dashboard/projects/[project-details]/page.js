"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
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
import { getAllProjects, getUserData, getAllUsers } from "@/lib/getUserData"; // Adjust import according to your project structure
import { firestore } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  onSnapshot,
  arrayUnion,
  runTransaction,
} from "firebase/firestore"; // Adjust import according to your project structure
import Image from "next/image"; // Import Image component
import { Loader2 } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import Link from "next/link";
import Modal from "../../_components/Model";
import UserHoverCard from "@/app/_components/UserHoverCard";

export default function ProjectDetails() {
  const [updatesByDate, setUpdatesByDate] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pathname = usePathname();
  const projectName = pathname.split("/").pop(); // Extract project name from path
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todayUpdate, setTodayUpdate] = useState("");
  const [announcementMsg, setAnnouncementMsg] = useState("");
  const [user, setUser] = useState(null);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isUserAuthorized, setIsUserAuthorized] = useState(false);
  const [file, setFile] = useState(null);
  const [filePost, setFilePost] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
  };
  const handleFileChangePost = (e) => {
    setFilePost(e.target.files[0] || null);
  };

  useEffect(() => {
    async function fetchProject() {
      try {
        const projectsList = await getAllProjects(); // Fetch all projects
        const matchedProject = projectsList.find(
          (project) => project.projectName === projectName
        ); // Find the matching project
        setProject(matchedProject);
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchUser() {
      try {
        const userData = await getUserData(); // Fetch current user data
        setUser(userData);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    }

    fetchProject();
    fetchUser();
  }, [projectName]);

  useEffect(() => {
    if (project && user) {
      const isAuthorized = project.participants.some(
        (participant) =>
          participant.email === user.email &&
          (participant.responsibility === "project-manager" ||
            participant.responsibility === "project-member")
      );
      setIsUserAuthorized(isAuthorized);
    }
  }, [project, user]);

  useEffect(() => {
    const announcementsRef = collection(firestore, "projectUpdates");
    const q = query(announcementsRef, where("projectName", "==", projectName));

    const unsubscribeAnnouncements = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        console.log("No project found for the specified projectName.");
        setLoading(false);
        return;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      if (!data || !data.announcement) {
        console.log("No announcements found for this project.");
        setLoading(false);
        return;
      }

      // Fetch user data directly from users collection
      const usersRef = collection(firestore, "users");
      const unsubscribeUsers = onSnapshot(usersRef, (userSnapshot) => {
        const allUsers = userSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Process announcements
        const processedAnnouncements = data.announcement.map((announcement) => {
          const fromUser = allUsers.find(
            (user) => user.email === announcement.fromEmail
          );
          return {
            ...announcement,
            fromUser, // Attach user data
          };
        });

        // Reverse the order of announcements
        const reversedAnnouncements = processedAnnouncements.reverse();

        setAnnouncements(reversedAnnouncements);
        setLoading(false);
      });

      return () => unsubscribeUsers();
    });

    return () => unsubscribeAnnouncements();
  }, [projectName]);

  useEffect(() => {
    const updatesRef = collection(firestore, "projectUpdates");
    const q = query(updatesRef, where("projectName", "==", projectName));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        console.log("No project found for the specified projectName.");
        setLoading(false);
        return;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      if (!data || !data.updates) {
        console.log("No updates found for this project.");
        setLoading(false);
        return;
      }

      // Group updates by date
      const groupedUpdates = data.updates.reduce((acc, update) => {
        if (!acc[update.date]) {
          acc[update.date] = [];
        }
        acc[update.date].push(update);
        return acc;
      }, {});

      // Sort dates in descending order
      const sortedUpdatesByDate = Object.keys(groupedUpdates)
        .sort((a, b) => new Date(b) - new Date(a))
        .reduce((acc, date) => {
          acc[date] = groupedUpdates[date];
          return acc;
        }, {});

      setUpdatesByDate(sortedUpdatesByDate);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectName]);

  const handleUpdateToday = async () => {
    setLoadingUpdate(true);
    let fileUrl = "No Files"; // Default value
    if (!todayUpdate) {
      toast.error("Update can't be empty");
      setLoadingUpdate(false);

      return;
    }
    if (file) {
      try {
        const fileRef = ref(storage, `project-files/${file.name}`);
        await uploadBytes(fileRef, file);
        fileUrl = await getDownloadURL(fileRef);
      } catch (err) {
        setError(`Error uploading file: ${err.message}`);
        setLoading(false);
        return;
      }
    }

    try {
      const updatesRef = collection(firestore, "projectUpdates");
      const q = query(updatesRef, where("projectName", "==", projectName));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast.success("No project found for the specified projectName.");

        setLoadingUpdate(false);
        return;
      }

      const docRef = querySnapshot.docs[0].ref;

      // Use Firestore's runTransaction method
      await runTransaction(firestore, async (transaction) => {
        const docSnap = await transaction.get(docRef);
        const data = docSnap.data();

        if (!data || !data.updates) {
          throw new Error("No data or updates field found in the document.");
        }

        const existingUpdateIndex = data.updates.findIndex(
          (update) => update.email === user.email && update.date === today
        );

        const updatedUpdates = [...data.updates];

        if (existingUpdateIndex !== -1) {
          updatedUpdates[existingUpdateIndex] = {
            email: user.email,
            date: today,
            workUpdate: {
              msg: todayUpdate,
              source: fileUrl,
            },
          };
        } else {
          updatedUpdates.push({
            email: user.email,
            date: today,
            workUpdate: {
              msg: todayUpdate,
              source: fileUrl,
            },
          });
        }

        transaction.update(docRef, { updates: updatedUpdates });
      });

      toast.success("Work update added successfully!");
    } catch (error) {
      console.error("Error updating work:", error);
      toast.success(`An error occurred while updating work: ${error.message}`);
    } finally {
      setLoadingUpdate(false);
    }
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (!project) {
    return <div className="text-center">Project not found</div>;
  }

  // Extract project details
  const {
    projectName: pname,
    projectState,
    projectDomain,
    startDate,
    endDate,
    participants,
  } = project;

  const handlePostAnnouncement = async () => {
    // You can replace this with the actual message input
    // Replace with the actual file input if needed
    setLoadingUpdate(true);
    let fileUrl = "No Files"; // Default value
    if (!announcementMsg) {
      toast.error("Post can't be empty");
      setLoadingUpdate(false);

      return;
    }
    if (filePost) {
      try {
        const fileRef = ref(storage, `announcement-files/${filePost.name}`);
        await uploadBytes(fileRef, filePost);
        fileUrl = await getDownloadURL(fileRef);
      } catch (err) {
        setLoadingUpdate(false);
        console.error(`Error uploading file: ${err.message}`);
        return;
      }
    }

    try {
      const updatesRef = collection(firestore, "projectUpdates");
      const q = query(updatesRef, where("projectName", "==", projectName));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast.error("No project found for the specified projectName.");
        return;
      }

      const docRef = querySnapshot.docs[0].ref;

      // Use Firestore's runTransaction method
      await runTransaction(firestore, async (transaction) => {
        const docSnap = await transaction.get(docRef);
        const data = docSnap.data();

        if (!data) {
          throw new Error("No data found in the document.");
        }

        const newAnnouncement = {
          fromEmail: user.email,
          date: today,
          post: {
            msg: announcementMsg,
            file: fileUrl,
          },
          toEmail: participants.map((participant) => ({
            email: participant.email,
            state: participant.email === user.email ? false : true,
          })),
        };

        const updatedAnnouncements = arrayUnion(newAnnouncement);

        transaction.update(docRef, {
          announcement: updatedAnnouncements,
        });
      });

      const title = `New Announcement at ${projectName}`;
      const body =
        announcementMsg.length > 40
          ? `${announcementMsg.substring(0, 40)}...`
          : announcementMsg;

      const apiCalls = participants.map(async (participant) => {
        const response = await fetch("/api/sendNotifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: participant.email,
            notification: {
              title,
              body,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(
            `Failed to send notification to ${participant.email}`
          );
        }
      });

      await Promise.all(apiCalls);

      toast.success("Announcement posted successfully!");
    } catch (error) {
      setLoadingUpdate(false);
      console.error("Error posting announcement:", error);
      toast.error(
        `An error occurred while posting the announcement: ${error.message}`
      );
    }
    setLoadingUpdate(false);
  };

  // Get project managers and members
  const projectManager = participants.find(
    (participant) => participant.responsibility === "project-manager"
  );
  const projectMembers = participants.filter(
    (participant) => participant.responsibility === "project-member"
  );

  const handleShowModal = (message) => {
    setSelectedMessage(message);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMessage(null);
  };
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <Tabs defaultValue="information" className="w-full">
        <TabsList className="grid w-full md:grid-cols-3 gap-2 h-full grid-cols-2">
          <TabsTrigger value="information">Information</TabsTrigger>
          <TabsTrigger value="work-updates">Work Updates</TabsTrigger>
          <TabsTrigger
            value="announcements"
            className="w-full  flex items-center justify-center"
          >
            Announcements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="information">
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>
                Details about the project. {projectDomain}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex md:flex-nowrap flex-wrap flex-row gap-2 md:gap-4">
                <div className="space-y-1 w-full">
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input id="projectName" value={pname} readOnly />
                </div>

                <div className="space-y-1 w-full">
                  <Label htmlFor="projectState">Project State</Label>
                  <Input id="projectState" value={projectState} readOnly />
                </div>
              </div>
              <div className="flex flex-row md:flex-nowrap flex-wrap  gap-2 md:gap-4">
                <div className="space-y-1 w-full">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    readOnly
                  />
                </div>
                <div className="space-y-1 w-full">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" type="date" value={endDate} readOnly />
                </div>
              </div>
              {projectManager && (
                <div className="mt-4 pt-2">
                  <strong>Project Manager:</strong>
                  <div className="flex items-center pt-2 space-x-4">
                    <div className="w-12 h-12">
                      <UserHoverCard email={projectManager.email} />
                    </div>
                    <div className="flex flex-col truncate">
                      <div className="font-medium truncate w-48">
                        {projectManager.username}
                      </div>
                      <div className="text-sm text-gray-500 truncate w-48">
                        {projectManager.email}
                      </div>
                      <div className="text-sm text-gray-500 truncate w-32">
                        {projectManager.role}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {projectMembers.length > 0 && (
                <div className="mt-4 pt-2">
                  <strong>Project Members:</strong>
                  <div className="grid grid-cols-1 pt-2 md:grid-cols-1 lg:grid-cols-2 gap-2">
                    {projectMembers.map((member, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="w-12 h-12">
                          <UserHoverCard email={member.email} />
                        </div>
                        <div className="flex flex-col truncate">
                          <div className="font-medium truncate w-48">
                            {member.username}
                          </div>
                          <div className="text-sm text-gray-500 truncate w-48">
                            {member.email}
                          </div>
                          <div className="text-sm text-gray-500 truncate w-32">
                            {member.role}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              {user.role !== "member" && (
                <Link href={`/dashboard/projects/${projectName}/update`}>
                  <Button>Update</Button>
                </Link>
              )}
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="work-updates">
          <Card>
            <CardHeader>
              <CardTitle>Work Updates</CardTitle>
              <CardDescription>
                Track the latest work updates for this project.
              </CardDescription>
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
                      <Input
                        id="source"
                        type="file"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                  <Button onClick={handleUpdateToday} disabled={loadingUpdate}>
                    {loadingUpdate ? (
                      <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    ) : (
                      "Submit Update"
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center text-gray-500">
                  {!isUserAuthorized &&
                    " You are not authorized to submit work updates for this project."}
                  {project.projectState === "completed" &&
                    " This Project Completed."}
                </div>
              )}

              {(isUserAuthorized ||
                user.role === "admin" ||
                user.role === "manager") && (
                <div>
                  {Object.entries(updatesByDate).map(([date, updates]) => (
                    <div key={date} className="mb-4">
                      <h3 className="font-semibold">{date}</h3>
                      <ul>
                        <Table>
                          <TableCaption>
                            A list of participant updates.
                          </TableCaption>
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
                                (update) => update.email === participant.email
                              );

                              return (
                                <TableRow key={participant.email}>
                                  <TableCell className="truncate">
                                    <div className="flex flex-row items-center gap-2 justify-start">
                                    <div className="w-9 h-9">
                                      <UserHoverCard
                                        email={participant.email}
                                      />
                                    </div>
                                    <div>
                                      <p className="truncate overflow-x-hidden">{participant.email}</p>
                                      <p>Role: {participant.role}</p>
                                    </div>
                                    </div>
                                  </TableCell>
                             
                                  <TableCell>
                                    {userUpdate
                                      ? "✅ Updated"
                                      : "❌ Not Updated"}
                                  </TableCell>
                                  <TableCell className="truncate overflow-hidden">
                                    {userUpdate ? (
                                      <Button
                                        onClick={() =>
                                          handleShowModal(
                                            userUpdate.workUpdate.msg
                                          )
                                        }
                                        className="  "
                                      >
                                        Message
                                      </Button>
                                    ) : (
                                      <div className="text-cente">
                                        No Updates
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {userUpdate?.workUpdate.source ===
                                    "No Files" ? (
                                      <Button className="text-center w-full cursor-default truncate dark:text-black hover:bg-slate-950 dark:hover:bg-slate-200 text-white overflow-hidden py-2 bg-slate-950 dark:bg-slate-200 rounded-lg px-2">
                                        No Files
                                      </Button>
                                    ) : (
                                      userUpdate && (
                                        <Button className=" dark:text-black text-center text-white px-2 py-2 w-full dark:bg-slate-200 bg-slate-950 rounded-lg px-2 w-full">
                                          <Link
                                            target="_blank"
                                            href={userUpdate?.workUpdate.source}
                                            className="text-center truncate overflow-hidden "
                                          >
                                            {userUpdate.workUpdate.source.includes(
                                              ".jpg"
                                            ) ||
                                            userUpdate.workUpdate.source.includes(
                                              ".jpeg"
                                            ) ||
                                            userUpdate.workUpdate.source.includes(
                                              ".png"
                                            )
                                              ? "View Image"
                                              : "Source Link"}
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
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            {isUserAuthorized && <CardFooter></CardFooter>}
          </Card>
        </TabsContent>

        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <CardTitle>Announcements</CardTitle>
              <CardDescription>
                Project announcements and notices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {isUserAuthorized &&
              project.projectState === "ongoing" &&
              user.role !== "member" ? (
                <div className="space-y-1">
                  <Label htmlFor="announcementMsg">Post</Label>
                  <Input
                    id="announcementMsg"
                    value={announcementMsg}
                    onChange={(e) => setAnnouncementMsg(e.target.value)}
                    placeholder="Enter your announcement for today"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="postImg">Project Source</Label>
                    <Input
                      id="postImg"
                      type="file"
                      onChange={handleFileChangePost}
                    />
                  </div>
                  <Button
                    onClick={handlePostAnnouncement}
                    disabled={loadingUpdate}
                  >
                    {loadingUpdate ? (
                      <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    ) : (
                      "Post Announcement"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  {!isUserAuthorized &&
                    " You are not authorized to post announcements for this project."}
                  {project.projectState === "completed" &&
                    " This Project Completed."}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <CardContent className="px-0 w-full">
                {isUserAuthorized ||
                user.role === "admin" ||
                user.role === "manager" ? (
                  <div className=" px-0  grid grid-cols-1 gap-1 md:grid-cols-1  lg:grid-cols-2 md:gap-5 ">
                    {announcements.map((announcement, index) => (
                      <Card
                        key={index}
                        className="p-4  bg-white dark:bg-gray-800 rounded-lg shadow-md"
                      >
                        <div className="flex items-center border-b  pb-2 mb-2">
                          <div className="w-10 h-10 flex-shrink-0">
                            <UserHoverCard
                              email={announcement.fromUser?.email}
                            />
                          </div>
                          <div className="ml-2 ">
                            <div className="font-semibold">
                              {announcement.fromUser?.name || "Unknown User"}
                            </div>
                            <div className="text-sm overflow-x-hidden truncate w-min text-gray-500">
                              {/* {announcement.fromUser?.email} */}
                            </div>
                            <div className="text-sm text-gray-500">
                              {announcement.date}
                            </div>
                          </div>
                        </div>
                        
                        <p className="mb-4">{announcement.post.msg}</p>
                        {announcement.post.file && (
                          <div className="mb-4">
                            {announcement.post.file.includes(".jpg") ||
                            announcement.post.file.includes(".png") ||
                            announcement.post.file.includes(".jpeg") ? (
                              <div className="flex justify-center items-center">
                                <Image
                                  src={announcement.post.file}
                                  alt="Announcement file"
                                  width={200}
                                  height={150}
                                  className="rounded-lg object-cover"
                                />
                              </div>
                            ) : announcement.post.file === "No Files" ? (
                              <></>
                            ) : (
                              <Link
                                href={announcement.post.file}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
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
                    {!isUserAuthorized &&
                      " You are not authorized to view announcements for this project."}
                    {project.projectState === "completed" &&
                      " This Project Completed."}
                  </div>
                )}
              </CardContent>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      <ToastContainer />
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        message={selectedMessage}
      />
    </div>
  );
}
