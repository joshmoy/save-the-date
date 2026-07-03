import { NextResponse } from "next/server";
import { canAccessRole, getCurrentSession } from "../../../../src/lib/auth";
import { getTicketAvailability, invalidateAllHallPasses } from "../../../../src/lib/hallPasses";

export async function POST() {
  const session = await getCurrentSession();

  if (!session || !canAccessRole(session, ["super_admin"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const passes = await invalidateAllHallPasses(session);
    const ticketAvailability = await getTicketAvailability();

    return NextResponse.json({
      invalidatedCount: passes.length,
      passes,
      ticketAvailability,
    });
  } catch (error) {
    console.error("Failed to invalidate all hall passes:", error);
    return NextResponse.json({ error: "Could not invalidate all passes." }, { status: 500 });
  }
}
