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
import axios from "axios";
import { useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams();
const email = searchParams.get('email');

  // Extract and decode email from URL
  const encodedEmail = pathname.split("/").pop()+ "@gmail.com"; ;
  const trimmedUserEmail = decodeURIComponent(encodedEmail);
  // console.log("Trimmed User Email:", trimmedUserEmail);


  // Check current session and fetch user role
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await axios.get("/api/auth/session");
        if (res.status !== 200) throw new Error("Not authenticated");
        const user = res.data;
        setCurrentUserRole(user.role);
      } catch {
        setError("No authenticated user.");
        setLoading(false);
        router.push("/login");
      }
    }
    fetchSession();
  }, [router]);

  // Fetch user data for profile using the correct API endpoint
  // useEffect(() => {
  //   async function fetchUser() {
  //     if (!trimmedUserEmail) return;
      
  //     try {
  //       setLoading(true);
  //       // Use the correct API endpoint we created earlier
  //       const res = await fetch(`/api/user/email/${email}`);
  //       console.log("API URL:", `/api/user/email/${email}`);

  //       const data = await res.json();
        
  //       console.log("API Response:", data);
        
  //       if (!res.ok) {
  //         throw new Error(data.error || "User not found");
  //       }
        
  //       if (data.success && data.user) {
  //         setUserData(data.user);
  //         setUpdatedData(data.user);
  //         setError(null);
  //       } else {
  //         throw new Error("User not found");
  //       }
  //     } catch (err) {
  //       console.error("Error fetching user:", err);
  //       setError(err.message || "User not found");
  //     } finally {
  //       setLoading(false);
  //     }
  //   }
    
  //   fetchUser();
  // }, [trimmedUserEmail]);

  useEffect(() => {
  async function fetchUser() {
    if (!email) return;

    try {
      setLoading(true);
      const encodedEmail = encodeURIComponent(email);
      const res = await fetch(`/api/user/email/${encodedEmail}`);
      const data = await res.json();
      console.log("API Response:", data);

      if (!res.ok) throw new Error(data.error || "User not found");
      if (data.success && data.user) {
        setUserData(data.user);
        setUpdatedData(data.user);
        setError(null);
      } else {
        throw new Error("User not found");
      }
    } catch (err) {
      setError(err.message || "User not found");
    } finally {
      setLoading(false);
    }
  }
  fetchUser();
}, [email]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileImgChange = (e) => {
    if (e.target.files[0]) setProfileImgFile(e.target.files);
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
      // You'll need to create a PUT endpoint for updating users
      const res = await fetch(`/api/users/${encodeURIComponent(userData.email)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updatedData,
          profileImgUrl,
        }),
      });
      
      if (!res.ok) throw new Error("Failed to update profile");

      const responseData = await res.json();
      
      if (responseData.success) {
        setUserData(responseData.user);
        setUpdatedData(responseData.user);
        toast.success("Profile Successfully Updated");
        setIsEditing(false);
        setProfileImgFile(null);
      } else {
        throw new Error(responseData.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Update error:", error);
      setError(error.message || "Error updating profile");
      toast.error(error.message || "Error updating profile");
      setUploadingImg(false);
    }
  };

  const handleCancelUpdate = () => {
    setUpdatedData(userData); // Revert changes
    setIsEditing(false);
    setProfileImgFile(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Loading user profile...</div>
    </div>
  );
  
  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-red-600 text-lg">Error: {error}</div>
    </div>
  );

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
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
                    <p className="text-sm text-gray-500 capitalize">{userData.role}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:gap-4">
                  <div className="w-full">
                    <label className="font-bold">Email:</label>
                    <input
                      type="text"
                      name="email"
                      value={updatedData.email || ''}
                      readOnly
                      className="w-full cursor-not-allowed mt-1 p-2 border rounded bg-gray-100"
                    />
                  </div>
                  <div className="w-full">
                    <label className="font-bold">Name:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={updatedData.name || ''}
                        onChange={handleInputChange}
                        className="w-full mt-1 p-2 border rounded"
                      />
                    ) : (
                      <input
                        type="text"
                        name="name"
                        value={updatedData.name || ''}
                        readOnly
                        className="w-full cursor-not-allowed mt-1 p-2 border rounded bg-gray-100"
                      />
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 md:flex-row md:gap-4">
                  <div className="w-full">
                    <label className="font-bold">Phone Number:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="phoneNumber"
                        value={updatedData.phoneNumber || ''}
                        onChange={handleInputChange}
                        className="w-full mt-1 p-2 border rounded"
                      />
                    ) : (
                      <input
                        type="text"
                        name="phoneNumber"
                        value={updatedData.phoneNumber || 'Not provided'}
                        readOnly
                        className="w-full cursor-not-allowed mt-1 p-2 border rounded bg-gray-100"
                      />
                    )}
                  </div>
                  <div className="w-full">
                    <label className="font-bold">Date of Birth:</label>
                    {isEditing ? (
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={updatedData.dateOfBirth || ''}
                        onChange={handleInputChange}
                        className="w-full mt-1 p-2 border rounded"
                      />
                    ) : (
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={updatedData.dateOfBirth || ''}
                        readOnly
                        className="w-full cursor-not-allowed mt-1 p-2 border rounded bg-gray-100"
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
                        value={updatedData.gender || 'male'}
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
                        value={updatedData.gender || 'Not specified'}
                        readOnly
                        className="w-full cursor-not-allowed mt-1 p-2 border rounded bg-gray-100"
                      />
                    )}
                  </div>
                  <div className="w-full">
                    <label className="font-bold">Role:</label>
                    {isEditing && currentUserRole === 'admin' ? (
                      <select
                        name="role"
                        value={updatedData.role || 'member'}
                        onChange={handleInputChange}
                        className="w-full mt-1 p-2 border rounded"
                      >
                        <option value="member">Member</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        name="role"
                        value={updatedData.role || 'member'}
                        readOnly
                        className="w-full cursor-not-allowed mt-1 p-2 border rounded bg-gray-100"
                      />
                    )}
                  </div>
                  <div className="w-full">
                    <label className="font-bold">Profile State:</label>
                    {isEditing && (currentUserRole === 'admin' || currentUserRole === 'manager') ? (
                      <select
                        name="profileState"
                        value={updatedData.profileState || 'active'}
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
                        value={updatedData.profileState || 'active'}
                        readOnly
                        className="w-full cursor-not-allowed mt-1 p-2 border rounded bg-gray-100"
                      />
                    )}
                  </div>
                </div>

                {/* Display additional user info if available */}
                {userData.createdAt && (
                  <div className="w-full">
                    <label className="font-bold">Member Since:</label>
                    <input
                      type="text"
                      value={new Date(userData.createdAt).toLocaleDateString()}
                      readOnly
                      className="w-full cursor-not-allowed mt-1 p-2 border rounded bg-gray-100"
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <p>No user data found</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start space-y-4">
          {/* Only allow editing if user has proper permissions */}
          {(currentUserRole === 'admin' || 
            (currentUserRole === 'manager' && updatedData.role !== 'admin') ||
            (currentUserRole === 'member' && trimmedUserEmail === currentUserRole)) && (
            isEditing ? (
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
                  className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div>
                <Button onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              </div>
            )
          )}
          <MyProjects customEmail={trimmedUserEmail} heading="Projects" />
        </CardFooter>
      </Card>
      <ToastContainer />
    </div>
  );
};

export default UserProfile;
