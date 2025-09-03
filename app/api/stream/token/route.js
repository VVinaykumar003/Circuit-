// app/api/stream/token/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
// import { StreamClient } from "@stream-io/node-sdk"; // Correct import
import {StreamClient} from "@stream-io/video-react-sdk";

import { verifyToken } from "@/lib/auth";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

export async function POST() {
  try {
    // Read your JWT from a secure cookie
    const tokenCookie = cookies().get("token")?.value;
    if (!tokenCookie) {
      return NextResponse.json({ error: "No auth token found" }, { status: 401 });
    }

    const decoded = verifyToken(tokenCookie);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // Correct Stream client instantiation
    const serverClient = new StreamClient(apiKey, apiSecret);
    const streamToken = serverClient.createToken(decoded.id);

    return NextResponse.json({
      success: true,
      apiKey,
      user: {
        id: decoded.id,
        name: decoded.name || decoded.email || "User",
      },
      token: streamToken,
    });
  } catch (err) {
    console.error("Stream token error:", err);
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
  }
}
