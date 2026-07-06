import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import QRCode from "qrcode";
import type { HallPass } from "./hallPasses";

const PAGE_W = 850;
const PAGE_H = 400;

let invitationBytesPromise: Promise<Buffer | null> | null = null;

function loadInvitationBytes() {
  if (!invitationBytesPromise) {
    const invitationPath = path.join(process.cwd(), "public", "invitation.jpg");
    invitationBytesPromise = readFile(invitationPath).catch(() => null);
  }

  return invitationBytesPromise;
}

function formatTicketNumber(ticketNumber: number) {
  return `Ticket #${ticketNumber.toString().padStart(3, "0")}`;
}

export function getPassPdfFileName(pass: HallPass) {
  const guestName = pass.guest_name ?? "guest";
  const safeName = guestName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  return `hall-pass-ticket-${pass.ticket_number.toString().padStart(3, "0")}-${safeName || "guest"}.pdf`;
}

export async function createPassPdfBuffer(pass: HallPass) {
  const qrBuffer = await QRCode.toBuffer(pass.token, {
    margin: 1,
    width: 420,
    color: {
      dark: "#3E2723",
      light: "#FFFFFF",
    },
  });

  const document = await PDFDocument.create();
  document.setTitle(`${formatTicketNumber(pass.ticket_number)} Hall Pass`);
  document.setAuthor("Adeola & Joshua");
  document.setSubject("Hall Pass");

  const page = document.addPage([PAGE_W, PAGE_H]);
  const qrImage = await document.embedPng(qrBuffer);
  const times = await document.embedFont(StandardFonts.TimesRoman);
  const timesItalic = await document.embedFont(StandardFonts.TimesRomanItalic);
  const timesBold = await document.embedFont(StandardFonts.TimesRomanBold);
  const helveticaBold = await document.embedFont(StandardFonts.HelveticaBold);
  const courierBold = await document.embedFont(StandardFonts.CourierBold);
  const guestName = pass.guest_name ?? "Guest";

  const cream = rgb(1, 0.973, 0.941);
  const burgundy = rgb(0.502, 0, 0.125);
  const roseWine = rgb(0.78, 0.263, 0.459);
  const roseGold = rgb(0.831, 0.647, 0.478);
  const deepBrown = rgb(0.24, 0.15, 0.14);
  const textSecondary = rgb(0.427, 0.298, 0.255);

  function drawCentered(
    text: string,
    centerX: number,
    y: number,
    size: number,
    font = times,
    color = deepBrown,
    maxWidth = 320,
  ) {
    let displayText = text;

    while (
      displayText.length > 3 &&
      font.widthOfTextAtSize(displayText === text ? displayText : `${displayText}...`, size) > maxWidth
    ) {
      displayText = displayText.slice(0, -1);
    }

    const finalText = displayText === text ? text : `${displayText}...`;
    const textWidth = font.widthOfTextAtSize(finalText, size);

    page.drawText(finalText, {
      x: centerX - textWidth / 2,
      y,
      size,
      font,
      color,
    });
  }

  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: cream });
  page.drawRectangle({
    x: 16,
    y: 16,
    width: PAGE_W - 32,
    height: PAGE_H - 32,
    borderColor: roseGold,
    borderWidth: 3,
  });
  page.drawRectangle({
    x: 24,
    y: 24,
    width: PAGE_W - 48,
    height: PAGE_H - 48,
    borderColor: roseWine,
    borderWidth: 1,
  });

  // Left panel: invitation image
  const invitationBytes = await loadInvitationBytes();
  const imgPanelH = PAGE_H - 76;
  const imgH = imgPanelH;
  const imgW = Math.round(imgH * (620 / 930));
  const imgX = 40;
  const imgY = 38;

  if (invitationBytes) {
    const invitationImage = await document.embedJpg(invitationBytes);
    page.drawRectangle({
      x: imgX - 4,
      y: imgY - 4,
      width: imgW + 8,
      height: imgH + 8,
      borderColor: roseGold,
      borderWidth: 2,
    });
    page.drawImage(invitationImage, { x: imgX, y: imgY, width: imgW, height: imgH });
  } else {
    page.drawRectangle({ x: imgX, y: imgY, width: imgW, height: imgH, color: burgundy });
    drawCentered("Adeola & Joshua", imgX + imgW / 2, imgY + imgH / 2, 16, timesItalic, cream, imgW - 20);
  }

  const detailsLeft = imgX + imgW + 24;
  const qrSize = 178;
  const qrX = PAGE_W - 40 - qrSize;
  const qrY = (PAGE_H - qrSize) / 2 - 6;
  const detailsRight = qrX - 24;
  const detailsCenter = (detailsLeft + detailsRight) / 2;
  const detailsWidth = detailsRight - detailsLeft;

  // Divider between details and QR
  page.drawLine({
    start: { x: qrX - 20, y: 70 },
    end: { x: qrX - 20, y: PAGE_H - 70 },
    thickness: 1,
    color: roseGold,
    opacity: 0.6,
  });

  // Middle panel: details
  drawCentered("ADEOLA & JOSHUA", detailsCenter, PAGE_H - 78, 12, timesBold, roseWine, detailsWidth);
  drawCentered("Hall Pass", detailsCenter, PAGE_H - 128, 34, times, burgundy, detailsWidth);
  drawCentered(formatTicketNumber(pass.ticket_number).toUpperCase(), detailsCenter, PAGE_H - 156, 12, helveticaBold, deepBrown, detailsWidth);

  page.drawLine({
    start: { x: detailsCenter - 70, y: PAGE_H - 172 },
    end: { x: detailsCenter + 70, y: PAGE_H - 172 },
    thickness: 1,
    color: roseGold,
  });

  drawCentered(guestName, detailsCenter, PAGE_H - 214, 24, timesBold, deepBrown, detailsWidth);
  drawCentered("Saturday 1st August 2026", detailsCenter, PAGE_H - 240, 13, timesItalic, textSecondary, detailsWidth);
  drawCentered(pass.token, detailsCenter, PAGE_H - 286, 17, courierBold, deepBrown, detailsWidth);
  drawCentered("Present this code at entry.", detailsCenter, PAGE_H - 312, 11, times, textSecondary, detailsWidth);

  // Right panel: QR
  const qrCenter = qrX + qrSize / 2;
  drawCentered("SCAN TO VERIFY", qrCenter, qrY + qrSize + 14, 10, helveticaBold, textSecondary, qrSize + 20);
  page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });

  if (pass.invalidated_at) {
    page.drawText("INVALIDATED", {
      x: PAGE_W / 2 - 220,
      y: PAGE_H / 2 - 30,
      size: 90,
      font: helveticaBold,
      color: rgb(0.706, 0.137, 0.094),
      rotate: degrees(-16),
      opacity: 0.16,
    });
  }

  const pdfBytes = await document.save();

  return Buffer.from(pdfBytes);
}
