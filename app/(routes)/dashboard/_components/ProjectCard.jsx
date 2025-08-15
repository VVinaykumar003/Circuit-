import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react"; // Import a loader icon
import   UserHoverCard  from "@/app/_components/UserHoverCard";

const ProjectCard = ({ project }) => {


  const {
    projectName,
    projectState,
    projectDomain,
    startDate,
    endDate,
    participants,
  } = project;

   

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRedirect = async (e) => {
    e.preventDefault();
    setLoading(true);
    router.push(`/dashboard/projects/${projectName}`);
    // Use a timeout to simulate a delay if necessary (remove this in production)
    // Example delay
  };

  const projectManager = participants.find(
    (participant) => participant.responsibility === "project-manager"
  );
  const projectMembers = participants.filter(
    (participant) => participant.responsibility === "project-member"
  );

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg rounded-lg ">
      <CardHeader className="bg-gray-100 p-4 rounded-t-lg dark:bg-slate-950">
        <CardTitle className="text-xl font-bold text-center ">
          {projectName}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-2 dark:bg-slate-900">
        <div className="flex flex-row  items-center gap-2">
          <strong>State:</strong>{" "}
          <h1
            className={`px-2  w-min rounded-xl ${
              projectState === "ongoing" && "bg-yellow-600 text-yellow-50 "
            } ${projectState === "completed" && "bg-green-800 text-green-50 "}`}
          >
            {projectState}
          </h1>
        </div>
        <div>
          <strong>Domain:</strong> {projectDomain}
        </div>
        <div>
          <strong>Duration:</strong> {startDate} {"to"} {endDate}
        </div>
        {projectManager && (
          <div className="mt-4">
            <strong>Project Manager:</strong>
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 flex-shrink-0">
                <UserHoverCard email={projectManager.email} className="" />
              </div>

              <div>
                <div className="font-medium truncate w-56 md:w-40 lg:w-48">
                  {projectManager.username}
                </div>
                <div className="text-sm text-gray-500 truncate overflow-x-hidden w-44 md:w-36 lg:w-40">
                  {projectManager.email}
                </div>{" "}
                {/* Updated */}
                <div className="text-sm text-gray-500">
                  {projectManager.role}
                </div>
              </div>
            </div>
          </div>
        )}
        {projectMembers.length > 0 && (
          <div className="mt-4">
            <strong>Project Members:</strong>
            <div className="grid mt-2 w-full grid-cols-6  justify-items-center lg:grid-cols-6  md:grid-cols-4 gap-1">
              {projectMembers.map((member, index) => (
                <div key={index} className="w-full">
                  <UserHoverCard email={member.email} className="w-full" />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 dark:bg-slate-900 rounded-b-lg">
        <button
          onClick={handleRedirect}
          className="flex items-center justify-center w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none"
        >
          {loading ? (
            <Loader2 className="animate-spin mr-2 h-5 w-5" />
          ) : (
            "Go to Details"
          )}
        </button>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;
