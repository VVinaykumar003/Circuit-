"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Image from "next/image";
import { IoMdSearch } from "react-icons/io";
import { RiUserSettingsFill } from "react-icons/ri";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

const trimEmail = (email) => {
  return email.split("@")[0];
};

function AllProfiles() {
  const router = useRouter();
  const [users, setUsers] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/users");
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setUsers(data);
        setFilteredUsers(data);
      } catch (err) {
        setError(err.message);
      }
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!users) return;
    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      (user) =>
        (user.name && user.name.toLowerCase().includes(query)) ||
        (user.email && user.email.toLowerCase().includes(query)) ||
        (user.role && user.role.toLowerCase().includes(query))
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  if (error)
    return (
      <div className="text-center p-4 text-red-600">
        Error loading users: {error}
      </div>
    );

  if (users === null)
    return <div className="text-center p-4">Loading users...</div>;

  if (filteredUsers.length === 0)
    return (
      <div className="p-4">
        <Input
          type="text"
          placeholder="Search by name, email, or role"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 mb-4"
        />
        <div className="text-center text-gray-600">No users found.</div>
      </div>
    );

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
        <IoMdSearch className="absolute text-lg left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.email} className="w-full">
            <CardContent className="flex gap-4 p-4 items-center">
              <div className="flex gap-3 w-full">
                <Avatar className="w-16 h-16 flex-shrink-0">
                  <AvatarImage src={user.profileImgUrl || "/user.png"} />
                  <AvatarFallback>{user.name ? user.name[0] : "?"}</AvatarFallback>
                </Avatar>
                <div className="space-y-1 overflow-hidden w-full">
                  <h4 className="text-sm font-semibold truncate">
                    {user.name || "Unnamed User"}
                  </h4>
                  <div className="text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                    {user.email}
                  </div>
                  <p className="text-sm">{user.role}</p>
                  <div className="flex items-center pt-2 cursor-pointer text-muted-foreground"
                    onClick={() => router.push(`/dashboard/profiles/${trimEmail(user.email)}`)}>
                    <RiUserSettingsFill className="mr-2 h-4 w-4 opacity-70" />
                    <span>View Profile</span>
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
