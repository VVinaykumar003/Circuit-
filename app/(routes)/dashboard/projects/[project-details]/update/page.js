"use client";
import React, { useState, useEffect } from "react";
import { firestore, auth } from "@/lib/firebase";
import {
  doc,
  updateDoc,
  getDocs,
  query,
  where,
  collection,
} from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getUserData, getAllUsers } from "@/lib/getUserData";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import Image from "next/image";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { onAuthStateChanged } from "firebase/auth";

const UpdateProject = () => {
  const [formData, setFormData] = useState({
    projectName: "",
    projectState: "ongoing",
    projectDomain: "",
    startDate: "",
    endDate: "",
  });
  const [participants, setParticipants] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [emailOptions, setEmailOptions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedResponsibility, setSelectedResponsibility] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const [currentUserRole, setCurrentUserRole] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userData = await getUserData();
          setCurrentUserRole(userData.role);
        } catch (err) {
          setError(`Error fetching user data: ${err.message}`);
        } finally {
          setLoading(false);
        }
      } else {
        setError("No authenticated user.");
        setLoading(false);
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUserRole === "member") {
      router.push("/dashboard");
    }
  }, [currentUserRole]);
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const projectName = pathname.split("/")[3];
        const projectQuery = query(
          collection(firestore, "projects"),
          where("projectName", "==", projectName)
        );
        const querySnapshot = await getDocs(projectQuery);
        if (!querySnapshot.empty) {
          const projectDoc = querySnapshot.docs[0];
          const projectData = projectDoc.data();
          setFormData({
            projectName: projectData.projectName,
            projectState: projectData.projectState,
            projectDomain: projectData.projectDomain,
            startDate: projectData.startDate,
            endDate: projectData.endDate,
          });
          setParticipants(projectData.participants);
        } else {
          toast.error("Project not found.");
          router.push("/dashboard");
        }
      } catch (error) {
        toast.error(`Error fetching project: ${error.message}`);
      }
    };

    fetchProject();
  }, [pathname, router]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await getAllUsers();
        setAllUsers(users);
        setEmailOptions(
          users.map((user) => ({ value: user.email, label: user.email }))
        );
      } catch (err) {
        setError(`Error fetching users: ${err.message}`);
      }
    };

    fetchUsers();
  }, []);

  const handleSelect = (currentValue) => {
    const user = allUsers.find((user) => user.email === currentValue);
    if (user) {
      setSelectedUser(user.email);
      setSelectedUserData(user);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateProjectName = (name) => /^[a-zA-Z0-9-_]+$/.test(name);

  const validateDates = (startDate, endDate) =>
    new Date(startDate) <= new Date(endDate);

  const handleAddParticipant = () => {
    if (!selectedUser || !selectedRole || !selectedResponsibility) {
      toast.error("Please select all fields for the participant.");
      return;
    }

    if (participants.find((p) => p.email === selectedUser)) {
      toast.error("Participant already added.");
      return;
    }

    setParticipants([
      ...participants,
      {
        email: selectedUser,
        role: selectedRole,
        responsibility: selectedResponsibility,
        profileImage: selectedUserData?.profileImgUrl,
        userRole: selectedUserData?.role,
        username: selectedUserData?.name,
      },
    ]);

    setSelectedUser(null);
    setSelectedRole("");
    setSelectedResponsibility("");
  };

  const handleRemoveParticipant = (email) => {
    setParticipants(participants.filter((p) => p.email !== email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!validateDates(formData.startDate, formData.endDate)) {
      setError("End date cannot be earlier than the start date.");
      setLoading(false);
      return;
    }

    const projectManagerCount = participants.filter(
      (p) => p.responsibility === "project-manager"
    ).length;
    if (projectManagerCount !== 1) {
      setError("There must be exactly one project manager.");
      setLoading(false);
      return;
    }

    const projectMemberCount = participants.filter(
      (p) => p.responsibility === "project-member"
    ).length;
    if (projectMemberCount < 1) {
      setError("There must be at least one project member.");
      setLoading(false);
      return;
    }

    try {
      const projectName = formData.projectName.toLowerCase();
      const projectsRef = collection(firestore, "projects");
      const q = query(projectsRef, where("projectName", "==", projectName));
      const querySnapshot = await getDocs(q);

      const projectDoc = querySnapshot.docs[0]?.ref;
      if (projectDoc) {
        await updateDoc(projectDoc, {
          projectState: formData.projectState,
          projectDomain: formData.projectDomain,
          endDate: formData.endDate,
          participants,
        });

        toast.success("Project updated successfully!");
        router.push("/dashboard");
      } else {
        toast.error("Project not found.");
      }
    } catch (err) {
      setError(err.message);
      toast.error(`Error updating project: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if(!currentUserRole){
    return <div className="text-center">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Update Project</h2>
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
          <CardDescription>Update the project details below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              name="projectName"
              value={formData.projectName}
              readOnly
              className="bg-gray-200 dark:bg-gray-700"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="projectState">Project State</Label>
            <select
              id="projectState"
              name="projectState"
              value={formData.projectState}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              value={formData.startDate}
              readOnly
              className="bg-gray-200 dark:bg-gray-700"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="projectDomain">Project Domain</Label>
            <select
              id="projectDomain"
              name="projectDomain"
              value={formData.projectDomain}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="">Select a domain</option>
              <option value="web-development">Web Development</option>
              <option value="android-development">Android Development</option>
              <option value="social-media">Social Media</option>
              <option value="blockchain">Blockchain</option>
              <option value="aiml">AI/ML</option>
              <option value="designing">Designing</option>
              <option value="content-writing">Content Writing</option>
            </select>
          </div>
          <div className="space-y-4 w-full">
            <div className="flex flex-col w-full lg:flex-row lg:items-center lg:justify-between lg:gap-4 gap-2">
              <div className="flex w-full gap-4">
                <div className="space-y-1 w-full pt-2 flex flex-col">
                  <Label htmlFor="selectUser">Select User</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="justify-between w-full "
                      >
                        {selectedUser ? selectedUser : "Select user..."}
                        <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className=" p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search user..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No user found.</CommandEmpty>
                          <CommandGroup>
                            {emailOptions.map((option) => (
                              <CommandItem
                                key={option.value}
                                value={option.value}
                                onSelect={() => handleSelect(option.value)}
                              >
                                <div className="flex items-center space-x-4">
                                  {/* User profile image */}
                                  <Image
                                    src={
                                      allUsers.find(
                                        (user) => user.email === option.value
                                      )?.profileImgUrl || "/user.png"
                                    }
                                    alt="User Avatar"
                                    width={40} // Set width as per your design requirement
                                    height={40} // Set height as per your design requirement
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                  <div className="flex-1">
                                    <div className="font-semibold">
                                      {allUsers.find(
                                        (user) => user.email === option.value
                                      )?.name || "Unknown User"}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {allUsers.find(
                                        (user) => user.email === option.value
                                      )?.email || option.value}
                                      <br />
                                      {allUsers.find(
                                        (user) => user.email === option.value
                                      )?.role || "No Role"}
                                    </div>
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex w-full gap-4">
                <div className="space-y-1 w-full">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-gray-300"
                  >
                    <option value="">Select Role</option>

                    <option value="content">Content</option>
                    <option value="research">Research</option>
                    <option value="design">Design</option>
                    <option value="development">Development</option>
                    <option value="frontend">Frontend</option>
                    <option value="backend">Backend</option>
                    <option value="fullstack">Full Stack</option>
                    <option value="testing">Testing</option>
                    <option value="debugging">Debugging</option>
                    <option value="deployment">Deployment</option>
                    <option value="maintain">Maintain</option>
                  </select>
                </div>
              </div>

              <div className="flex w-full gap-4">
                <div className="space-y-1 w-full">
                  <Label htmlFor="responsibility">Responsibility</Label>
                  <select
                    id="responsibility"
                    value={selectedResponsibility}
                    onChange={(e) => setSelectedResponsibility(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-gray-300"
                  >
                    <option value="">Select Responsibility</option>
                    <option value="project-manager">Project Manager</option>
                    <option value="project-member">Project Member</option>
                  </select>
                </div>
              </div>
            </div>
            <Button
              type="submit"
              onClick={handleAddParticipant}
              disabled={
                !selectedUser || !selectedRole || !selectedResponsibility
              }
            >
              Add Participant
            </Button>
          </div>
          <div className="space-y-1">
            <Label>Current Participants</Label>
            <div className="grid grid-cols-1 gap-2">
              {participants.map((p) => (
                <Card
                  key={p.email}
                  className="flex md:items-center pt-4 md:flex-row  flex-col"
                >
                  <CardContent className="flex flex-col w-full p-4">
                    <div className="flex flex-row items-center space-x-2">
                      {p.profileImage && (
                        <div className="flex-shrink-0">
                          <Image
                            src={p.profileImage}
                            alt={`${p.username}'s profile`}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        </div>
                      )}
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-semibold truncate">
                          {p.username || p.email}
                        </span>
                        <span className="font-semibold text-sm truncate">
                          {p.email}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="block truncate">{p.role}</span>
                      <span className="block truncate">{p.responsibility}</span>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button
                      variant="destructive"
                      onClick={() => handleRemoveParticipant(p.email)}
                    >
                      Remove
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 w-full">
          {error && (
            <div className="text-red-700 w-full bg-red-100 rounded p-2 ">
              {error}
            </div>
          )}
          <Button
            variant=""
            onClick={handleSubmit}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Updating..." : "Update Project"}
          </Button>
        </CardFooter>
      </Card>

      <ToastContainer />
    </div>
  );
};

export default UpdateProject;
