"use client";

import { useEffect, useState } from "react";
import ProjectCard from "@/app/(routes)/dashboard/_components/ProjectCard";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

// Helper function to format date
function formatDate(dateStr) {
  if (!dateStr) return "No date";
  const date = new Date(dateStr);
  if (isNaN(date)) return "Invalid date";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short", // Jan, Feb, etc.
    day: "numeric",
  });
}

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuthAndLoadProjects() {
      try {
        // Check if user is authenticated
        const sessionRes = await fetch("/api/auth/session");
        if (!sessionRes.ok) {
          router.push("/login");
          return;
        }

        // Fetch projects
        const projectsRes = await fetch("/api/projects/");
        if (!projectsRes.ok) throw new Error("Failed to fetch projects");

        const projectList = await projectsRes.json();
        // console.log("projectList : ",projectList)

        // Sort projects: ongoing first, then completed, within each by start date (newest first)
        const statePriority = { ongoing: 1, completed: 2 };
        const sortedProjects = projectList.sort((a, b) => {
          const stateComparison =
            statePriority[a.projectState] - statePriority[b.projectState];
          if (stateComparison !== 0) return stateComparison;
          return new Date(b.startDate) - new Date(a.startDate);
        });

       

        // Format startDate before sending to ProjectCard
        const formattedProjects = sortedProjects.map((project) => ({
          ...project,
          startDate: formatDate(project.startDate),
          endDate:formatDate(project.endDate)
        }));

        setProjects(formattedProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast.error("Error loading projects.");
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndLoadProjects();
  }, [router]);

  if (loading) {
    return <div className="flex justify-center">Loading...</div>;
  }

  return (
    <>
      <h2 className="text-xl py-2 px-2 font-bold pt-1">All Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.length > 0 ? (
          projects.map((project) => (
            <ProjectCard key={project._id || project.id} project={project} />
          ))
        ) : (
          <div>No projects available</div>
        )}
      </div>
    </>
  );
};

export default ProjectList;
