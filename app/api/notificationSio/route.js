import dbConnect from "@/lib/mongodb";
import Notification from "@/app/models/Notification.model";
import { getIO } from "@/lib/socket";   // ✅ not "@/server"
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    const { userIds, title, message, type, data } = body;
    if (!userIds || userIds.length === 0) {
      return NextResponse.json({ error: "userIds required" }, { status: 400 });
    }

    const notifications = await Notification.insertMany(
      userIds.map((uid) => ({
        userId: uid,
        title,
        message,
        type,
        data,
      }))
    );

    try {
      const io = getIO();
      userIds.forEach((uid) => {
        io.to(uid).emit("notification", { title, message, type, data });
      });
    } catch (err) {
      console.error("Socket emit failed:", err.message);
    }

    return NextResponse.json({ success: true, notifications }, { status: 201 });
  } catch (err) {
    console.error("Notification error:", err);
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 });
  }
}
