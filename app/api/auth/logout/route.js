import { deleteSession } from "@/lib/session";

export async function GET(request) {
  try {
    const response = response.json({
      message: "Logout successful",
      success : true,
      });
    response.cookie.set("token", "", {
      httpOnly: true,
      expires: new Date(0), // Set expiration to the past to clear the cookie
      });

       await deleteSession();
  return response.json({ message: "Logged out" });
    
    
  } catch (error) {
    return new Response(JSON.stringify({ message: "Internal Server Error", error: error.message }), { status: 500 });
    
  }
}