// app/api/login/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import  connect  from "@/lib/mongodb";
import User from "@/app/models/User";

export async function POST(request) {
  try {
    await connect();
   

    const { email, password } = await request.json();

   
  // ✅ Validate user credentials from DB here
  const User = {
    name: "Vinay Kumar",
    email: email,
    role: "admin"
  };
    // Admin Login
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const adminToken = jwt.sign(
        { email, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      const response = NextResponse.json(
        { message: "Admin login successful", role: "admin" },
        { status: 200 }
      );

      response.headers.set(
        "Set-Cookie",
        `token=${adminToken}; HttpOnly; Path=/; Max-Age=86400; ${
          process.env.NODE_ENV === "production" ? "Secure;" : ""
        }`
      );

      return response;
    }

    // Normal User Login
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid password" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 200 }
    );

    response.headers.set(
      "Set-Cookie",
      `token=${token}; HttpOnly; Path=/; Max-Age=86400; ${
        process.env.NODE_ENV === "production" ? "Secure;" : ""
      }`
    );

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
