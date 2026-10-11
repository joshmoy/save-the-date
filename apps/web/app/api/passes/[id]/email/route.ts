import { NextResponse } from "next/server";
import { canAccessRole, getCurrentSession } from "../../../../../src/lib/auth";
import { getHallPassById, updatePassEmailDelivery } from "../../../../../src/lib/hallPasses";
import { isLikelyEmail } from "../../../../../src/lib/maileroo";
import { sendPassPdfEmail } from "../../../../../src/lib/passEmail";

export async function POST(
  request: Request,
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

  const { id } = await params;
  const pass = await getHallPassById(id);

  if (!pass) {
    return NextResponse.json({ error: "Pass not found." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as {
    recipientEmail?: string;
    message?: string;
  } | null;
  const recipientEmail = body?.recipientEmail?.trim() || pass.email_recipient || "";
  const message =
    body?.message?.trim() ||
    "Please find the attached hall pass ticket PDF. Present the QR code at entry.";

  if (!isLikelyEmail(recipientEmail)) {
    return NextResponse.json({ error: "Enter a valid recipient email address." }, { status: 400 });
  }

  try {
    await sendPassPdfEmail({
      passes: [pass],
      recipientEmail,
      message,
    });
    const [updatedPass] = await updatePassEmailDelivery([pass.id], {
      recipient: recipientEmail,
      status: "sent",
    });

    return NextResponse.json({ pass: updatedPass });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email delivery failed.";
    const [updatedPass] = await updatePassEmailDelivery([pass.id], {
      recipient: recipientEmail,
      status: "failed",
      error: message,
    });

    return NextResponse.json({ error: message, pass: updatedPass }, { status: 502 });
  }
}
