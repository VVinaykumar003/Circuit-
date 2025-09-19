import dbConnect from "@/lib/mongodb";
import ProjectUpdate from "@/app/models/ProjectUpdate";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await dbConnect();
    const { projectId, projectName, email, date, msg, file } = await req.json();

    let projectUpdate = await ProjectUpdate.findOne({ projectId });
    if (!projectUpdate) {
      projectUpdate = new ProjectUpdate({ projectId, projectName, updates: [], announcements: [] });
    }

    // Check if already updated today
    const existing = projectUpdate.updates.find(u => u.email === email && u.date === date);
    if (existing) {
      existing.workUpdate.msg = msg;
      existing.workUpdate.source = file || "No Files";
    } else {
      projectUpdate.updates.push({ email, date, workUpdate: { msg, source: file || "No Files" } });
    }

    await projectUpdate.save();
    return NextResponse.json({ success: true, projectUpdate });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
