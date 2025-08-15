import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
  email: { type: String, required: true },
  role: { type: String, required: true },
  responsibility: { type: String, required: true }
});

const projectSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: true,
      trim: true,
      unique: true, // ✅ prevent duplicates automatically
      match: /^[a-zA-Z0-9-_]+$/, // ✅ same regex as frontend
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
    participants:{ type: [participantSchema], default: [] }, // ✅ store participants
  },
  { timestamps: true }
);

const Project =
  mongoose.models.Project || mongoose.model("Project", projectSchema);

export default Project;

