import {assertLegacyWritable,withLegacyWriteFence} from "../../../../../src/lib/legacy-write-fence";
import { NextResponse } from "next/server";
import { canAccessRole, getCurrentSession } from "../../../../../src/lib/auth";
import { getTicketAvailability, invalidateHallPass } from "../../../../../src/lib/hallPasses";

async function POSTImplementation(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  const session = await getCurrentSession();

  if (!session || !canAccessRole(session, ["super_admin"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  await assertLegacyWritable();

  const { id } = await params;
  const pass = await invalidateHallPass(id, session);

  if (!pass) {
    return NextResponse.json({ error: "Pass not found." }, { status: 404 });
  }

  const ticketAvailability = await getTicketAvailability();

  return NextResponse.json({ pass, ticketAvailability });
}

export const POST=withLegacyWriteFence(POSTImplementation);
