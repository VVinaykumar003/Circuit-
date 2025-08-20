import mongoose from "mongoose";

/* ----------------------------------------
   🎯 Ticket Subdocument Schema
   - Can only be raised inside a Task
   - Restricted to Admin/Manager in API layer
----------------------------------------- */
const ticketSchema = new mongoose.Schema({
  issueTitle: { type: String, required: true },
  description: { type: String },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  priority: { 
    type: String, 
    enum: ["low", "medium", "high", "urgent"], 
    default: "medium" 
  },
  status: { 
    type: String, 
    enum: ["open", "in-progress", "resolved"], 
    default: "open" 
  },
  startDate: { type: Date },
  dueDate: { type: Date },
  tag: { type: String, enum: ["bug", "development", "other"], default: "other" },

  // Who raised the ticket (must be admin/manager → checked in API)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

/* ----------------------------------------
   🎯 Task Schema (Self-referencing Model)
   - Tasks and Subtasks share the same schema
   - Supports infinite nesting
----------------------------------------- */
const taskSchema = new mongoose.Schema({
  /* 🔹 Basic Task Info */
  title: { type: String, required: true },
  description: { type: String },

  /* 🔹 Dates */
  startDate: { type: Date },
  dueDate: { type: Date },

  /* 🔹 Priority */
  priority: { 
    type: String, 
    enum: ["low", "medium", "high", "urgent"], 
    default: "medium" 
  },

  /* 🔹 Checklist */
  checklist: [
    {
      item: { type: String, required: true },
      isCompleted: { type: Boolean, default: false }
    }
  ],

  /* 🔹 Assignment */
assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // multiple assignees
assignedTeams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }], 
assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },

  /* 🔹 Self-referencing for Subtasks */
  parentTask: { type: mongoose.Schema.Types.ObjectId, ref: "Task", default: null },
  subtasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],

  /* 🔹 Tickets inside a Task */
  tickets: [ticketSchema],

  /* 🔹 Metadata */
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

/* ----------------------------------------
   🎯 Export Task Model
----------------------------------------- */
export default mongoose.models.Task || mongoose.model("Task", taskSchema);
