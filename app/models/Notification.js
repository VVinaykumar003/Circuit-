import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    fromEmail: { type: String, required: true },
    msg: {
      msgcontent: { type: String, required: true },
      source: { type: String, default: "No Files" }, // file URL or "No Files"
    },
    dataTo: { type: String, enum: ["public", "private"], required: true },
    toEmail: [
      {
        email: { type: String, required: true },
        state: { type: String, enum: ["unread", "read"], default: "unread" },
      },
    ],
    date: { type: Date, default: Date.now }, // ✅ better as Date
  },
  { timestamps: true }
);

// ✅ Indexes for fast queries
NotificationSchema.index({ fromEmail: 1 });
NotificationSchema.index({ "toEmail.email": 1 });
NotificationSchema.index({ date: 1 });

export default mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);

//   import mongoose from 'mongoose';

// const NotificationSchema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   message: {
//     type: String,
//     required: true,
//   },
//   type: {
//     type: String,
//     enum: ['info', 'success', 'warning', 'error', 'announcement'],
//     default: 'info',
//   },
//   priority: {
//     type: String,
//     enum: ['low', 'medium', 'high', 'urgent'],
//     default: 'medium',
//   },
//   sendTo: {
//     type: String,
//     enum: ['all', 'private'],
//     required: true,
//   },
//   sender: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
//   attachments: [{
//     filename: {
//       type: String,
//       required: true,
//     },
//     originalName: {
//       type: String,
//       required: true,
//     },
//     mimetype: {
//       type: String,
//       required: true,
//     },
//     size: {
//       type: Number,
//       required: true,
//     },
//     path: {
//       type: String,
//       required: true,
//     },
//   }],
//   isActive: {
//     type: Boolean,
//     default: true,
//   },
//   expiresAt: {
//     type: Date,
//     default: null,
//   },
// }, {
//   timestamps: true,
// });

// // Create indexes
// NotificationSchema.index({ sendTo: 1, createdAt: -1 });
// NotificationSchema.index({ sender: 1 });
// NotificationSchema.index({ isActive: 1 });

// export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
