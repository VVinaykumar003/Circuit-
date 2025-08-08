import { cookies } from "next/headers";

export const setSession = async ( User ) => {
  (await cookies()).set({
    name: "session",
    value: JSON.stringify(User),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "lax",
  });
  return { message: "Session set successfully" };
};

export const getSession = async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie) return null;
  try {
    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
};

export const deleteSession = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  return { message: "Session deleted successfully" };
};
