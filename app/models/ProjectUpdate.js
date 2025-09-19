import mongoose from "mongoose";

const workUpdateSchema = new mongoose.Schema({
  email: String,
  date: String,
  workUpdate: {
    msg: String,
    source: { type: String, default: "No Files" }
  }
});

const announcementSchema = new mongoose.Schema({
  fromEmail: String,
  date: String,
  post: {
    msg: String,
    file: { type: String, default: "No Files" }
  },
  toEmail: [
    {
      email: String,
      state: { type: Boolean, default: true } // true = unread, false = read
    }
  ]
});

const projectUpdateSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  projectName: String,
  updates: [workUpdateSchema],
  announcements: [announcementSchema]
}, { timestamps: true });

export default mongoose.models.ProjectUpdate || mongoose.model("ProjectUpdate", projectUpdateSchema);
