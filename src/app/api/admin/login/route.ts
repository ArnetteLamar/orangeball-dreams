import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ADMIN_COOKIE_NAME = "obd_admin_session";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const password = String(body.password || "");
    const adminPassword = process.env.ADMIN_PASSWORD;
    const sessionSecret = process.env.ADMIN_SESSION_SECRET;

    if (!adminPassword || !sessionSecret) {
      return NextResponse.json(
        { error: "Admin auth is not configured" },
        { status: 500 },
      );
    }

    if (password !== adminPassword) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const response = NextResponse.json({
      status: "ok",
      message: "Logged in",
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: sessionSecret,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
