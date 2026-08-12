import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { canAccessRole, getCurrentSession } from "../../../../src/lib/auth";

export async function POST() {
  const session = await getCurrentSession();

  if (!session || !canAccessRole(session, ["super_admin"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  revalidateTag("cloudinary-media", { expire: 0 });
  revalidatePath("/media");

  return NextResponse.json({ revalidated: true });
}
