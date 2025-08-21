// app/api/projectUpdates/announcements/route.js

// Use relative imports to avoid alias issues from within app/api/*
// From this file to lib/mongodb.js and models/Announcement.js:
import dbConnect from "../../../lib/mongodb";
import Announcement from "@/app/models/Announcement";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const projectName = searchParams.get("projectName");

    // If projectName missing, still respond OK with empty list
    if (!projectName) {
      return new Response(JSON.stringify({ announcement: [] }), { status: 200 });
    }

    // Fetch announcements for the project.
    // If your schema stores multiple docs per project:
    // e.g. [{ projectName, fromEmail, date, post: { msg, file }, ... }, ...]
    const docs = await Announcement.find({ projectName })
      .sort({ createdAt: -1 })
      .lean();

    // Normalize to the key your UI expects: "announcement"
    return new Response(
      JSON.stringify({ announcement: Array.isArray(docs) ? docs : [] }),
      { status: 200 }
    );
  } catch (e) {
    console.error("announcements GET error:", e);
    return new Response(JSON.stringify({ msg: "Internal server error" }), { status: 500 });
  }
}

// Optional: If you later need to create announcements via POST from a different page,
// you can add a POST handler here (your UI currently posts to /api/projectUpdates/addAnnouncement).
// Keeping GET only for now to satisfy the listing in your Project Details page.
