"use client";

import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
import { getUserData } from "@/lib/getUserData";
import { storage, auth } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CreateUser() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    profileImg: null,
    profileImgUrl: "",
    name: "",
    gender: "",
    role: "member",
    phoneNumber: "",
    dateOfBirth: "",
    profileState: "active",
  });
  const router = useRouter();
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingBtn, setLoadingBtn] = useState(false);

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
        router.push("/login"); // Redirect to the login page if no user is authenticated
      }
    });

    return () => unsubscribe(); // Clean up the subscription on component unmount
  }, []);

  // New useEffect to handle redirection after role is set
  useEffect(() => {
    if (currentUserRole === "member") {
      router.push("/dashboard"); // Redirect members to the dashboard
    }
  }, [currentUserRole]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "phoneNumber") {
      const digitsOnly = value.replace(/\D/g, ""); // Remove non-digit characters
      let formattedPhoneNumber = digitsOnly;

      // Automatically add +91 if not already present
      if (!formattedPhoneNumber.startsWith("91")) {
        formattedPhoneNumber = `91${formattedPhoneNumber}`;
      }

      setFormData({
        ...formData,
        [name]: formattedPhoneNumber,
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const storageRef = ref(storage, `profileImages/${file.name}`);
      try {
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        setFormData({
          ...formData,
          profileImg: file,
          profileImgUrl: downloadURL,
        });
      } catch (err) {
        setError("Failed to upload profile image. Please try again.");
        console.error("File upload error: ", err);
      }
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoadingBtn(true);
    setError("");

    // Check for required fields
    const requiredFields = [
      "email",
      "password",
      "confirmPassword",
      "name",
      "gender",
      "role",
      "phoneNumber",
      "dateOfBirth",
      "profileState",
    ];
    for (const field of requiredFields) {
      if (!formData[field]) {
        setError(`Please fill in the ${field}`);
        setLoadingBtn(false);
        return;
      }
    }

    if (!formData.profileImgUrl) {
      setError("Please upload a profile image");
      setLoadingBtn(false);
      return;
    }
    if (formData.phoneNumber.length !== 12) {
      setError("Only 10 digit mobile numbers are allowed");
      setLoadingBtn(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoadingBtn(false);
      return;
    }

    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("User created successfully!");
        setFormData({
          email: "",
          password: "",
          confirmPassword: "",
          profileImg: null,
          profileImgUrl: "",
          name: "",
          gender: currentUserRole === "admin" ? "" : formData.gender,
          role: currentUserRole === "admin" ? "member" : "",
          phoneNumber: "",
          dateOfBirth: "",
          profileState: "active",
        });
      } else {
        setError(result.error || "Error creating user");
        setLoadingBtn(false);
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
      console.error("Signup error: ", err);
      setLoadingBtn(false);
    }
    setLoadingBtn(false);
  };

  if (loading) {
    return <div className="text-center ">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 py- bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">Create New User</h2>
      <form onSubmit={handleSignup}>
        <div className="flex flex-col md:flex-row  justify-center gap-2 md:gap-3 lg:gap-8 w-full mb mb-4">
          {formData.profileImgUrl ? (
            <div className="w-20 h-20 rounded-full border border-slate-400 overflow-hidden">
              <Image
                src={formData.profileImgUrl}
                alt="Profile"
                width={96}
                height={96}
                className="object-cover "
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          )}

          <div className="flex flex-col justify-center">
            <Label
              htmlFor="profileImg"
              className="block mb-1 text-gray-600 dark:text-gray-300"
            >
              Upload Profile Image
            </Label>
            <Input
              type="file"
              id="profileImg"
              name="profileImg"
              accept="image/*"
              onChange={handleFileChange}
              className="block cursor-pointer text-gray-600 dark:text-gray-300"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label
              htmlFor="name"
              className="block mb-1 text-gray-600 dark:text-gray-300"
            >
              Name
            </Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your name"
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-gray-300"
              required
            />
          </div>
          <div>
            <Label
              htmlFor="email"
              className="block mb-1 text-gray-600 dark:text-gray-300"
            >
              Email
            </Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              placeholder="Enter Valid Email"
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-gray-300"
              required
            />
          </div>
          <div>
            <Label
              htmlFor="password"
              className="block mb-1 text-gray-600 dark:text-gray-300"
            >
              Password
            </Label>
            <Input
              type="password"
              id="password"
              name="password"
              placeholder="Make Strong password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-gray-300"
              required
            />
          </div>
          <div>
            <Label
              htmlFor="confirmPassword"
              className="block mb-1 text-gray-600 dark:text-gray-300"
            >
              Confirm Password
            </Label>
            <Input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-gray-300"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label
              htmlFor="gender"
              className="block mb-1 text-gray-600 dark:text-gray-300"
            >
              Gender
            </Label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-gray-300"
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <Label
              htmlFor="dateOfBirth"
              className="block mb-1 text-gray-600 dark:text-gray-300"
            >
              Date of Birth
            </Label>
            <Input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-gray-300"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <Label
              htmlFor="phoneNumber"
              className="block mb-1 text-gray-600 dark:text-gray-300"
            >
              Phone Number
            </Label>
            <Input
              type="text"
              id="phoneNumber"
              name="phoneNumber"
              placeholder="Enter your phone Number"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-gray-300"
              required
            />
          </div>
          <div>
            <Label
              htmlFor="role"
              className="block mb-1 text-gray-600 dark:text-gray-300"
            >
              Role
            </Label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-gray-300"
              required
            >
              <option value="member">Member</option>
              <option value="manager">Manager</option>
              {currentUserRole === "admin" && (
                <option value="admin">Admin</option>
              )}
            </select>
          </div>
          <div>
            <Label
              htmlFor="profileState"
              className="block mb-1 text-gray-600 dark:text-gray-300"
            >
              Profile State
            </Label>
            <select
              id="profileState"
              name="profileState"
              value={formData.profileState}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-gray-300"
              required
            >
              <option value="active">Active</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2 text-red-700 bg-red-100 rounded">
            {error}
          </div>
        )}
        <Button
          type="submit"
          className={`w-full py-3 mt-4 rounded-lg  font-semibold transition-colors ${
            loadingBtn ? "bg-gray-400 cursor-not-allowed" : ""
          }`}
          disabled={loadingBtn}
        >
          {loadingBtn ? "Creating User..." : "Create User"}
        </Button>
      </form>
      <ToastContainer />
    </div>
  );
}
