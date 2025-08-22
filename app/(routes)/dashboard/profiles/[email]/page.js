"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function UserProfile() {
  const { email } = useParams();
  const decodedEmail = decodeURIComponent(email);
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [admin ,setAdmin] = useState(null) ; 
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({});

  // Fetch user data
  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      try {
        const res = await fetch(`/api/user/${encodeURIComponent(decodedEmail)}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "User not found");


        const userRes = await fetch("/api/auth/session");
        if (!userRes.ok) throw new Error("Not authenticated");
        const adminData = await userRes.json();
        setAdmin(adminData)
        setUser(data);
        setForm(data);
        setError("");
      } catch (err) {
        setError(err.message || "User not found");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [decodedEmail]);



  // Fetch projects for this user
  // useEffect(() => {
  //   async function fetchProjects() {
  //     try {
  //       const res = await fetch("/api/projects");
  //       if (!res.ok) throw new Error("Failed to fetch projects");

  //       const allProjects = await res.json();


  //         // ✅ loop through projects and access participants
  //   const userProjects =  allProjects.forEach((project) => {
  //       if (project.participants && project.participants.length > 0) {
  //         project.participants.forEach((p) => {
  //           // console.log("Participant Email:", p.email);
  //           // console.log("Role:", p.role);
  //           // console.log("Responsibility:", p.responsibility);

  //           // fetching roles 
  //             const member = p.members?.find((m) => m.email === decodedEmail);
  //           const manager = p.manager?.fint((m)=>m.email === decodedEmail );
  //           if (member) {
  //             return { ...p, userRoleInProject: member.responsibility };
  //           }

  //           if(manager){
  //             return { ...p , userRoleInProject :manager.responsibility };
  //           }

  //           return null;
  //         });
  //       }
  //     }).filter(Boolean);

     

  //       // ✅ Filter projects where this user is in `members`
  //       // const userProjects = allProjects
  //       //   .map((project) => {
  //       //     const member = project.members?.find((m) => m.email === decodedEmail);
  //       //     const manager = project.manager?.fint((m)=>m.email === decodedEmail );
  //       //     if (member) {
  //       //       return { ...project, userRoleInProject: member.role };
  //       //     }

  //       //     if(manager){
  //       //       return { ...project , userRoleInProject :manager.role };
  //       //     }

  //       //     return null;
  //       //   })
  //       //   .filter(Boolean);
       


  //       setProjects(userProjects);
  //     } catch (err) {
  //       console.error("Projects fetch error:", err.message);
  //     }
  //   }

  //   if (decodedEmail) fetchProjects();
  // }, [decodedEmail]);

 useEffect(() => {
  async function fetchProjects() {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");

      const allProjects = await res.json();

      // ✅ Filter projects where this user is in participants
      const userProjects = allProjects
        .map((project) => {
          const participant = project.participants?.find(
            (p) => p.email === decodedEmail
          );

          if (participant) {
            return { ...project, userRoleInProject: participant.role, userResponsibility: participant.responsibility };
          }

          return null;
        })
        .filter(Boolean);

        // console.log('userProjects :',userProjects)

      setProjects(userProjects);
    } catch (err) {
      console.error("Projects fetch error:", err.message);
    }
  }

  if (decodedEmail) fetchProjects();
}, [decodedEmail]);

 
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(`/api/user/${encodeURIComponent(decodedEmail)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUser(data);
      setIsEditing(false);
    } catch (err) {
      alert("Update failed: " + err.message);
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
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-gray-100">{user.email}</p>
              <span className="px-3 py-1 text-sm rounded-full bg-white/20 capitalize">
                {user.role}
              </span>
            </div>
          </div>
        </CardHeader>

        {/* Profile Details */}
        <CardContent className="p-6 space-y-6">
          {isEditing ? (
            <div className="space-y-3">
              <Input name="name" value={form.name || ""} onChange={handleChange} placeholder="Name" />
              <Input name="phoneNumber" value={form.phoneNumber || ""} onChange={handleChange} placeholder="Phone" />
              <Input name="gender" value={form.gender || ""} onChange={handleChange} placeholder="Gender" />
              <Input name="profileState" value={form.profileState || ""} onChange={handleChange} placeholder="Profile State" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Info label="Phone" value={user.phoneNumber} />
              <Info label="Gender" value={user.gender} />
              <Info label="Date of Birth" value={user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "N/A"} />
              <Info label="Profile State" value={user.profileState} />
              <Info label="Member Since" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"} />
            </div>
          )}

          {/* ✅ Projects Section */}
         <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Projects Involved</h3>
              {projects.length > 0 ? (
                <ul className="space-y-3">
                  {projects.map((project) => (
                    <li
                      key={project._id}
                      className="p-4 border rounded-lg flex justify-between items-center 
                                bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition 
                                duration-200 ease-in-out"
                    >
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">
                          {project.projectName}
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
                            {project.projectState}
                          </strong>
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 text-sm font-medium rounded-full capitalize
                          ${
                            project.userRoleInProject === "manager"
                              ? "bg-green-100 text-green-700 border border-green-300"
                              : "bg-blue-100 text-blue-700 border border-blue-300"
                          }`}
                      >
                        {project.userRoleInProject}
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
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleUpdate}>Save</Button>
            </>
          ) : (
           admin?.role==='admin' || admin?.role ==='manager' &&( <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>)
          )}
        </CardFooter>
      </Card>
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
