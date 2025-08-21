import dbConnect from "@/lib/mongodb";
import User from "@/app/models/User";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    await dbConnect();

    // Support for both GET all and GET by email query
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    // If email is provided, fetch a single user
    if (email) {
      const user = await User.findOne({ email }).select('-password');
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(user);
    }

    // If no email, fetch all users
    const users = await User.find().select('-password');
    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
