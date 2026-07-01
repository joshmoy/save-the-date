import { NextResponse } from "next/server";
import { canAccessRole, getCurrentSession } from "../../../src/lib/auth";
import {
  createHallPasses,
  getTicketAvailability,
  listHallPasses,
  updatePassEmailDelivery,
} from "../../../src/lib/hallPasses";
import { isLikelyEmail } from "../../../src/lib/maileroo";
import { sendPassPdfEmail } from "../../../src/lib/passEmail";

const MAX_BATCH_SIZE = 100;

export async function GET() {
  const session = await getCurrentSession();

  if (!session || !canAccessRole(session, ["super_admin"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const [passes, ticketAvailability] = await Promise.all([
    listHallPasses(),
    getTicketAvailability(),
  ]);

  return NextResponse.json({ passes, ticketAvailability });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session || !canAccessRole(session, ["super_admin"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    guestName?: string;
    guestNames?: string[];
    inviteFrom?: string | null;
    delivery?: {
      sendEmail?: boolean;
      recipientEmail?: string;
      message?: string;
    };
  } | null;
  const shouldSendEmail = Boolean(body?.delivery?.sendEmail);
  const recipientEmail = body?.delivery?.recipientEmail?.trim() ?? "";
  const emailMessage = body?.delivery?.message?.trim() ?? "";

  if (shouldSendEmail && !isLikelyEmail(recipientEmail)) {
    return NextResponse.json({ error: "Enter a valid recipient email address." }, { status: 400 });
  }

  const guestNames =
    Array.isArray(body?.guestNames) && body.guestNames.length > 0
      ? body.guestNames.map((guestName) => (typeof guestName === "string" ? guestName.trim() : ""))
      : [body?.guestName ?? ""];
  const normalizedGuestNames = guestNames.map((guestName) =>
    typeof guestName === "string" ? guestName.trim() : "",
  );

  if (normalizedGuestNames.length === 0) {
    return NextResponse.json({ error: "Add at least one guest name." }, { status: 400 });
  }

  if (normalizedGuestNames.length > MAX_BATCH_SIZE) {
    return NextResponse.json(
      { error: `You can generate up to ${MAX_BATCH_SIZE} passes at once.` },
      { status: 400 },
    );
  }

  const passes = await createHallPasses(normalizedGuestNames, body?.inviteFrom ?? null, session);

  if (passes.length === 0) {
    const ticketAvailability = await getTicketAvailability();
    return NextResponse.json(
      {
        error:
          normalizedGuestNames.length === 1
            ? "Ticket limit reached."
            : "Ticket limit does not have enough remaining passes for this batch.",
        ticketAvailability,
      },
      { status: 409 },
    );
  }
  const ticketAvailability = await getTicketAvailability();
  let deliveredPasses = passes;
  let emailDelivery:
    | {
        attempted: boolean;
        success: boolean;
        recipientEmail: string | null;
        error?: string;
      }
    | undefined;

  if (shouldSendEmail) {
    try {
      await sendPassPdfEmail({
        passes,
        recipientEmail,
        message: emailMessage,
      });
      deliveredPasses = await updatePassEmailDelivery(
        passes.map((item) => item.id),
        {
          recipient: recipientEmail,
          status: "sent",
        },
      );
      emailDelivery = {
        attempted: true,
        success: true,
        recipientEmail,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Email delivery failed.";
      deliveredPasses = await updatePassEmailDelivery(
        passes.map((item) => item.id),
        {
          recipient: recipientEmail,
          status: "failed",
          error: message,
        },
      );
      emailDelivery = {
        attempted: true,
        success: false,
        recipientEmail,
        error: message,
      };
    }
  }

  const pass = deliveredPasses[0];

  return NextResponse.json({
    pass,
    passes: deliveredPasses,
    qrValue: pass.token,
    ticketAvailability,
    emailDelivery,
  });
}
