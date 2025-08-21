import mongoose from "mongoose";

// Participant schema
const participantSchema = new mongoose.Schema({
  email: { type: String, required: true },
  role: { type: String, required: true },
  responsibility: { type: String, required: true },
  image: { type: String }, // optional
});

// Work update schema
const workUpdateSchema = new mongoose.Schema({
  msg: { type: String, required: true },
  source: { type: String }, // optional
});

// Update schema
const updateSchema = new mongoose.Schema({
  email: { type: String, required: true },
  date: { type: String, required: true },
  workUpdate: { type: workUpdateSchema, required: true },
});

// Announcement schema
const announcementSchema = new mongoose.Schema({
  msg: { type: String, required: true },
  date: { type: String, required: true },
  postedBy: { type: String, required: true },
});

// Main project schema
const projectSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      match: /^[a-zA-Z0-9-_]+$/,
    },
    projectState: {
      type: String,
      enum: ["ongoing", "completed", "paused", "cancelled"],
      default: "ongoing",
    },
    projectDomain: {
      type: String,
      default: "",
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    participants: { type: [participantSchema], default: [] },
    updates: { type: [updateSchema], default: [] },
    announcements: { type: [announcementSchema], default: [] }, // ✅ added announcements
  },
  { timestamps: true }
);

const Project =
  mongoose.models.Project || mongoose.model("Project", projectSchema);

export default Project;
