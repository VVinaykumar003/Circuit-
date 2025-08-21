import dbConnect from "@/lib/mongodb";
import Notification from "@/app/models/Notification";

// GET /api/notifications?email=someone@gmail.com
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    let filter = {};
    if (email) {
      // Find notifications where toEmail array contains that email
      filter = { "toEmail.email": email };
    }

    const notifications = await Notification.find(filter);

    return new Response(JSON.stringify(notifications), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
