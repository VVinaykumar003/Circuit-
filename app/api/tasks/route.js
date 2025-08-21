import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Task from "@/app/models/Tasks";
import { authenticate } from "@/lib/middleware/authenticate"; // ✅ verifies JWT
import { checkRole } from "@/lib/middleware/checkRole"; // ✅ role helper

// 🔹 GET → fetch all tasks
export async function GET() {
  await dbConnect();
  try {
    const tasks = await Task.find()
      .populate("subtasks")
      .populate("tickets.assignedTo")
      .populate("tickets.createdBy");

    return NextResponse.json(tasks, { status: 200 });
  } catch (err) {
    console.error("GET /tasks error:", err);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// 🔹 POST → create new task (Admin + Manager only)
export async function POST(req) {
  await dbConnect();
  try {
    const user = await authenticate(req); // ✅ JWT user
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkRole(user, ["admin", "manager"])) {
      return NextResponse.json({ error: "Forbidden: Insufficient role" }, { status: 403 });
    }

    const body = await req.json();
    const task = await Task.create({ ...body, createdBy: user._id });

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error("POST /tasks error:", err);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

// 🔹 PATCH → change task status (Admin + Manager + Member [own only])
export async function PATCH(req) {
  await dbConnect();
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId, newStatus } = await req.json();
    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // ✅ Member can only update their own assigned tasks
    if (user.role === "member" && task.assignedTo.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Forbidden: Cannot update others' tasks" }, { status: 403 });
    }

    // ✅ Admin + Manager can update any task
    if (!["admin", "manager", "member"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden: Invalid role" }, { status: 403 });
    }

    task.status = newStatus;
    await task.save();

    return NextResponse.json(task, { status: 200 });
  } catch (err) {
    console.error("PATCH /tasks error:", err);
    return NextResponse.json({ error: "Failed to update task status" }, { status: 500 });
  }
}

// 🔹 DELETE → remove task (Admin only)
export async function DELETE(req) {
  await dbConnect();
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkRole(user, ["admin"])) {
      return NextResponse.json({ error: "Forbidden: Only admin can delete tasks" }, { status: 403 });
    }

    const { taskId } = await req.json();
    const deleted = await Task.findByIdAndDelete(taskId);

    if (!deleted) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Task deleted successfully" }, { status: 200 });
  } catch (err) {
    console.error("DELETE /tasks error:", err);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
