// app/api/auth/session/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/app/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Connect to DB at module level for efficiency
await dbConnect();

// ✅ POST: Handle login and return JWT
export async function POST(req) {
  try {
    const { email, password } = await req.json();

    // Admin special (optional)
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const adminUser = {
        id: "admin",
        name: "Admin User",
        email: process.env.ADMIN_EMAIL,
        role: "admin"
      };
      const token = jwt.sign(adminUser, process.env.JWT_SECRET, { expiresIn: "1h" });
      return NextResponse.json({ success: true, token, role: "admin", user: adminUser });
    }

    // Normal user login
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Return token and user data
    return NextResponse.json({
      success: true,
      token,
      role: user.role,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ✅ GET: Validate user session (check token from header)
// For example, your frontend calls this after login to confirm session is valid
export async function GET(req) {
  try {
    // Extract token from Authorization header (Bearer ...)
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "No token provided" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    // Verify token using your secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Return the decoded payload (e.g., user info)
    return NextResponse.json({ user: decoded, role: decoded.role });
  } catch (err) {
    return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 });
  }
}
