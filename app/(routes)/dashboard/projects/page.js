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
const checkAuthAndLoadProjects = async () => {
  setLoading(true); // Set loading to true when starting
  try {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('No token found');
      router.push('/login');
      return;
    }

    const res = await fetch('/api/projects', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to fetch projects');
    }

    const data = await res.json();
    console.log('Projects fetched:', data);
    setProjects(data);
    
  } catch (err) {
    console.error('Error fetching projects:', err);
    if (err.message === 'Invalid token') {
      router.push('/login');
    }
    setError(err.message);
  } finally {
    setLoading(false); // Set loading to false when done, regardless of success or failure
  }
};

    checkAuthAndLoadProjects();
  }, [router]);


    function handleProjectDeleted(deletedProjectName) {
    setProjects(prev => prev.filter(p => p.projectName !== deletedProjectName));
  }


  if (loading) {
    return <div className="flex justify-center">Loading...</div>;
  }

  return (
    <>
      <h2 className="text-xl py-2 px-2 font-bold pt-1">All Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.length > 0 ? (
          projects.map((project) => (
            <ProjectCard key={project._id || project.id} project={project} onDeleted={handleProjectDeleted}  />
          ))
        ) : (
          <div>No projects available</div>
        )}
      </div>
    </>
  );
};

export default ProjectList;
