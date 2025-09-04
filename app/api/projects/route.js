// app/api/auth/session/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/app/models/User";
import bcrypt from "bcryptjs";
import jwt, { decode } from "jsonwebtoken";
import Project from "@/app/models/project";
import { verifyAuth } from "@/lib/auth";
import mongoose from 'mongoose';




// ✅ POST: Handle login and return JWT
// export async function POST(req) {
//    await dbConnect();
//   try {
   
//     const { email, password } = await req.json();

//     // Admin special (optional)
//     if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
//       const adminUser = {
//         id: "admin",
//         name: "Admin User",
//         email: process.env.ADMIN_EMAIL,
//         role: "admin"
//       };
//       const token = jwt.sign(adminUser, process.env.JWT_SECRET, { expiresIn: "1h" });
//       return NextResponse.json({ success: true, token, role: "admin", user: adminUser });
//     }

//     // Normal user login
//     const user = await User.findOne({ email });
//     if (!user || !(await bcrypt.compare(password, user.password))) {
//       return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
//     }

//     // Generate JWT
//     const token = jwt.sign(
//       { id: user._id, email: user.email, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );

//     // Return token and user data
//     return NextResponse.json({
//       success: true,
//       token,
//       role: user.role,
//       user: { id: user._id, name: user.name, email: user.email }
//     });
//   } catch (err) {
//     console.error("Login error:", err);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }

export async function POST(req) {
  await dbConnect();

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const authUser = await verifyAuth(token);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["manager", "admin"].includes(authUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    console.log("Received project creation payload:", body);

    const {
      projectName,
      projectState = "ongoing",
      projectDomain = "",
      startDate,
      endDate,
      managerId,
      participants = [],
    } = body;

    if (!projectName || !startDate || !managerId) {
      return NextResponse.json({ error: "Missing projectName, startDate or managerId" }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(projectName)) {
      return NextResponse.json({ error: "Project name format invalid" }, { status: 400 });
    }

    if (endDate && new Date(startDate) > new Date(endDate)) {
      return NextResponse.json({ error: "Start date cannot be after end date" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(managerId)) {
      return NextResponse.json({ error: "Invalid managerId" }, { status: 400 });
    }

    const managerUser = await User.findById(managerId);
    if (!managerUser) {
      return NextResponse.json({ error: "Manager user not found" }, { status: 400 });
    }
    if (managerUser.role !== "manager" && authUser.role !== "admin") {
      return NextResponse.json({ error: "User is not authorized as manager" }, { status: 400 });
    }

    for (const p of participants) {
      if (
        !p.userId ||
        !p.email ||
        !p.username ||
        !p.roleInProject ||
        !p.responsibility
      ) {
        return NextResponse.json({ error: "Participant missing fields" }, { status: 400 });
      }
      if (!mongoose.Types.ObjectId.isValid(p.userId)) {
        return NextResponse.json({ error: `Participant userId invalid: ${p.userId}` }, { status: 400 });
      }
      const participantUser = await User.findById(p.userId);
      if (!participantUser) {
        return NextResponse.json({ error: `Participant userId not found: ${p.userId}` }, { status: 400 });
      }
    }

    const existingProject = await Project.findOne({ projectName });
    if (existingProject) {
      return NextResponse.json({ error: "Project name already exists" }, { status: 409 });
    }

    const newProject = new Project({
      projectName: projectName.trim(),
      projectState,
      projectDomain: projectDomain.trim(),
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      manager: managerId,
      participants: participants.map((p) => ({
        userId: p.userId,
        email: p.email,
        username: p.username,
        roleInProject: p.roleInProject,
        responsibility: p.responsibility,
      })),
    });

    const savedProject = await newProject.save();

    return NextResponse.json({ message: "Project successfully created", project: savedProject }, { status: 201 });

  } catch (error) {
    console.error("Project creation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}



// ✅ GET: Validate user session (check token from header)
// For example, your frontend calls this after login to confirm session is valid
export async function GET(req) {
   await dbConnect();
  try {

    // Extract token from Authorization header
    const authHeader = req.headers.get("authorization");
    console.log("Auth Header received:", authHeader); // Debug log

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "No token provided" }, 
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    console.log("Token extracted:", token ? "Present" : "Missing"); // Debug log

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token decoded successfully:", decoded.email); // Debug log
      console.log("decoded.role successfully:", decoded.role); // Debug log
      console.log("decoded.roleInProject successfully:", decoded.roleInProject); // Debug log
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json(
        { message: "Invalid token" }, 
        { status: 401 }
      );
    }

    // Connect to database
    await dbConnect();

    // Get projects with role-based filtering
    let query = {};
    if (decoded.role !== 'admin') {
      query.members = decoded.email; // Filter projects by user membership
    }

    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .lean();
      console.log("Projects fetched from DB:", projects); // Debug log

    console.log(`Found ${projects.length} projects for user ${decoded.email}`);

    return NextResponse.json(projects);

  } catch (error) {
    console.error("Projects API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}


