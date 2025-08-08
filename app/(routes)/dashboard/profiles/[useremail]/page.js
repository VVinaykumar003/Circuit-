"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import MyProjects from "../../page";
import { Button } from "@/components/ui/button";
import "react-toastify/dist/ReactToastify.css";

const UserProfile = () => {
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedData, setUpdatedData] = useState({});
  const [profileImgFile, setProfileImgFile] = useState(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const trimmedUserEmail = pathname.split("/").pop() + "@gmail.com";

  // Check current session and fetch user role
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) throw new Error("Not authenticated");
        const user = await res.json();
        setCurrentUserRole(user.role);
      } catch {
        setError("No authenticated user.");
        setLoading(false);
        router.push("/login");
      }
    }
    fetchSession();
  }, [router]);

  // Fetch user data for profile
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`/api/users/${trimmedUserEmail}`);
        if (!res.ok) throw new Error("User not found");
        const data = await res.json();
        setUserData(data);
        setUpdatedData(data);
      } catch (err) {
        setError("User not found");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [trimmedUserEmail]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileImgChange = (e) => {
    if (e.target.files[0]) setProfileImgFile(e.target.files[0]);
  };

  const handleUpdateProfile = async () => {
    if (!userData) return;
    let profileImgUrl = updatedData.profileImgUrl;
    try {
      // If uploading a new image
      if (profileImgFile) {
        setUploadingImg(true);
        const formData = new FormData();
        formData.append("file", profileImgFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) throw new Error("Failed to upload image");
        const uploadData = await uploadRes.json();
        profileImgUrl = uploadData.url;
        setUploadingImg(false);
      }

      // Update user in MongoDB via backend
      const res = await fetch(`/api/users/${userData.email}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updatedData,
          profileImgUrl,
        }),
      });
      if (!res.ok) throw new Error("Failed to update profile");

      setUpdatedData((prev) => ({ ...prev, profileImgUrl }));
      toast.success("Profile Successfully Updated");
      setIsEditing(false);
      setProfileImgFile(null);
      // Refresh userData from API for consistency
      const data = await res.json();
      setUserData(data);
    } catch (error) {
      setError(error.message || "Error updating profile");
      setUploadingImg(false);
    }
  };

  const handleCancelUpdate = () => {
    setUpdatedData(userData); // Revert changes
    setIsEditing(false);
    setProfileImgFile(null);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {userData ? (
            <>
              <div className="flex items-center space-x-4">
                <div className="flex flex-col gap-2">
                  <img
                    src={updatedData.profileImgUrl || "/default-profile.png"}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                  {isEditing && (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImgChange}
                      className="mt-2"
                    />
                  )}
                </div>
                {!isEditing && (
                  <div>
                    <h2 className="text-2xl font-bold">{userData.name}</h2>
                    <p className="text-gray-600">{userData.email}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:gap-4 ">
                  <div className="w-full">
                    <label className="font-bold">Email:</label>
                    <input
                      type="text"
                      name="email"
                      value={updatedData.email}
                      readOnly
                      className="w-full cursor-not-allowed mt-1 p-2 border rounded"
                    />
                  </div>
                  <div className="w-full">
                    <label className="font-bold">Name:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={updatedData.name}
                        onChange={handleInputChange}
                        className="w-full mt-1 p-2 border rounded"
                      />
                    ) : (
                      <input
                        type="text"
                        name="name"
                        value={updatedData.name}
                        readOnly
                        className="w-full cursor-not-allowed mt-1 p-2 border rounded"
                      />
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 md:flex-row md:gap4">
                  <div className="w-full">
                    <label className="font-bold">Phone Number:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="phoneNumber"
                        value={updatedData.phoneNumber}
                        onChange={handleInputChange}
                        className="w-full mt-1 p-2 border rounded"
                      />
                    ) : (
                      <input
                        type="text"
                        name="phoneNumber"
                        value={updatedData.phoneNumber}
                        readOnly
                        className="w-full cursor-not-allowed mt-1 p-2 border rounded"
                      />
                    )}
                  </div>
                  <div className="w-full">
                    <label className="font-bold">Date of Birth:</label>
                    {isEditing ? (
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={updatedData.dateOfBirth}
                        onChange={handleInputChange}
                        className="w-full mt-1 p-2 border rounded"
                      />
                    ) : (
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={updatedData.dateOfBirth}
                        readOnly
                        className="w-full cursor-not-allowed mt-1 p-2 border rounded"
                      />
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 md:flex-row md:gap-4">
                  <div className="w-full">
                    <label className="font-bold">Gender:</label>
                    {isEditing ? (
                      <select
                        name="gender"
                        value={updatedData.gender}
                        onChange={handleInputChange}
                        className="w-full mt-1 p-2 border rounded"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        name="gender"
                        value={updatedData.gender}
                        readOnly
                        className="w-full cursor-not-allowed mt-1 p-2 border rounded"
                      />
                    )}
                  </div>
                  <div className="w-full">
                    <label className="font-bold">Role:</label>
                    {isEditing ? (
                      <select
                        name="role"
                        value={updatedData.role}
                        onChange={handleInputChange}
                        className="w-full mt-1 p-2 border rounded"
                      >
                        <option value="member">Member</option>
                        <option value="manager">Manager</option>
                        {currentUserRole === 'admin' && <option value="admin">Admin</option>}
                      </select>
                    ) : (
                      <input
                        type="text"
                        name="role"
                        value={updatedData.role}
                        readOnly
                        className="w-full cursor-not-allowed mt-1 p-2 border rounded"
                      />
                    )}
                  </div>
                  <div className="w-full">
                    <label className="font-bold">Profile State:</label>
                    {isEditing ? (
                      <select
                        name="profileState"
                        value={updatedData.profileState}
                        onChange={handleInputChange}
                        className="w-full mt-1 p-2 border rounded"
                      >
                        <option value="active">Active</option>
                        <option value="deactivated">Deactivated</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        name="profileState"
                        value={updatedData.profileState}
                        readOnly
                        className="w-full cursor-not-allowed mt-1 p-2 border rounded"
                      />
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p>No user data found</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start space-y-4">
          {currentUserRole !== "member" &&
           (updatedData.role !== "admin" || currentUserRole !== "manager") &&
            (isEditing ? (
              <div className="flex space-x-4">
                <Button
                  onClick={handleUpdateProfile}
                  className={`px-4 py-2 rounded ${uploadingImg ? "opacity-50 cursor-not-allowed" : ""}`}
                  disabled={uploadingImg}
                >
                  {uploadingImg ? "Uploading..." : "Save Changes"}
                </Button>
                <button
                  onClick={handleCancelUpdate}
                  className="px-4 py-2 rounded bg-gray-500 text-white"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div>
                <Button
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              </div>
            ))}
          {/* You can pass customEmail or just userData.email here */}
          <MyProjects customEmail={trimmedUserEmail} heading="Projects" />
        </CardFooter>
      </Card>
      <ToastContainer />
    </div>
  );
};

export default UserProfile;
