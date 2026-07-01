import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";

export const authCookieName = "hall_pass_session";

export type AppRole = "super_admin" | "bouncer";

export type AuthSession = {
  userId: string;
  email: string;
  role: AppRole;
  issuedAt: number;
};

const sessionTtlMs = 1000 * 60 * 60 * 12;

function getAuthSecret() {
  const secret = process.env.AUTH_COOKIE_SECRET;

  if (!secret) {
    throw new Error("Missing AUTH_COOKIE_SECRET. Add it to .env.local or your Railway environment.");
  }

  return secret;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return crypto.createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

function timingSafeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function createSessionToken(user: { id: string; email: string; role: AppRole }) {
  const payload = base64UrlEncode(
    JSON.stringify({
      userId: user.id,
      email: user.email,
      role: user.role,
      issuedAt: Date.now(),
    } satisfies AuthSession),
  );

  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): AuthSession | null {
  if (!token) return null;

  const [payload, signature] = token.split(".");

  if (!payload || !signature || !timingSafeEqual(sign(payload), signature)) {
    return null;
  }

  try {
    const session = JSON.parse(base64UrlDecode(payload)) as AuthSession;
    const isKnownRole = session.role === "super_admin" || session.role === "bouncer";
    const hasIdentity = Boolean(session.userId && session.email);
    const isFresh = Date.now() - session.issuedAt <= sessionTtlMs;

    return isKnownRole && hasIdentity && isFresh ? session : null;
  } catch {
    return null;
  }
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(authCookieName)?.value);
}

export function canAccessRole(session: AuthSession | null, allowedRoles: AppRole[]) {
  return session ? allowedRoles.includes(session.role) : false;
}

export function getSessionMaxAgeSeconds() {
  return Math.floor(sessionTtlMs / 1000);
}
