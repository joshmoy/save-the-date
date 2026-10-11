import "server-only";

import type { HallPass } from "./hallPasses";
import { sendMailerooEmail } from "./maileroo";
import { createPassPdfBuffer, getPassPdfFileName } from "./passPdf";

export const PASS_EMAIL_BATCH_SIZE = 10;

type SendPassEmailInput = {
  passes: HallPass[];
  recipientEmail: string;
  message: string;
  batchLabel?: string;
};

export type PassEmailBatchResult = {
  sentPassIds: string[];
  failedPassIds: string[];
  errors: string[];
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

function formatGuestName(pass: HallPass) {
  return pass.guest_name?.trim() || "Guest";
}

function buildGuestNameLines(passes: HallPass[]) {
  if (passes.length === 1) {
    return `This ticket pass is generated for ${formatGuestName(passes[0])}.`;
  }

  const names = passes.map((pass) => formatGuestName(pass)).join(", ");
  return `This ticket pass is generated for ${names}.`;
}

function buildSubject(passes: HallPass[], batchLabel?: string) {
  const batchPrefix = batchLabel ? ` (${batchLabel})` : "";

  if (passes.length === 1) {
    return `Your Hall Pass - ${formatTicketNumber(passes[0].ticket_number)}${batchPrefix}`;
  }

  return `Hall Pass Tickets${batchPrefix} - ${passes.length} PDF Attachments`;
}

function buildPlainMessage(message: string, passes: HallPass[]) {
  const intro = message.trim() || "Please find the attached hall pass ticket PDF.";
  const guestLines = buildGuestNameLines(passes);
  const ticketSummary = passes
    .map((pass) => `${formatTicketNumber(pass.ticket_number)} - ${formatGuestName(pass)} - ${pass.token}`)
    .join("\n");

  return `${intro}\n\n${guestLines}\n\nAttached tickets:\n${ticketSummary}`;
}

function buildHtmlMessage(message: string, passes: HallPass[]) {
  const intro = escapeHtml(message.trim() || "Please find the attached hall pass ticket PDF.").replaceAll(
    "\n",
    "<br />",
  );
  const guestLines = buildGuestNameLines(passes);
  const listItems = passes
    .map(
      (pass) =>
        `<li><strong>${escapeHtml(formatTicketNumber(pass.ticket_number))}</strong> - ${escapeHtml(formatGuestName(pass))} - <code>${escapeHtml(pass.token)}</code></li>`,
    )
    .join("");

  return `<p>${intro}</p><p>${escapeHtml(guestLines)}</p><p>Attached tickets:</p><ul>${listItems}</ul>`;
}

function chunkPasses<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

export async function sendPassPdfEmail({ passes, recipientEmail, message, batchLabel }: SendPassEmailInput) {
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
    subject: buildSubject(passes, batchLabel),
    plain: buildPlainMessage(message, passes),
    html: buildHtmlMessage(message, passes),
    attachments,
  });
}

export async function sendPassPdfEmailsBatched({
  passes,
  recipientEmail,
  message,
  batchSize = PASS_EMAIL_BATCH_SIZE,
}: Omit<SendPassEmailInput, "batchLabel"> & { batchSize?: number }): Promise<PassEmailBatchResult> {
  const batches = chunkPasses(passes, batchSize);
  const sentPassIds: string[] = [];
  const failedPassIds: string[] = [];
  const errors: string[] = [];

  for (const [index, batch] of batches.entries()) {
    const batchLabel = batches.length > 1 ? `${index + 1}/${batches.length}` : undefined;

    try {
      await sendPassPdfEmail({
        passes: batch,
        recipientEmail,
        message,
        batchLabel,
      });
      sentPassIds.push(...batch.map((pass) => pass.id));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Email delivery failed.";
      failedPassIds.push(...batch.map((pass) => pass.id));
      errors.push(`Batch ${index + 1}: ${errorMessage}`);
    }
  }

  return { sentPassIds, failedPassIds, errors };
}
