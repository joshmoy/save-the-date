import { NextResponse } from "next/server";
import { canAccessRole, getCurrentSession } from "../../../../src/lib/auth";
import { invalidateAllHallPasses } from "../../../../src/lib/hallPasses";

export async function POST() {
  const session = await getCurrentSession();

  if (!session || !canAccessRole(session, ["super_admin"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const passes = await invalidateAllHallPasses(session);

  return NextResponse.json({
    invalidatedCount: passes.length,
    passes,
  });
}
