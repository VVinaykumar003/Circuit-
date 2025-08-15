// app/api/projectUpdates/updates/route.js
import dbConnect from "@/lib/mongodb";
import ProjectUpdate from "@/app/models/ProjectUpdate";

export async function GET(req) {
  try {
    await dbConnect();

    // Extract projectName from query params
    const { searchParams } = new URL(req.url);
    const projectName = searchParams.get("projectName");

    if (!projectName) {
      return new Response(
        JSON.stringify({ message: "projectName query param is required" }),
        { status: 400 }
      );
    }

    // Find updates for the project
    const projectUpdates = await ProjectUpdate.findOne({ projectName });

    if (!projectUpdates) {
      return new Response(
        JSON.stringify({ message: "No updates found for this project" }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify(projectUpdates), { status: 200 });
  } catch (error) {
    console.error("Error fetching project updates:", error);
    return new Response(
      JSON.stringify({ message: "Internal server error" }),
      { status: 500 }
    );
  }
}
