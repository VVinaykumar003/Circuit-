import mongoose from "mongoose";
import Project from "@/app/models/project";
import dbConnect from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  await dbConnect();
  
  const projectName = params.projectName;

  // Check if the param looks like an ObjectId
  if (mongoose.Types.ObjectId.isValid(projectName)) {
    const project = await Project.findById(projectName);
    if (!project) {
      return NextResponse.json({ message: "Not found (by _id)" }, { status: 404 });
    }
    return NextResponse.json(project);
  }

  // Otherwise, treat as string slug (projectName)
  const project = await Project.findOne({ projectName });
  if (!project) {
    return NextResponse.json({ message: "Not found (by projectName)" }, { status: 404 });
  }
  return NextResponse.json(project);
}
