import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  timestamp: Date,
  date: String,
  fromEmail: String,
  msg: {
    msgcontent: String,
    source: String,
  },
  dataTo: String,
  toEmail: [
    {
      email: String,
      state: String,
    },
  ],
}, { timestamps: true });

export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
