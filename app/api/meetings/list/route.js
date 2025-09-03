import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Meeting from "@/app/models/Meetings";
import { verifyToken } from "@/lib/auth";
import User from "@/app/models/User";

export async function GET(req) {
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

    // if admin/manager → show meetings created by them
    // if member → show meetings where they are a participant
    const filter =
      ["admin", "manager"].includes(user.role)
        ? { createdBy: user._id }
        : { participants: user._id };

    const meetings = await Meeting.find(filter)
      .populate("createdBy", "name")
      .sort({ scheduledAt: 1 });

    return NextResponse.json({ success: true, meetings });
  } catch (err) {
    console.error("List Meetings Error:", err);
    return NextResponse.json({ error: "Failed to fetch meetings" }, { status: 500 });
  }
}
