import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ADMIN_COOKIE_NAME = "obd_admin_session";

export async function POST() {
  const response = NextResponse.json({
    status: "ok",
    message: "Logged out",
  });

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
