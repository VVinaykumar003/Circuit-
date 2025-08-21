import { NextResponse } from "next/server";
import Project from "@/app/models/project";
// import { connectDB } from "@/lib/db";
import dbConnect from "@/lib/mongodb";

export async function GET(
  req,
  { params }
) {
  try {
    await dbConnect();
    const project = await Project.findOne({ projectName: params.projectName 
 });
    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



// export async function PUT(req, { params }) {
//   try {
//     const { projectName } = params;
//     const body = await req.json();

//     await dbConnect();

//     // Find and update the project
//     const updatedProject = await Project.findOneAndUpdate(
//       { projectName: projectName.toLowerCase() },
//       {
//         projectState: body.projectState,
//         projectDomain: body.projectDomain,
//         startDate: body.startDate,
//         endDate: body.endDate,
//         participants: body.participants
//       },
//       { new: true, runValidators: true }
//     );

//     if (!updatedProject) {
//       return NextResponse.json(
//         { message: "Project not found" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(
//       { message: "Project updated successfully", project: updatedProject },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Error updating project:", error);
//     return NextResponse.json(
//       { message: "Server error", error: error.message },
//       { status: 500 }
//     );
//   }
// }
export async function PUT(req, { params }) {
  await dbConnect();

  const { projectName } = params;
  const data = await req.json();

  try {
    const updatedProject = await Project.findOneAndUpdate(
      { projectName },
      {
        projectState: data.projectState,
        projectDomain: data.projectDomain,
        startDate: data.startDate,
        endDate: data.endDate,
        participants: data.participants // ✅ Always replace with latest list
      },
      { new: true }
    );

    if (!updatedProject) {
      return new Response(
        JSON.stringify({ message: "Project not found" }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify(updatedProject), { status: 200 });
  } catch (err) {
    return new Response(
      JSON.stringify({ message: err.message }),
      { status: 500 }
    );
  }
}
