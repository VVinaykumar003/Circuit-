import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Attendance from "@/app/models/Attendance";
import User from "@/app/models/User";
import {getServerSession} from "@/lib/session";

export async function GET(req) {
  try {
    await dbConnect();
    const session = await getServerSession();
    if (!session) {return NextResponse.json({ error: "Unauthorized" }, { status: 401 });}

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userId = searchParams.get("employeeId"); // keep query param name same, map to userId
    const status = searchParams.get("status");

    let filters = {};

    // Date filter
   if (startDate && endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  filters.date = { $gte: start, $lte: end };
}


    // User filter
    if (userId && userId !== ":1") {
      filters.userId = userId;
    }

    // Status filter
    if (status) {
      filters.approvalStatus = status;
    }

    // Role-based access
    const role = session.user.role;
    if (role === "member") {
      filters.userId = session.user.id;
    } else if (role === "manager") {
      const teamMembers = await User.find({ manager: session.user.id }).select("_id");
      filters.userId = { $in: teamMembers.map(u => u._id) };
    }

    const report = await Attendance.find(filters)
      .populate("userId", "name email role")
      .populate("approvedBy", "name role")
      .sort({ date: -1 });

    return NextResponse.json(report);
  } catch (err) {
    console.error("Attendance Report error:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
