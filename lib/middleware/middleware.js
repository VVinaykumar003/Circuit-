// middleware.js
import { NextResponse } from "next/server";

export function middleware(request) {
  // retrieve role from cookies/JWT/session (customize for your app)
  const role = request.cookies.get('role')?.value;

  // Example: guard the root page and redirect to the right dashboard
  if (request.nextUrl.pathname === "/" && role) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }
  
  // ...add more route guards as needed

  return NextResponse.next();
}
