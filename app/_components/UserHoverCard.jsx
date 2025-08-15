"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { RiUserSettingsFill } from "react-icons/ri";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function UserHoverCard({ email }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`/api/user/${email}`);
        if (!res.ok) {
          setUserData(null);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setUserData(data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
      setLoading(false);
    }
    if (email) fetchUser();
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
    <Popover>
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
