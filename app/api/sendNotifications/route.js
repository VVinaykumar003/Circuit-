// import { NextResponse } from "next/server";
// import dbConnect from "@/lib/mongodb";
// import Notification from "@/app/models/Notification";
// import { getIO } from "@/server";

// export const runtime = "nodejs"; // ensure Node runtime (not edge)

// export async function GET(req) {
//   try {
//     await dbConnect();
//     const { searchParams } = new URL(req.url);
//     const userId = searchParams.get("userId");
//     const unreadOnly = searchParams.get("unreadOnly") === "true";

//     if (!userId) {
//       return NextResponse.json({ error: "userId is required" }, { status: 400 });
//     }

//     const query = { userId };
//     if (unreadOnly) query.read = false;

//     const items = await Notification.find(query).sort({ createdAt: -1 }).lean();
//     return NextResponse.json({ data: items }, { status: 200 });
//   } catch (e) {
//     console.error("GET /api/notifications error:", e);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(req) {
//   try {
//     await dbConnect();
//     const body = await req.json();

//     const { userIds, title, message, type = "general", data = {} } = body || {};
//     if (!Array.isArray(userIds) || userIds.length === 0 || !title || !message) {
//       return NextResponse.json(
//         { error: "userIds[], title, message are required" },
//         { status: 400 }
//       );
//     }

//     // Persist notifications (one per user)
//     const docs = userIds.map((uid) => ({
//       userId: uid,
//       title,
//       message,
//       type,
//       data,
//       read: false,
//     }));
//     const saved = await Notification.insertMany(docs);

//     // Emit real-time to user rooms
//     const io = getIO();
//     if (io) {
//       userIds.forEach((uid) => {
//         io.to(`user:${uid}`).emit("notification", {
//           title,
//           message,
//           type,
//           data,
//           createdAt: new Date().toISOString(),
//         });
//       });
//     }

//     return NextResponse.json(
//       { message: "Notifications sent", data: saved },
//       { status: 201 }
//     );
//   } catch (e) {
//     console.error("POST /api/notifications error:", e);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }
