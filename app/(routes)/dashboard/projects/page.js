"use client";
import { useEffect, useState } from "react";
import ProjectCard from "@/app/(routes)/dashboard/_components/ProjectCard"; // Adjust path based on your file structure
import { getAllProjects } from "@/lib/getUserData";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login"); // Redirect if not authenticated
      } else {
        try {
          const projectList = await getAllProjects();

          // Sort projects: ongoing first, then completed, and within each status by start date (newest first)
          const sortedProjects = projectList.sort((a, b) => {
            const statePriority = { ongoing: 1, completed: 2 };
            const stateComparison =
              statePriority[a.projectState] - statePriority[b.projectState];

            if (stateComparison !== 0) return stateComparison;

            return new Date(b.startDate) - new Date(a.startDate);
          });

          setProjects(sortedProjects);
        } catch (error) {
          console.error("Error fetching projects:", error);
        } finally {
          setLoading(false); // Set loading to false after fetching
        }
      }
    });

    return () => unsubscribe(); // Cleanup on component unmount
  }, []);

  if (loading) {
    return <div className="flex justify-center">Loading...</div>;
  }

  return (
    <>
      <h2 className="text-xl py-2  px-2 font-bold pt-1">All Projects</h2>
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

export default ProjectList;
