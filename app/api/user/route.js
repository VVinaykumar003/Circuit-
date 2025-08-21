import dbConnect from "@/lib/mongodb";
import User from "@/app/models/User";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();

    const users = await User.find().select("-password"); // exclude password
    // console.log("Fetched users:", users);
    return NextResponse.json(users);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export const getSingelProfile = async ( {email} ) => {
  try{
    //  const item = await GET();
    const email = email;
    const user = await User.findOne({ email }).select("-password");
    return user;

  }catch(error){

 console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

