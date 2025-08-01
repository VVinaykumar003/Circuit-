"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { firestore, storage, auth } from "@/lib/firebase";
import { getUserData } from "@/lib/getUserData";
import { toast ,ToastContainer } from "react-toastify";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import MyProjects from "../../page";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { onAuthStateChanged } from "firebase/auth";
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
  const [documentId, setDocumentId] = useState(null);
  const router = useRouter();
  const pathname = usePathname();
  const trimmedUserEmail = pathname.split("/").pop() + "@gmail.com";

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
    const fetchData = async () => {
      try {
        const q = query(
          collection(firestore, "users"),
          where("email", "==", trimmedUserEmail)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            setUserData(userDoc.data());
            setUpdatedData(userDoc.data());
            setDocumentId(userDoc.id); // Save the document ID
          } else {
            setError("User not found");
          }
          setLoading(false);
        });

        return () => unsubscribe(); // Clean up on unmount
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Error fetching user data");
        setLoading(false);
      }
    };

    fetchData();
  }, [trimmedUserEmail]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedData({ ...updatedData, [name]: value });
  };

  const handleProfileImgChange = (e) => {
    if (e.target.files[0]) {
      setProfileImgFile(e.target.files[0]);
    }
  };

  const handleUpdateProfile = async () => {
    if (!userData || !documentId) return;

    try {
      let profileImgUrl = updatedData.profileImgUrl;

      // If a new profile image is selected, upload it to Firebase Storage
      if (profileImgFile) {
        setUploadingImg(true);
        const imgRef = ref(storage, `profileImages/${userData.email}`);
        await uploadBytes(imgRef, profileImgFile);
        profileImgUrl = await getDownloadURL(imgRef);
        setUpdatedData({ ...updatedData, profileImgUrl });
        setUploadingImg(false);
      }

      // Update user data in Firestore
      const userRef = doc(firestore, "users", documentId); // Use document ID
      await updateDoc(userRef, {
        ...updatedData,
        profileImgUrl,
      });
toast.success("Profile Successfully Updated")
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Error updating profile");
    }
  };

  const handleCancelUpdate = () => {
    setUpdatedData(userData); // Revert changes
    setIsEditing(false);
    setProfileImgFile(null); // Clear selected image
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className=" p-4">
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
                    className="w-24 h-24 rounded-full"
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
                    {isEditing ? (
                      <input
                        type="text"
                        name="email"
                        value={updatedData.email}
                        readOnly
                        className="w-full cursor-not-allowed mt-1 p-2 border rounded"
                      />
                    ) : (
                      <input
                        type="text"
                        name="email"
                        value={updatedData.email}
                        readOnly
                        className="w-full cursor-not-allowed mt-1 p-2 border rounded"
                      />
                    )}
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
                        type="number"
                        name="phoneNumberr"
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
                        name="dob"
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
                      <p><input
                      type="text"
                      name="gender"
                      value={updatedData.gender}
                      readOnly
                      className="w-full cursor-not-allowed mt-1 p-2 border rounded"
                    /></p>
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
                        {currentUserRole === 'admin' &&<option value="admin">Admin</option>}
                        
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
                      <option value="deactived">Deactived</option>
                    </select>
                  ) : (
                    <input
                    type="text"
                    name="profilestate"
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
          {currentUserRole !== "member" &&  (updatedData.role !== "admin" || currentUserRole!=="manager")&&
            (isEditing ? (
              <div className="flex space-x-4">
                <Button
                  onClick={handleUpdateProfile}
                  className={`px-4 py-2 rounded  ${
                    uploadingImg ? "opacity-50 cursor-not-allowed" : ""
                  }`}
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
                  className=""
                >
                  Edit Profile
                </Button>
              </div>
            ))}
          <MyProjects customEmail={trimmedUserEmail} heading={"Projects"} />
        </CardFooter>
      </Card>
      <ToastContainer/>
    </div>
  );
};

export default UserProfile;
