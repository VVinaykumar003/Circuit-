// app/api/projectUpdates/announcements/route.js
import dbConnect from "@/lib/mongodb";
import Announcement from "@/app/models/Announcement";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const projectName = searchParams.get("projectName");

    if (!projectName) {
      return new Response(JSON.stringify({ message: "projectName is required" }), { status: 400 });
    }

    const announcements = await Announcement.findOne({ projectName });

    if (!announcements) {
      return new Response(JSON.stringify({ message: "No announcements found" }), { status: 404 });
    }

    return new Response(JSON.stringify(announcements), { status: 200 });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
}
