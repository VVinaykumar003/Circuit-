import { NextResponse } from "next/server";
import { setSession ,getSession, deleteSession} from "@/lib/session"; // Make sure this is correct
import dbConnect from "@/lib/mongodb"; // your MongoDB connection
import User from "@/app/models/User"; // your Mongoose user model
import bcrypt from "bcryptjs";

export async function POST(req) {
  const { email, password } = await req.json();

  await dbConnect(); // Connect to DB
if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
  // Admin Login
  const adminUser = {
    name: "Admin User",
    email: process.env.ADMIN_EMAIL,
    role: "admin"
  };
  await setSession(adminUser);
  return NextResponse.json({ success: true, role: "admin" }, { status: 200 });
}
 const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
  }

  // Set session cookie
  await setSession({
    name: user.name,
    email: user.email,
    role: user.role,
  });

  return NextResponse.json({ success: true, role: user.role }, { status: 200 });
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json(session);
}

// DELETE session (for logout)
export async function DELETE() {
  await deleteSession();
  return NextResponse.json({ message: "Logged out" });}
