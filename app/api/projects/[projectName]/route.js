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
