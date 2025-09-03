// models/Meeting.js
import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  meetingId: { type: String, required: true, unique: true }, // used for joining
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  status: { type: String, enum: ["scheduled", "completed", "cancelled"], default: "scheduled" },
  scheduledAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.Meeting || mongoose.model("Meeting", meetingSchema);
