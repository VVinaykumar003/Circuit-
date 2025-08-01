import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { firestore } from "@/lib/firebaseAdmin"; // Ensure this path is correct
import admin from "firebase-admin";

// Use admin.firestore() directly if importing firestore does not work
const db = admin.firestore();

export async function POST(request) {
  const data = await request.json();

  // Validate the request body
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

  try {
    // Create the user in Firebase Authentication
    const userRecord = await getAuth().createUser({
      email: data.email,
      password: data.password,
    });

    // Save additional user data in Firestore
    const userDocRef = db.collection("users").doc(userRecord.uid);
    await userDocRef.set({
      email: data.email,
      name: data.name,
      profileImgUrl: data.profileImgUrl,
      gender: data.gender,
      role: data.role,
      phoneNumber: data.phoneNumber,
      dateOfBirth: data.dateOfBirth,
      profileState: data.profileState,
    });

    return NextResponse.json({ message: "User created successfully!" });
  } catch (error) {
    console.error("Error in API route:", error); // Log error details
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
