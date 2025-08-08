import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "POST") {
    const data = req.body;
    const created = await Notification.create(data);
    return res.status(201).json(created);
  }

  res.status(405).json({ message: "Method not allowed" });
}
