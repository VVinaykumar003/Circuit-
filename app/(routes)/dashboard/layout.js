"use client";
import React, { useEffect, useState } from "react";
import SideNav from "./_components/SideNav";
import DashboardHeader from "./_components/DashboardHeader";
import { auth } from "@/lib/firebase"; // Ensure this import matches your Firebase file
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { getUserData } from "@/lib/getUserData";
function Layout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
const [userProfileState, setUserProfileState] = useState("")
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth,async (user) => {
      if (user) {
        setUser(user);
        const userData = await getUserData();
        setUserProfileState(userData.profileState)
        setLoading(false);
      } else {
        setUser(null);
        setLoading(false);
        router.push("/login");
      }
    });

    // Cleanup the subscription on component unmount
    return () => unsubscribe();
  }, [router]);
  useEffect(() => {
    if (userProfileState === "deactived") {
      setLoading(true)
      router.push("/not-allowed");
    }
  }, [userProfileState]);
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="loader">Loading...</div>{" "}
        {/* Replace with your loader component or style */}
      </div>
    );
  }

  return (
    <div>
      <div className="fixed md:w-64 hidden md:block">
        <SideNav />
      </div>
      <div className="md:ml-64">
        <DashboardHeader />
        <div className="p-2 md:p-5">{children}</div>
      </div>
    </div>
  );
}

export default Layout;
