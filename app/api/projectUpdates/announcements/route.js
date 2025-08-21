import dbConnect from "@/lib/mongodb";
import Announcement from "@/app/models/Announcement";

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const projectName = searchParams.get("projectName");

    if (!projectName) {
      return Response.json({ announcement: [] });
    }

    const docs = await Announcement.find({ projectName })
      .populate({
        path: "fromUserId",
        select: "email name profileImgUrl",
      })
      .sort({ createdAt: -1 })
      .lean();

    const enriched = docs.map((a) => {
      return {
        ...a,
        fromUser: a.fromUserId
          ? {
              email: a.fromUserId.email,
              name: a.fromUserId.name,
              profileImgUrl: a.fromUserId.profileImgUrl,
            }
          : null,
      };
    });

    return Response.json({ announcement: enriched });
  } catch (err) {
    console.error("Error fetching announcements:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
