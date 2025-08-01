"use client"
import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAllUsers } from "@/lib/getUserData"; 
import Link from "next/link";
import Image from "next/image";
import { FaSearch } from "react-icons/fa";
import { IoMdSearch } from "react-icons/io";
import { RiUserSettingsFill } from "react-icons/ri";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
const trimEmail = (email) => {
  return email.split("@")[0];
};

function AllProfiles() {
  const router = useRouter()
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    // Fetch all users on component mount
    getAllUsers().then((data) => {
      setUsers(data);
      setFilteredUsers(data);
    });
  }, []);

  useEffect(() => {
    // Filter users based on search query
    const query = searchQuery.toLowerCase();
    const filtered = users.filter((user) =>
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  if(!users){
    return <div className="text-center">Loading...</div>
  }

  return (
    <div className="p-4">
    <div className="mb-6 relative">
      <Input
        type="text"
        placeholder="Search by name, email, or role"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10"
      />
       <IoMdSearch  className="absolute text-lg left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {filteredUsers.map((userData) => (
    <Card key={userData.email} className="w-full">
      <CardContent className="flex gap-4 p-4 items-center">
        <div className="flex gap-3 w-full">
          <Avatar className="w-16 h-16 flex-shrink-0">
            <AvatarImage src={userData.profileImgUrl || "/user.png"} />
            <AvatarFallback>{userData.name[0]}</AvatarFallback>
          </Avatar>
          <div className="space-y-1 overflow-hidden w-full">
            <h4 className="text-sm font-semibold truncate">{userData.name}</h4>
            <div className="text-sm overflow-hidden text-ellipsis whitespace-nowrap">
              {userData.email}
            </div>
            <p className="text-sm">{userData.role}</p>
            <div className="flex items-center pt-2">
              <RiUserSettingsFill className="mr-2 h-4 w-4 opacity-70" />
              <span
                className="text-md text-muted-foreground cursor-pointer"
                onClick={() =>
                  router.push(`/dashboard/profiles/${trimEmail(userData.email)}`)
                }
              >
                View Profile
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  ))}
</div>

  </div>
  
  );
}

export default AllProfiles;
