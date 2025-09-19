// /api/projectUpdates/[projectId]/route.js
import dbConnect from "@/lib/mongodb";
import ProjectUpdate from "@/app/models/ProjectUpdate";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const projectUpdate = await ProjectUpdate.findOne({ projectId: params.projectId });
    return NextResponse.json(projectUpdate || {});
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
