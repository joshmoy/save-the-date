import { NextResponse } from "next/server";
import {
  authCookieName,
  createSessionToken,
  getSessionMaxAgeSeconds,
} from "../../../../src/lib/auth";
import { findUserByEmail, verifyUserPassword } from "../../../../src/lib/users";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;

  const email = body?.email?.trim();
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json({ error: "Invalid login request." }, { status: 400 });
  }

  const user = await findUserByEmail(email);
  const isValidPassword = user ? await verifyUserPassword(user, password) : false;

  if (!user || !isValidPassword) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const response = NextResponse.json({ email: user.email, role: user.role });

  response.cookies.set({
    name: authCookieName,
    value: createSessionToken(user),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getSessionMaxAgeSeconds(),
  });

  return response;
}
