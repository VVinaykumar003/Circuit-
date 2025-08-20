import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Task from "@/models/Task";
import { authenticate } from "@/lib/middleware/authenticate";
import { checkRole } from "@/lib/middleware/checkRole";

// 🔹 POST → Create ticket (only admin/manager)
export async function POST(req, { params }) {
  await dbConnect();
  const { taskId } = params;

  try {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roleCheck = checkRole(user, ["admin", "manager"]);
    if (!roleCheck.ok) {
      return NextResponse.json({ error: roleCheck.message }, { status: roleCheck.status });
    }

    const { issueTitle, description, assignedTo, priority, startDate, dueDate, tag } = await req.json();

    const task = await Task.findById(taskId);
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const ticket = {
      issueTitle,
      description,
      assignedTo,
      priority,
      startDate,
      dueDate,
      tag,
      createdBy: user._id,
    };

    task.tickets.push(ticket);
    await task.save();

    return NextResponse.json({ message: "Ticket created successfully", ticket }, { status: 201 });
  } catch (err) {
    console.error("POST /tasks/[taskId]/tickets error:", err);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}

// 🔹 GET → Fetch tickets (role based)
export async function GET(req, { params }) {
  await dbConnect();
  const { taskId } = params;

  try {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const task = await Task.findById(taskId)
      .populate("tickets.assignedTo")
      .populate("tickets.createdBy");

    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    // ✅ Admin/Manager → can view all tickets
    if (["admin", "manager"].includes(user.role)) {
      return NextResponse.json(task.tickets, { status: 200 });
    }

    // ✅ Member → can only see tickets if assigned to the task
    if (user.role === "member") {
      if (task.assignedTo.toString() !== user._id.toString()) {
        return NextResponse.json({ error: "Forbidden: Not your task" }, { status: 403 });
      }
      return NextResponse.json(task.tickets, { status: 200 });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (err) {
    console.error("GET /tasks/[taskId]/tickets error:", err);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

// 🔹 PUT → Update a ticket (admin/manager only)
export async function PUT(req, { params }) {
  await dbConnect();
  const { taskId } = params;
  const { ticketId, ...updates } = await req.json();

  try {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roleCheck = checkRole(user, ["admin", "manager"]);
    if (!roleCheck.ok) {
      return NextResponse.json({ error: roleCheck.message }, { status: roleCheck.status });
    }

    const task = await Task.findById(taskId);
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const ticket = task.tickets.id(ticketId);
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    Object.assign(ticket, updates);
    await task.save();

    return NextResponse.json(ticket, { status: 200 });
  } catch (err) {
    console.error("PUT /tasks/[taskId]/tickets error:", err);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}

// 🔹 DELETE → Remove a ticket (admin only)
export async function DELETE(req, { params }) {
  await dbConnect();
  const { taskId } = params;
  const { ticketId } = await req.json();

  try {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roleCheck = checkRole(user, "admin");
    if (!roleCheck.ok) {
      return NextResponse.json({ error: roleCheck.message }, { status: roleCheck.status });
    }

    const task = await Task.findById(taskId);
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const ticket = task.tickets.id(ticketId);
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    ticket.remove();
    await task.save();

    return NextResponse.json({ message: "Ticket deleted successfully" }, { status: 200 });
  } catch (err) {
    console.error("DELETE /tasks/[taskId]/tickets error:", err);
    return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 });
  }
}
