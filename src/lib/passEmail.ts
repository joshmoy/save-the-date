import "server-only";

import type { HallPass } from "./hallPasses";
import { sendMailerooEmail } from "./maileroo";
import { createPassPdfBuffer, getPassPdfFileName } from "./passPdf";

type SendPassEmailInput = {
  passes: HallPass[];
  recipientEmail: string;
  message: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatTicketNumber(ticketNumber: number) {
  return `Ticket #${ticketNumber.toString().padStart(3, "0")}`;
}

function buildSubject(passes: HallPass[]) {
  if (passes.length === 1) {
    return `Your Hall Pass - ${formatTicketNumber(passes[0].ticket_number)}`;
  }

  return `Hall Pass Tickets - ${passes.length} PDF Attachments`;
}

function buildPlainMessage(message: string, passes: HallPass[]) {
  const intro = message.trim() || "Please find the attached hall pass ticket PDF.";
  const ticketSummary = passes
    .map((pass) => `${formatTicketNumber(pass.ticket_number)} - ${pass.guest_name ?? "Guest"} - ${pass.token}`)
    .join("\n");

  return `${intro}\n\nAttached tickets:\n${ticketSummary}`;
}

function buildHtmlMessage(message: string, passes: HallPass[]) {
  const intro = escapeHtml(message.trim() || "Please find the attached hall pass ticket PDF.").replaceAll(
    "\n",
    "<br />",
  );
  const listItems = passes
    .map(
      (pass) =>
        `<li><strong>${escapeHtml(formatTicketNumber(pass.ticket_number))}</strong> - ${escapeHtml(pass.guest_name ?? "Guest")} - <code>${escapeHtml(pass.token)}</code></li>`,
    )
    .join("");

  return `<p>${intro}</p><p>Attached tickets:</p><ul>${listItems}</ul>`;
}

export async function sendPassPdfEmail({ passes, recipientEmail, message }: SendPassEmailInput) {
  const attachments = await Promise.all(
    passes.map(async (pass) => {
      const pdfBuffer = await createPassPdfBuffer(pass);

      return {
        file_name: getPassPdfFileName(pass),
        content_type: "application/pdf",
        content: pdfBuffer.toString("base64"),
        inline: false,
      };
    }),
  );

  await sendMailerooEmail({
    to: { address: recipientEmail },
    subject: buildSubject(passes),
    plain: buildPlainMessage(message, passes),
    html: buildHtmlMessage(message, passes),
    attachments,
  });
}
