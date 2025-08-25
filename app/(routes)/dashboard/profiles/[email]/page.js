"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function UserProfile() {
  const { email } = useParams();
  const decodedEmail = decodeURIComponent(email);
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    gender: "",
    profileState: "",
  });

  useEffect(() => {
    async function fetchUserAndAdmin() {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      setLoading(true);
      try {
        // Fetch user data with authorization header
        const res = await fetch(`/api/user/${encodeURIComponent(decodedEmail)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        // console.log(data)
        if (!res.ok) throw new Error(data.error || "User not found");

        // Fetch current user session (admin info) also with auth header
        const userRes = await fetch("/api/auth/session", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!userRes.ok) throw new Error("Not authenticated");
        const adminData = await userRes.json();

        setAdmin(adminData);
        setUser(data.user);
        setForm({
          name: data.name || "",
          phoneNumber: data.phoneNumber || "",
          gender: data.gender || "",
          profileState: data.profileState || "",
        });
        setError("");
      } catch (err) {
        setError(err.message || "User not found");
        setUser(null);
        toast.error(err.message || "Unauthorized");
        if (err.message?.toLowerCase().includes("unauthorized")) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchUserAndAdmin();
  }, [decodedEmail, router]);

  // useEffect(() => {
  //   async function fetchProjects() {
  //     const token = localStorage.getItem("token");
  //     // console.log("Token used for fetch:", localStorage.getItem("token"));

  //     if (!token) {
  //       router.push("/login");
  //       return;
  //     }
  //     try {
  //       const res = await fetch("/api/projects", {
  //         headers: { Authorization: `Bearer ${token}` },
  //       });
  //       if (!res.ok) throw new Error("Failed to fetch projects");

  //       const allProjects = await res.json();

  //       const userProjects = allProjects
  //         .map((project) => {
  //           const participant = project.participants?.find(
  //             (p) => p.email === decodedEmail
  //           );

  //           if (participant) {
  //             return {
  //               ...project,
  //               userRoleInProject: participant.role,
  //               userResponsibility: participant.responsibility,
  //             };
  //           }
  //           return null;
  //         })
  //         .filter(Boolean);

  //       setProjects(userProjects);
  //     } catch (err) {
  //       console.error("Projects fetch error:", err.message);
  //       toast.error("Failed to load projects");
  //       if (err.message?.toLowerCase().includes("unauthorized")) {
  //         router.push("/login");
  //       }
  //     }
  //   }

  //   if (decodedEmail) fetchProjects();
  // }, [decodedEmail, router]);

   useEffect(() => {
  const checkAuthAndLoadProjects = async () => {
    setLoading(true); // Set loading to true when starting
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No token found');
        router.push('/login');
        return;
      }
  
      const res = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to fetch projects');
      }
  
      const data = await res.json();
      console.log(data)
      setProjects(data);
      console.log("Projects : " ,projects)
      
    } catch (err) {
      console.error('Error fetching projects:', err);
      if (err.message === 'Invalid token') {
        router.push('/login');
      }
      setError(err.message);
    } finally {
      setLoading(false); // Set loading to false when done, regardless of success or failure
    }
  };
  
      checkAuthAndLoadProjects();
    }, [decodedEmail,router]);
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };


  

  const handleUpdate = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required.");
      router.push("/login");
      return;
    }
    try {
      const res = await fetch(`/api/user/${encodeURIComponent(decodedEmail)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUser(data);

      setForm({
        name: data.name || "",
        phoneNumber: data.phoneNumber || "",
        gender: data.gender || "",
        profileState: data.profileState || "",
      });

      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Update failed: " + err.message);
    }
  };

  if (loading) return <div className="p-8 text-lg">Loading user profile...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!user) return <div className="p-8">User not found.</div>;

  return (
    <div className="p-6 sm:p-10">
      <Card className="max-w-3xl mx-auto shadow-lg border rounded-2xl overflow-hidden">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center space-x-4">
            <img
              src={user.profileImgUrl || "/user.png"}
              alt="Profile"
              className="w-20 h-20 rounded-full border-4 border-white shadow-md object-cover"
              onError={(e) => (e.currentTarget.src = "/user.png")}
            />
            <div>
              <h2 className="text-2xl font-bold">{user.name || "N/A"}</h2>
              <p className="text-gray-100">{user.email || "N/A"}</p>
              <span className="px-3 py-1 text-sm rounded-full bg-white/20 capitalize">
                {user.role || "N/A"}
              </span>
            </div>
          </div>
        </CardHeader>

        {/* Profile Details */}
        <CardContent className="p-6 space-y-6">
          {isEditing ? (
            <div className="space-y-3">
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Name"
              />
              <Input
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
                placeholder="Phone"
              />
              <Input
                name="gender"
                value={form.gender}
                onChange={handleChange}
                placeholder="Gender"
              />
              <Input
                name="profileState"
                value={form.profileState}
                onChange={handleChange}
                placeholder="Profile State"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Info label="Phone" value={user.phoneNumber || "N/A"} />
              <Info label="Gender" value={user.gender || "N/A"} />
              <Info
                label="Date of Birth"
                value={
                  user.dateOfBirth
                    ? new Date(user.dateOfBirth).toLocaleDateString()
                    : "N/A"
                }
              />
              <Info label="Profile State" value={user.profileState || "N/A"} />
              <Info
                label="Member Since"
                value={
                  user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "N/A"
                }
              />
            </div>
          )}

          {/* Projects Section */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Projects Involved</h3>
            {projects.length > 0 ? (
              <ul className="space-y-3">
                {projects.map((project) => (
                  <li
                    key={project._id}
                    className="p-4 border rounded-lg flex justify-between items-center bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition duration-200 ease-in-out"
                  >
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">
                        {project.projectName}
                      </p>
                      <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">
                        Project Domain:{" "} {project.projectDomain}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Status:{" "}
                        <strong
                          className={`${
                            project.projectState === "completed"
                              ? "text-green-600"
                              : project.projectState === "ongoing"
                              ? "text-blue-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {project.projectState || "N/A"}
                        </strong>
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full capitalize ${
                        project.userRoleInProject === "manager"
                          ? "bg-green-100 text-green-700 border border-green-300"
                          : "bg-blue-100 text-blue-700 border border-blue-300"
                      }`}
                    >
                      {project.roleInProject || "N/A"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm italic">No projects assigned.</p>
            )}
          </div>
        </CardContent>

        {/* Footer */}
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Save</Button>
            </>
          ) : (
            (admin?.role === "admin" || admin?.role === "manager") && (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )
          )}
        </CardFooter>
      </Card>
      <ToastContainer />
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium text-gray-800">{value || "N/A"}</p>
    </div>
  );
}
