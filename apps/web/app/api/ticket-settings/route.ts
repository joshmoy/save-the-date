import { NextResponse } from "next/server";
import { canAccessRole, getCurrentSession } from "../../../src/lib/auth";
import { getTicketAvailability, updateTicketLimit } from "../../../src/lib/hallPasses";

export async function GET() {
  const session = await getCurrentSession();

  if (!session || !canAccessRole(session, ["super_admin"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const ticketAvailability = await getTicketAvailability();

  return NextResponse.json({ ticketAvailability });
}

export async function PUT(request: Request) {
  const session = await getCurrentSession();

  if (!session || !canAccessRole(session, ["super_admin"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { ticketLimit?: number | null } | null;
  const rawLimit = body?.ticketLimit;

  if (rawLimit !== null && rawLimit !== undefined && (!Number.isInteger(rawLimit) || rawLimit < 0)) {
    return NextResponse.json({ error: "Ticket limit must be a non-negative integer." }, { status: 400 });
  }

  const ticketAvailability = await updateTicketLimit(rawLimit ?? null, session);

  return NextResponse.json({ ticketAvailability });
}
