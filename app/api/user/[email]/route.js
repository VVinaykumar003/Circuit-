import { NextResponse } from "next/server";
// Import DB client as needed (e.g. Prisma, Mongoose, etc)
import dbConnect from "@/lib/mongodb";
import User from "@/app/models/User";

// ✅ GET user by email
export async function GET(req, { params }) {
  try {
    await dbConnect();
    const email = decodeURIComponent(params.email);

    const user = await User.findOne({ email }).lean(); // use findOne not findUnique
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ UPDATE user by email
export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const email = decodeURIComponent(params.email);
    const body = await req.json();

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: body },
      { new: true, runValidators: true } // return updated doc
    ).lean();

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
