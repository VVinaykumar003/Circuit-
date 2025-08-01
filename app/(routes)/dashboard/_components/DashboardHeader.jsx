"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { getUserData } from "@/lib/getUserData";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { HiMenuAlt3 } from "react-icons/hi";
import SideNav from "./SideNav";
import { ModeToggle } from "@/app/_components/DarkModeBtn";
import UserHoverCard from "@/app/_components/UserHoverCard";

function DashboardHeader() {
  const [userData, setUserData] = useState(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const router = useRouter();

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
        setUserData(null);
        setIsImageLoaded(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="p-3 bg-white dark:bg-slate-950 shadow-sm border-b flex justify-between items-center">
  <div className="flex items-center gap-2">
    {userData?.profileImgUrl ? (
      <div className="relative w-14 h-14">
        <UserHoverCard email={userData?.email} />
      </div>
    ) : (
      <Image
        src="/user.png"
        className="rounded-full border-2 border-slate-300"
        alt="Default Profile"
        width={56}
        height={56}
      />
    )}
    <div className="flex flex-col overflow-hidden">
              <p className="text-md font-bold truncate">{userData?.name}</p>
              <p className="text-sm text-gray-600">{userData?.role}</p>
            </div>
  </div>
  <div className="flex gap-1 items-center justify-center">
    <ModeToggle />
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger className="flex items-center justify-center">
          <HiMenuAlt3 className="text-4xl" />
        </SheetTrigger>
        <SheetContent side="left">
          <SheetTitle></SheetTitle>
          <SideNav />
        </SheetContent>
      </Sheet>
    </div>
  </div>
</div>

  
  );
}

export default DashboardHeader;
