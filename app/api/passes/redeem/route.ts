import { NextResponse } from "next/server";
import { canAccessRole, getCurrentSession } from "../../../../src/lib/auth";
import { logScanAttempt, redeemHallPass } from "../../../../src/lib/hallPasses";

function extractToken(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    const segments = url.pathname.split("/").filter(Boolean);
    const verifyIndex = segments.findIndex((segment) => segment === "verify");

    if (verifyIndex >= 0 && segments[verifyIndex + 1]) {
      return decodeURIComponent(segments[verifyIndex + 1]);
    }
  } catch {
    // Not a URL; treat the scan as a raw token.
  }

  const segments = trimmed.split("/").filter(Boolean);
  return decodeURIComponent(segments.at(-1) ?? trimmed);
}

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session || !canAccessRole(session, ["super_admin", "bouncer"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { value?: string } | null;
  const token = extractToken(body?.value ?? "");

  if (!token) {
    const result = {
      id: null,
      ticket_number: null,
      guest_name: null,
      status: "invalid" as const,
      used_at: null,
    };
    await logScanAttempt("EMPTY", session.email, result);
    return NextResponse.json({ result });
  }

  const result = await redeemHallPass(token, session.email);
  await logScanAttempt(token, session.email, result);

  return NextResponse.json({ result });
}
