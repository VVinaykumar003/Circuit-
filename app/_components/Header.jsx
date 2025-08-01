"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { getUserData } from "@/lib/getUserData"; // Import the function to get user data
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import  UserHoverCard  from "./UserHoverCard";

export default function Header() {
  const [userData, setUserData] = useState(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false); // Initialize as false

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const data = await getUserData();
          setUserData(data);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserData(null); // Clear user data if not authenticated
        setIsImageLoaded(false); // Reset image loading state
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="p-5 flex bg-white dark:bg-slate-950  justify-between items-center border shadow-sm">
      <div className="flex flex-row items-center justify-center gap-2">
        <Image
          src={"/logo.png"}
          className="rounded-full "
          alt="logo"
          width={40}
          height={25}
        />
        <span className="text-blue-800 font-bold dark:text-white text-xl">
          ZagerStream
        </span>
      </div>

      <div className="flex gap-3 items-center">
        <Link href={"/dashboard"}>
          {userData && (
            <button className="rounded-full bg-transparent border border-blue-800 text-blue-800 px-4 py-2 hover:bg-blue-100">
              Dashboard
            </button>
          )}
        </Link>
        {userData ? (
          <div className="relative w-10 h-10 ">
            <UserHoverCard email={userData.email} />
          </div>
        ) : (
          // Show Login button only if the user is not authenticated
          <Link href={"/login"}>
            <button className="rounded-full bg-blue-800 text-white px-4 py-2 hover:bg-blue-900">
              Login
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
