import "server-only";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import type { HallPass } from "./hallPasses";

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

  const page = document.addPage([612, 792]);
  const qrImage = await document.embedPng(qrBuffer);
  const times = await document.embedFont(StandardFonts.TimesRoman);
  const timesBold = await document.embedFont(StandardFonts.TimesRomanBold);
  const helveticaBold = await document.embedFont(StandardFonts.HelveticaBold);
  const courierBold = await document.embedFont(StandardFonts.CourierBold);
  const guestName = pass.guest_name ?? "Guest";

  function drawCenteredText(text: string, y: number, size: number, font = times, color = rgb(0.24, 0.15, 0.14)) {
    const maxWidth = 484;
    let displayText = text;

    while (displayText.length > 3 && font.widthOfTextAtSize(`${displayText}...`, size) > maxWidth) {
      displayText = displayText.slice(0, -1);
    }

    const finalText = displayText === text ? text : `${displayText}...`;
    const textWidth = font.widthOfTextAtSize(finalText, size);

    page.drawText(finalText, {
      x: (612 - textWidth) / 2,
      y,
      size,
      font,
      color,
    });
  }

  page.drawRectangle({ x: 32, y: 32, width: 548, height: 728, color: rgb(1, 0.973, 0.941) });
  page.drawRectangle({
    x: 48,
    y: 48,
    width: 516,
    height: 696,
    borderColor: rgb(0.831, 0.647, 0.478),
    borderWidth: 4,
  });
  page.drawRectangle({
    x: 64,
    y: 64,
    width: 484,
    height: 664,
    borderColor: rgb(0.8, 0.533, 0.6),
    borderWidth: 1.5,
  });

  drawCenteredText("ADEOLA & JOSHUA", 666, 18, timesBold, rgb(0.78, 0.263, 0.459));
  drawCenteredText("Hall Pass", 606, 48, times, rgb(0.502, 0, 0.125));
  drawCenteredText(formatTicketNumber(pass.ticket_number).toUpperCase(), 570, 16, helveticaBold);

  page.drawImage(qrImage, { x: 196, y: 328, width: 220, height: 220 });

  drawCenteredText(pass.token, 286, 20, courierBold);
  drawCenteredText(guestName, 228, 30, timesBold);
  drawCenteredText("Present this code at entry.", 168, 16, times, rgb(0.427, 0.298, 0.255));

  const pdfBytes = await document.save();

  return Buffer.from(pdfBytes);
}
