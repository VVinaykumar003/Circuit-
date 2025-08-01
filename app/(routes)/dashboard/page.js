"use client";
import { useEffect, useState } from "react";
import ProjectCard from "@/app/(routes)/dashboard/_components/ProjectCard"; // Adjust path based on your file structure
import { getAllProjects, getUserData } from "@/lib/getUserData";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

const MyProjects = ({customEmail, heading}) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  heading = heading || "My Projects"
  const router = useRouter();
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
      }
      if (user) {
        try {
          // Fetch the current user data
          const userData = await getUserData();
          const userEmail = customEmail || userData.email;

          // Fetch all projects
          const allProjects = await getAllProjects();

          // Filter projects based on user email
          const userProjects = allProjects.filter((project) =>
            project.participants.some(
              (participant) => participant.email === userEmail
            )
          );

          // Sort projects: ongoing first, then completed, and within each status by start date (newest first)
          const sortedProjects = userProjects.sort((a, b) => {
            // Sorting by projectState
            const statePriority = { ongoing: 1, completed: 2 };
            const stateComparison =
              statePriority[a.projectState] - statePriority[b.projectState];

            if (stateComparison !== 0) return stateComparison;

            // If projectState is the same, sort by startDate (newest first)
            return new Date(b.startDate) - new Date(a.startDate);
          });

          // Update state with sorted projects
          setProjects(sortedProjects);
        } catch (error) {
          console.error("Error fetching projects or user data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        // User is not authenticated
        setProjects([]);
        setLoading(false);
      }
    });

    // Cleanup the subscription on component unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex justify-center">Loading...</div>;
  }

  return (
    <>
      <h2 className="text-xl py-2  px-2 font-bold pt-1 ">{heading}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.length > 0 ? (
          projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))
        ) : (
          <div>No projects available</div>
        )}
      </div>
    </>
  );
};

export default MyProjects;
