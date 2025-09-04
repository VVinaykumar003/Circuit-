import dbConnect from "@/lib/mongodb";
import Notification from "@/app/models/Notification";
import { getIO } from "@/lib/socket";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await dbConnect();
    const { userIds, title, message, type, data } = await req.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "No userIds provided" }, { status: 400 });
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

    // Emit real-time event to each user
    const io = getIO();
    userIds.forEach((uid) => {
      io.to(uid.toString()).emit("notification", notifications.find(n => n.userId.toString() === uid.toString()));
    });

    return NextResponse.json({ success: true, notifications });
  } catch (err) {
    console.error("Notification error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
