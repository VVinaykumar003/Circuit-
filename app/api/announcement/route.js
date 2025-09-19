import dbConnect from "@/lib/mongodb";
import ProjectUpdate from "@/app/models/ProjectUpdate";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await dbConnect();
    const { projectId, projectName, fromEmail, date, msg, file, participants } = await req.json();

    let projectUpdate = await ProjectUpdate.findOne({ projectId });
    if (!projectUpdate) {
      projectUpdate = new ProjectUpdate({ projectId, projectName, updates: [], announcements: [] });
    }

    const newAnnouncement = {
      fromEmail,
      date,
      post: { msg, file: file || "No Files" },
      toEmail: participants.map(p => ({ email: p.email, state: p.email !== fromEmail }))
    };

    projectUpdate.announcements.push(newAnnouncement);
    await projectUpdate.save();

    return NextResponse.json({ success: true, projectUpdate });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
