import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Meeting from "@/app/models/Meetings";
import { verifyToken } from "@/lib/auth";
import User from "@/app/models/User";

export async function POST(req) {
  try {
    await dbConnect();

    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);

    if (!user || !["admin", "manager"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, scheduledAt } = body;

    const meetingId = `meeting-${Date.now()}`;

    const meeting = await Meeting.create({
      title,
      description,
      meetingId,
      createdBy: user._id,
      participants: [user._id], // creator auto-added
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
    });

    return NextResponse.json({ success: true, meeting });
  } catch (err) {
    console.error("Create Meeting Error:", err);
    return NextResponse.json({ error: "Failed to create meeting" }, { status: 500 });
  }
}
