"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { getUserData } from "@/lib/getUserData";
import { MdSpaceDashboard } from "react-icons/md";
import { MdGroups } from "react-icons/md";
import { MdNotifications } from "react-icons/md";
import { ImUserPlus } from "react-icons/im";
import { FaFileCirclePlus } from "react-icons/fa6";
import { RiFolderChartFill } from "react-icons/ri";
import { FaCopy } from "react-icons/fa";
import { HiMiniUserGroup } from "react-icons/hi2";
function SideNav() {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const data = await getUserData();
          setUserRole(data.role);
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Redirect or show a message if needed
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Define the menu list
  const menuList = [
    {
      id: 1,
      name: "My Projects",
      path: "/dashboard",
      icon: <FaCopy className="text-xl" />,
    },
    {
      id: 2,
      name: "All Projects",
      path: "/dashboard/projects",
      icon: <RiFolderChartFill className="text-xl" />,
    },
    userRole !== "member" && {
      id: 3,
      name: "Add New User",
      path: "/dashboard/create",
      icon: <ImUserPlus className="text-xl"/>,
    },
    userRole !== "member" && {
      id: 4,
      name: "Create Project",
      path: "/dashboard/create-project",
      icon: <FaFileCirclePlus className="text-xl"/>,
    },
    {
      id: 5,
      name: "Notifications",
      path: "/dashboard/notifications",
      icon: <MdNotifications className="text-xl"/>,
    },
    {
      id: 6,
      name: "Community",
      path: "/dashboard/profiles",
      icon: <HiMiniUserGroup className="text-xl"/>,
    },
  ].filter(Boolean); // Remove any falsey values

  const path = usePathname();

  if (loading) {
    return (
      <div className="h-full md:h-screen p-5 flex flex-col justify-between border bg-white dark:bg-slate-950 shadow-sm">
        {/* Loading State */}
        <div className="flex-grow flex justify-center items-center">
          <div className="loader">Loading...</div>{" "}
          {/* Replace with your loader component or style */}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full md:h-screen p-5 flex flex-col justify-between border dark:bg-slate-950  bg-white shadow-sm">
      {/* Logo Section */}
      <div className="border-b">
        <div className="flex flex-row gap-2 mb-2 w-full justify-center items-center">
          <Image
            src={"/logo.png"}
            className="rounded-full"
            alt="logo"
            width={50}
            height={50}
          />
          <Link href={"/"}>
            <span className="text-slate-800 dark:text-white font-bold text-xl">
              ZagerStream
            </span>
          </Link>
        </div>
      </div>

      {/* Menu Section */}
      <div className="flex-grow flex flex-col justify-center">
        {menuList.map((menu, index) => (
          <Link href={menu.path} key={index}>
            <h2
              className={`flex gap-2  text-gray-600 font-medium mb-4 p-3 cursor-pointer rounded-lg
                hover:bg-blue-50 items-center hover:text-blue-800 transition-colors duration-200
                ${path === menu.path && "text-white dark bg-blue-500"}`}
            >

              {menu.icon}
              {menu.name}
            </h2>
          </Link>
        ))}
      </div>

      {/* Sign Out Section */}
      <div className="flex justify-center items-center">
        <Button
          onClick={handleSignOut}
          className="w-full py-2 px-4 text-white bg-red-600 hover:bg-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export default SideNav;
