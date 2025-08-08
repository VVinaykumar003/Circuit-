import { NextResponse } from "next/server";
import connectDB from "@/app/dbconfig/dbconfig";
import Project from "@/app/models/project";

// ✅ Ensure DB is connected
await connectDB();

// ✅ GET /api/projects — Fetch all projects
export async function GET() {
  try {
    const projects = await Project.find().sort({ createdAt: -1 }); // Optional: sort newest first
    return NextResponse.json(projects, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch projects", error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const projectData = await request.json();
    const newProject = new Project(projectData);
    await newProject.save();
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to create project", error: error.message }, { status: 500 });
  }
}

