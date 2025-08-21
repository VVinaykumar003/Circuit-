import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // reference User model
    required: true,
  },
  roleInProject: { 
    type: String, 
    required: true, 
  }, // e.g. "frontend", "tester", etc.
  responsibility: { 
    type: String, 
    required: true, 
  },
});

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
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    
    // ✅ Link to manager (who is a User with role "manager")
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ✅ Other participants
    participants: { type: [participantSchema], default: [] },
  },
  { timestamps: true }
);

const Project =
  mongoose.models.Project || mongoose.model("Project", projectSchema);

export default Project;
