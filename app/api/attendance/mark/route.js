import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Attendance from "@/app/models/Attendance";
import { verifyToken } from "@/lib/auth";

export async function POST(req) {
  try {
    await dbConnect();

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { status } = await req.json();

    // Prevent duplicate attendance for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      userId: decoded.id,
      date: today,
    });

    if (attendance) {
      return NextResponse.json(
        { error: "Attendance already marked for today" },
        { status: 400 }
      );
    }

    attendance = await Attendance.create({
      userId: decoded.id,
      status: status || "present",
    });

    return NextResponse.json({ success: true, attendance });
  } catch (error) {
    console.error("Mark Attendance error:", error);
    return NextResponse.json(
      { error: "Failed to mark attendance" },
      { status: 500 }
    );
  }
}
