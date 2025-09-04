import mongoose, { Schema, models, model } from "mongoose";

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: "general" }, // e.g., "attendance" | "task" | "system"
    data: { type: Object, default: {} },        // extra payload (IDs, links, etc.)
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default models.Notification || model("Notification", NotificationSchema);
