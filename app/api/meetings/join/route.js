import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Meeting from "@/models/Meeting";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";

export async function POST(req) {
  try {
    await dbConnect();

    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { meetingId } = body;

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (!meeting.participants.includes(user._id)) {
      meeting.participants.push(user._id);
      await meeting.save();
    }

    return NextResponse.json({ success: true, meeting });
  } catch (err) {
    console.error("Join Meeting Error:", err);
    return NextResponse.json({ error: "Failed to join meeting" }, { status: 500 });
  }
}
