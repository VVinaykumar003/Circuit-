import { NextResponse } from "next/server";
// import dbConnect from "@/app/dbconfig/mongodb";
import Project from "@/app/models/project";
import dbConnect from "@/lib/mongodb";

await dbConnect();

// ✅ GET /api/projects — Fetch all projects
export async function GET() {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    return NextResponse.json(projects, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch projects", error: error.message },
      { status: 500 }
    );
  }
}

// ✅ POST /api/projects — Create a new project
// export async function POST(request) {
//   try {
//     const projectData = await request.json();
//     console.log("Project data received:", projectData);

//     // ✅ Automatically lowercase project name for uniqueness
//     projectData.projectName = projectData.projectName.toLowerCase();

//     // ✅ Check if project name already exists
//     const existing = await Project.findOne({
//       projectName: projectData.projectName,
//     });
//     if (existing) {
//       return NextResponse.json(
//         { message: "Project name already exists" },
//         { status: 400 }
//       );
//     }

//     // ✅ Create project
//     const newProject = new Project(projectData);
//     await newProject.save();

//     return NextResponse.json(newProject, { status: 201 });
//   } catch (error) {
//     return NextResponse.json(
//       { message: "Failed to create project", error: error.message },
//       { status: 500 }
//     );
//   }
// }

// import connectDB from "@/lib/mongodb";
// import Project from "@/models/Project";

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    console.log("📥 Incoming Project Data:", body);

    // Create project
    const project = await Project.create(body);
    console.log("✅ Project Saved:", project);

    return new Response(JSON.stringify(project), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("🔥 Server Error in POST /api/projects:", err);
    return new Response(
      JSON.stringify({ message: err.message || "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

