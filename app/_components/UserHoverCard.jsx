"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { RiUserSettingsFill } from "react-icons/ri";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getAllUsers } from "@/lib/getUserData";

export default function UserHoverCard({ email }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all users after user authentication state is established
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            const users = await getAllUsers();
            const currentUser = users.find((u) => u.email === email);
            if (currentUser) {
              // console.log("User data:", currentUser);
              setUserData(currentUser);
            }
          }
          setLoading(false);
        });

        // Cleanup the subscription
        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [email]);

  if (loading) {
    return (
      <Avatar className="w-full h-full rounded-full">
        <AvatarFallback>User</AvatarFallback>
      </Avatar>
    );
  }

  if (!userData) {
    return <div>No user data found</div>;
  }

  const trimmedEmail = email.split("@")[0];

  return (
    <Popover >
      <PopoverTrigger asChild>
        <Avatar className="w-full h-full cursor-pointer">
          <AvatarImage src={userData.profileImgUrl} className="" />
          <AvatarFallback>{userData.name[0]}</AvatarFallback>
        </Avatar>
      </PopoverTrigger>
      <PopoverContent className="mx-2">
        <div className="flex gap-3 ">
          <Avatar className="w-16 h-16">
            <AvatarImage src={userData.profileImgUrl || "/user.png"} />
            <AvatarFallback>{userData.name[0]}</AvatarFallback>
          </Avatar>
          <div className="space-y-">
            <h4 className="text-sm font-semibold">{userData.name}</h4>
            <p className="text-sm overflow-x-hidden truncate">
              {userData.email}
            </p>
            <p className="text-sm">{userData.role}</p>
            <div className="flex items-center pt-2">
              <RiUserSettingsFill className="mr-2 h-4 w-4 opacity-70" />
              <span
                className="text-xs text-muted-foreground cursor-pointer"
                onClick={() =>
                  router.push(`/dashboard/profiles/${trimmedEmail}`)
                }
              >
                View Profile
              </span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
