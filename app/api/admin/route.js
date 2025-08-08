import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const data = await request.json();

    // Required fields validation
    const requiredFields = [
      "email",
      "password",
      "name",
      "gender",
      "role",
      "phoneNumber",
      "dateOfBirth",
      "profileState",
      "profileImgUrl",
    ];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Missing field: ${field}` },
          { status: 400 }
        );
      }
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password securely
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create new user document
    await User.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      gender: data.gender,
      role: data.role,
      phoneNumber: data.phoneNumber,
      dateOfBirth: data.dateOfBirth,
      profileState: data.profileState,
      profileImgUrl: data.profileImgUrl,
    });

    return NextResponse.json({ message: "User created successfully!" });
  } catch (error) {
    console.error("Error in user creation API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
