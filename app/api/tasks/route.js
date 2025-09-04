import { NextResponse } from "next/server";
import mongoose from "mongoose"; // ✅ ADD THIS LINE
import dbConnect from "@/lib/mongodb";
import Task from "@/app/models/Tasks";
import { authenticate } from "@/lib/middleware/authenticate";
import { checkRole } from "@/lib/middleware/checkRole";
import { verifyAuth } from "@/lib/auth";

// ... rest of your code


// 🔹 GET → fetch all tasks
export async function GET(req) {
  try {
    // ✅ Authenticate user
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Connect DB
    try {
      await dbConnect();
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    // ✅ Extract query params
    const { searchParams } = new URL(req.url);
    const projectName = searchParams.get("projectName");
    const projectId = searchParams.get("projectId");

    let query = {};

    // ✅ If projectName provided → resolve to projectId
    if (projectName) {
      const Project = (await import("@/app/models/project")).default;
      const project = await Project.findOne({ projectName });

      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }

      query.projectId = project._id;
    } else if (projectId) {
      query.projectId = new mongoose.Types.ObjectId(projectId);
    }
    

console.log('user info:', user);

    // ✅ Role-based filtering
    if (user.role === "member") {
      const userId = new mongoose.Types.ObjectId(user.id);

      query.$or = [
        { "assignees.user": userId }, // tasks assigned to user
        { createdBy: userId } // tasks created by user
      ];
    }

    // ✅ Fetch tasks
    const tasks = await Task.find(query)
      .populate("createdBy", "name email")
      .populate("assignees.user", "name email")
      .lean()
      .exec();

    return NextResponse.json(tasks, { status: 200 });
  } catch (err) {
    console.error("GET /tasks error:", err);
    return NextResponse.json(
      {
        error: "Failed to fetch tasks",
        details:
          process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

// 🔹 POST → create new task (Admin + Manager only)
export async function POST(req) {
  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const user = await verifyAuth(token);

    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await dbConnect();

    // Parse body
    const body = await req.json();

    // Validate required fields
    const requiredFields = ["title", "description", "projectId", "assignees"];
    for (const field of requiredFields) {
      if (!body[field] || (field === "assignees" && body.assignees.length === 0)) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // ✅ Create task
    const task = await Task.create({
      title: body.title,
      description: body.description,
      projectId: new mongoose.Types.ObjectId(body.projectId),
      createdBy: new mongoose.Types.ObjectId(user._id),
      assignedBy: new mongoose.Types.ObjectId(user._id),
      assignees: body.assignees.map((assignee) => ({
        user: new mongoose.Types.ObjectId(assignee.user),
        state: assignee.state || "assigned",
      })),
      status: "pending",
    });

    // 🔹 Trigger notifications for assignees
    try {
      const assigneeIds = body.assignees.map((a) => a.user);

      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications.sio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userIds: assigneeIds,
          title: "New Task Assigned",
          message: `${user.name || "Someone"} assigned you a task: ${body.title}`,
          type: "task",
          data: { taskId: task._id, projectId: body.projectId },
        }),
      });
    } catch (notifErr) {
      console.error("Failed to send notifications:", notifErr);
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Task creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create task",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
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