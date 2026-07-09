"use client";

import {
  Badge,
  Box,
  Button,
  Container,
  Dialog,
  Field,
  Flex,
  Heading,
  Image,
  Input,
  Portal,
  Select,
  SegmentGroup,
  createListCollection,
  Stack,
  Table,
  Text,
  Textarea,
} from "@chakra-ui/react";
import QRCode from "qrcode";
import { Ban, Download, Eye, Mail, Pencil, Plus, Printer, ShieldCheck, Users, X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import type { HallPass, TicketAvailability } from "../../lib/hallPasses";
import { formatDateTime } from "../../lib/formatDate";
import { toaster } from "../ui/toaster";

type PassResponse = {
  pass: HallPass;
  passes?: HallPass[];
  qrValue: string;
  ticketAvailability: TicketAvailability;
  emailDelivery?: {
    attempted: boolean;
    success: boolean;
    recipientEmail: string | null;
    error?: string;
  };
};

type GeneratedPass = {
  pass: HallPass;
  qrValue: string;
  qrDataUrl: string;
};

const statusOptions = createListCollection({
  items: [
    { label: "All statuses", value: "all" },
    { label: "Unused", value: "unused" },
    { label: "Used", value: "used" },
  ],
});

const inviteFromOptions = createListCollection({
  items: [
    { label: "Ade's dad", value: "Ade's dad" },
    { label: "Ade's mum", value: "Ade's mum" },
    { label: "Ade", value: "Ade" },
    { label: "Joshua", value: "Joshua" },
    { label: "Anu", value: "Anu" },
    { label: "Mummy Moyin", value: "Mummy Moyin" },
    { label: "Daddy D", value: "Daddy D" },
    { label: "Sir T", value: "Sir T" },
    { label: "Bro Bayo", value: "Bro Bayo" },
    { label: "Ayo", value: "Ayo" },
    { label: "David", value: "David" },
  ],
});

type StatusFilter = "all" | "unused" | "used";
type PassListTab = "active" | "invalidated";
type GenerationMode = "single" | "bulk";
type DeliveryMode = "generate" | "email";

const MAX_BATCH_SIZE = 100;

function preventEnterSubmit(event: KeyboardEvent) {
  if (event.key === "Enter" && (event.target as HTMLElement).tagName !== "TEXTAREA") {
    event.preventDefault();
  }
}

function parseBulkGuestNames(value: string) {
  return value
    .split(/[\n,]+/)
    .map((name) => name.trim())
    .filter(Boolean);
}

function formatTicketNumber(ticketNumber: number | null | undefined) {
  if (!ticketNumber) return "Ticket";

  return `Ticket #${ticketNumber.toString().padStart(3, "0")}`;
}

function isLikelyEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function getEmailStatus(pass: HallPass) {
  if (pass.email_status === "sent") {
    return { label: "Sent", color: "green" };
  }

  if (pass.email_status === "failed") {
    return { label: "Failed", color: "red" };
  }

  return { label: "Not sent", color: "gray" };
}

async function createQrDataUrl(value: string) {
  return QRCode.toDataURL(value, {
    margin: 1,
    width: 280,
    color: {
      dark: "#3E2723",
      light: "#FFFFFF",
    },
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function fitCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
) {
  if (context.measureText(text).width <= maxWidth) {
    context.fillText(text, x, y);
    return;
  }

  let truncated = text;

  while (truncated.length > 3 && context.measureText(`${truncated}...`).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }

  context.fillText(`${truncated}...`, x, y);
}

function getPassStatusLabel(pass: HallPass) {
  if (pass.invalidated_at) return "Invalidated";
  if (pass.used_at) return "Used";
  return "Ready";
}

function drawImageCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const offsetX = x + (width - drawWidth) / 2;
  const offsetY = y + (height - drawHeight) / 2;

  context.save();
  context.beginPath();
  context.rect(x, y, width, height);
  context.clip();
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  context.restore();
}

async function createPassImageDataUrl(selectedPass: GeneratedPass) {
  const canvas = document.createElement("canvas");
  canvas.width = 1360;
  canvas.height = 640;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create pass image.");
  }

  const qrImage = await loadImage(selectedPass.qrDataUrl);
  const invitationImage = await loadImage("/invitation.jpg").catch(() => null);
  const statusLabel = getPassStatusLabel(selectedPass.pass);
  const guestName = selectedPass.pass.guest_name ?? "Guest";

  context.fillStyle = "#FFF8F0";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "#D4A57A";
  context.lineWidth = 6;
  context.strokeRect(26, 26, canvas.width - 52, canvas.height - 52);

  context.strokeStyle = "#CC8899";
  context.lineWidth = 1.5;
  context.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

  // Left panel: invitation image
  const imgH = canvas.height - 120;
  const imgW = Math.round(imgH * (720 / 1019));
  const imgX = 64;
  const imgY = 60;

  if (invitationImage) {
    drawImageCover(context, invitationImage, imgX, imgY, imgW, imgH);
    context.strokeStyle = "#D4A57A";
    context.lineWidth = 3;
    context.strokeRect(imgX, imgY, imgW, imgH);
  } else {
    context.fillStyle = "#800020";
    context.fillRect(imgX, imgY, imgW, imgH);
  }

  // Right panel: QR
  const qrSize = 300;
  const qrX = canvas.width - 64 - qrSize;
  const qrY = (canvas.height - qrSize) / 2 - 10;
  const qrCenter = qrX + qrSize / 2;

  // Middle panel geometry
  const detailsLeft = imgX + imgW + 40;
  const detailsRight = qrX - 40;
  const detailsCenter = (detailsLeft + detailsRight) / 2;
  const detailsWidth = detailsRight - detailsLeft;

  context.strokeStyle = "#E7D8CE";
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(qrX - 20, 90);
  context.lineTo(qrX - 20, canvas.height - 90);
  context.stroke();

  context.textAlign = "center";

  context.fillStyle = "#C74375";
  context.font = "700 24px serif";
  context.fillText("ADEOLA & JOSHUA", detailsCenter, 150);

  context.fillStyle = "#800020";
  context.font = "400 58px serif";
  context.fillText("Hall Pass", detailsCenter, 220);

  context.fillStyle = selectedPass.pass.invalidated_at ? "#B42318" : "#3E2723";
  context.font = "700 22px sans-serif";
  context.fillText(
    `${formatTicketNumber(selectedPass.pass.ticket_number).toUpperCase()} · ${statusLabel.toUpperCase()}`,
    detailsCenter,
    262,
  );

  context.strokeStyle = "#D4A57A";
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(detailsCenter - 80, 285);
  context.lineTo(detailsCenter + 80, 285);
  context.stroke();

  context.fillStyle = "#3E2723";
  context.font = "700 42px serif";
  fitCanvasText(context, guestName, detailsCenter, 360, detailsWidth);

  context.fillStyle = "#6D4C41";
  context.font = "italic 400 24px serif";
  context.fillText("Saturday 1st August 2026", detailsCenter, 405);

  context.fillStyle = "#3E2723";
  context.font = "700 30px monospace";
  fitCanvasText(context, selectedPass.pass.token, detailsCenter, 470, detailsWidth);

  context.fillStyle = "#6D4C41";
  context.font = "400 20px serif";
  context.fillText("Present this code at entry.", detailsCenter, 512);

  context.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
  context.fillStyle = "#6D4C41";
  context.font = "700 18px sans-serif";
  context.fillText("SCAN TO VERIFY", qrCenter, qrY - 18);

  if (selectedPass.pass.invalidated_at) {
    context.save();
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate(-Math.PI / 9);
    context.globalAlpha = 0.16;
    context.fillStyle = "#B42318";
    context.font = "900 120px sans-serif";
    context.fillText("INVALIDATED", 0, 0);
    context.restore();
  }

  return canvas.toDataURL("image/png");
}

function getPassFileName(selectedPass: GeneratedPass) {
  const name = selectedPass.pass.guest_name ?? "guest";
  const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `hall-pass-${safeName || "guest"}-${selectedPass.pass.token}.png`;
}

function HallPassPreview({
  selectedPass,
  onEmailPass,
}: {
  selectedPass: GeneratedPass | null;
  onEmailPass: (pass: HallPass) => void;
}) {
  if (!selectedPass) {
    return (
      <Box textAlign="center" py={12} color="gray.500">
        <Text>Create a pass or select one from the table to preview its QR code.</Text>
      </Box>
    );
  }

  const passForPreview = selectedPass;
  const isInvalidated = Boolean(passForPreview.pass.invalidated_at);

  async function handleDownload() {
    try {
      const imageDataUrl = await createPassImageDataUrl(passForPreview);
      const link = document.createElement("a");
      link.href = imageDataUrl;
      link.download = getPassFileName(passForPreview);
      link.click();
      toaster.create({
        type: "success",
        title: "Hall pass downloaded",
        description: `${passForPreview.pass.token} was saved as a PNG.`,
      });
    } catch {
      toaster.create({
        type: "error",
        title: "Download failed",
        description: "Could not generate the hall pass image.",
      });
    }
  }

  async function handlePrint() {
    try {
      const imageDataUrl = await createPassImageDataUrl(passForPreview);
      const printWindow = window.open("", "_blank", "width=900,height=1200");

      if (!printWindow) {
        toaster.create({
          type: "error",
          title: "Print window blocked",
          description: "Allow popups for this site and try again.",
        });
        return;
      }

      printWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <title>Hall Pass</title>
            <style>
              body {
                margin: 0;
                min-height: 100vh;
                display: grid;
                place-items: center;
                background: #f7fafc;
              }
              img {
                max-width: 100%;
                max-height: 100vh;
              }
              @media print {
                body {
                  background: white;
                }
                img {
                  width: 100%;
                  max-height: none;
                }
              }
            </style>
          </head>
          <body>
            <img src="${imageDataUrl}" alt="Hall pass" onload="window.focus(); window.print();" />
          </body>
        </html>
      `);
      printWindow.document.close();
      toaster.create({
        type: "success",
        title: "Print view opened",
        description: `${passForPreview.pass.token} is ready to print.`,
      });
    } catch {
      toaster.create({
        type: "error",
        title: "Print failed",
        description: "Could not generate the print view.",
      });
    }
  }

  return (
    <Stack gap={6}>
      <Box
        borderWidth="1px"
        borderColor="roseGold"
        borderRadius="md"
        overflow="hidden"
        bg="cream"
        position="relative"
      >
        <Flex direction={{ base: "column", md: "row" }} align="stretch">
          <Box
            w={{ base: "100%", md: "210px" }}
            h={{ base: "240px", md: "auto" }}
            flexShrink={0}
            bg="burgundy"
          >
            <Image
              src="/invitation.jpg"
              alt="Adeola & Joshua save the date"
              w="100%"
              h="100%"
              objectFit="cover"
            />
          </Box>

          <Flex
            flex="1"
            direction="column"
            align="center"
            justify="center"
            textAlign="center"
            gap={1}
            px={5}
            py={6}
          >
            <Text textStyle="accent" color="roseWine">
              Adeola & Joshua
            </Text>
            <Heading fontFamily="subheading" color="burgundy" fontSize="3xl" lineHeight="1">
              Hall Pass
            </Heading>
            <Text color={isInvalidated ? "red.600" : "deepBrown"} fontSize="xs" fontWeight="700" letterSpacing="wide">
              {formatTicketNumber(selectedPass.pass.ticket_number).toUpperCase()} ·{" "}
              {(isInvalidated ? "Invalidated" : selectedPass.pass.used_at ? "Used" : "Ready").toUpperCase()}
            </Text>
            <Box w="70px" h="1px" bg="roseGold" my={2} />
            <Text fontFamily="subheading" fontWeight="700" fontSize="2xl" color="textPrimary" lineClamp={1}>
              {selectedPass.pass.guest_name ?? "Guest"}
            </Text>
            <Text fontStyle="italic" color="textSecondary" fontSize="sm">
              Saturday 1st August 2026
            </Text>
            <Text mt={2} fontFamily="mono" color="deepBrown" fontSize="sm" fontWeight="700" letterSpacing="wider">
              {selectedPass.pass.token}
            </Text>
            <Text color="textSecondary" fontSize="xs">
              Present this code at entry.
            </Text>
          </Flex>

          <Flex
            direction="column"
            align="center"
            justify="center"
            gap={2}
            px={5}
            py={6}
            borderTopWidth={{ base: "1px", md: "0" }}
            borderLeftWidth={{ base: "0", md: "1px" }}
            borderColor="gray.200"
          >
            <Image src={selectedPass.qrDataUrl} alt="Generated hall pass QR code" boxSize="150px" />
            <Text color="textSecondary" fontSize="2xs" fontWeight="700" letterSpacing="widest">
              SCAN TO VERIFY
            </Text>
          </Flex>
        </Flex>
      </Box>

      <Stack gap={2}>
        <Badge colorPalette={isInvalidated ? "red" : selectedPass.pass.used_at ? "gray" : "green"} alignSelf="start">
          {isInvalidated ? "Invalidated" : selectedPass.pass.used_at ? "Used" : "Ready"}
        </Badge>
        <Text fontWeight="700">QR Token</Text>
        <Text wordBreak="break-all" color="gray.700" fontSize="sm">
          {selectedPass.qrValue}
        </Text>
        <Text fontWeight="700" mt={3}>
          Ticket Number
        </Text>
        <Text color="gray.700" fontSize="sm">
          {formatTicketNumber(selectedPass.pass.ticket_number)}
        </Text>
        <Text fontWeight="700" mt={3}>
          Email Delivery
        </Text>
        <Flex align="center" gap={2} wrap="wrap">
          <Badge colorPalette={getEmailStatus(selectedPass.pass).color}>{getEmailStatus(selectedPass.pass).label}</Badge>
          {selectedPass.pass.email_recipient ? (
            <Text color="gray.700" fontSize="sm">
              {selectedPass.pass.email_recipient}
            </Text>
          ) : null}
        </Flex>
        {selectedPass.pass.email_sent_at ? (
          <Text color="gray.600" fontSize="sm">
            Sent {formatDateTime(selectedPass.pass.email_sent_at)}
          </Text>
        ) : null}
        {selectedPass.pass.email_error ? (
          <Text color="red.700" fontSize="sm">
            {selectedPass.pass.email_error}
          </Text>
        ) : null}
        {selectedPass.pass.invalidated_at ? (
          <>
            <Text fontWeight="700" mt={3}>
              Invalidated
            </Text>
            <Text color="gray.700" fontSize="sm">
              {formatDateTime(selectedPass.pass.invalidated_at)} by {selectedPass.pass.invalidated_by ?? "admin"}
            </Text>
          </>
        ) : null}
        <Flex gap={3} wrap="wrap" mt={4}>
          <Button size="sm" bg="burgundy" color="white" onClick={() => void handleDownload()}>
            <Download size={16} />
            Download PNG
          </Button>
          <Button size="sm" variant="outline" onClick={() => void handlePrint()}>
            <Printer size={16} />
            Print
          </Button>
          <Button size="sm" variant="outline" onClick={() => onEmailPass(selectedPass.pass)}>
            <Mail size={16} />
            Email PDF
          </Button>
        </Flex>
      </Stack>
    </Stack>
  );
}

export function PassDashboard({
  initialPasses,
  initialTicketAvailability,
}: {
  initialPasses: HallPass[];
  initialTicketAvailability: TicketAvailability;
}) {
  const [guestName, setGuestName] = useState("");
  const [bulkGuestNames, setBulkGuestNames] = useState("");
  const [bulkPassCount, setBulkPassCount] = useState("5");
  const [generationMode, setGenerationMode] = useState<GenerationMode>("single");
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("generate");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailMessage, setEmailMessage] = useState(
    "Please find the attached hall pass ticket PDF. Present the QR code at entry.",
  );
  const [inviteFrom, setInviteFrom] = useState("");
  const [ticketLimitInput, setTicketLimitInput] = useState(
    initialTicketAvailability.ticket_limit?.toString() ?? "",
  );
  const [passes, setPasses] = useState(initialPasses);
  const [ticketAvailability, setTicketAvailability] = useState(initialTicketAvailability);
  const [selectedPass, setSelectedPass] = useState<GeneratedPass | null>(null);
  const [passToInvalidate, setPassToInvalidate] = useState<HallPass | null>(null);
  const [passToEmail, setPassToEmail] = useState<HallPass | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [resendMessage, setResendMessage] = useState(
    "Please find the attached hall pass ticket PDF. Present the QR code at entry.",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [passListTab, setPassListTab] = useState<PassListTab>("active");
  const [isEditingTicketLimit, setIsEditingTicketLimit] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInvalidating, setIsInvalidating] = useState(false);
  const [isInvalidatingAll, setIsInvalidatingAll] = useState(false);
  const [showInvalidateAllModal, setShowInvalidateAllModal] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [isSavingTicketLimit, setIsSavingTicketLimit] = useState(false);

  const isTicketLimitReached = ticketAvailability.remaining_count === 0;
  const parsedBulkGuestNames = parseBulkGuestNames(bulkGuestNames);
  const parsedBulkPassCount = Number(bulkPassCount);
  const bulkPassCountValue =
    Number.isInteger(parsedBulkPassCount) && parsedBulkPassCount > 0 ? parsedBulkPassCount : 0;
  const requestedPassCount =
    generationMode === "bulk" ? Math.max(bulkPassCountValue, parsedBulkGuestNames.length) : 1;
  const isInvalidBulkCount = generationMode === "bulk" && requestedPassCount === 0;
  const isOverBatchLimit = generationMode === "bulk" && requestedPassCount > MAX_BATCH_SIZE;
  const isOverTicketLimit =
    ticketAvailability.remaining_count !== null && requestedPassCount > ticketAvailability.remaining_count;
  const shouldEmailPasses = deliveryMode === "email";
  const isMissingInviteFrom = !inviteFrom.trim();
  const isInvalidRecipientEmail = shouldEmailPasses && !isLikelyEmail(recipientEmail);
  const canSubmit =
    !isSubmitting &&
    !isTicketLimitReached &&
    !isInvalidBulkCount &&
    !isOverBatchLimit &&
    !isOverTicketLimit &&
    !isMissingInviteFrom &&
    !isInvalidRecipientEmail &&
    (generationMode === "single" || requestedPassCount > 0);

  async function handleCreatePass() {
    setError("");
    setSelectedPass(null);
    setIsSubmitting(true);

    if (generationMode === "bulk" && requestedPassCount === 0) {
      setIsSubmitting(false);
      setError("Enter how many passes to generate.");
      return;
    }

    if (isOverBatchLimit) {
      setIsSubmitting(false);
      setError(`You can generate up to ${MAX_BATCH_SIZE} passes at once.`);
      return;
    }

    if (isOverTicketLimit) {
      setIsSubmitting(false);
      setError("There are not enough tickets left for this batch.");
      return;
    }

    if (isInvalidRecipientEmail) {
      setIsSubmitting(false);
      setError("Enter a valid recipient email address.");
      return;
    }

    if (isMissingInviteFrom) {
      setIsSubmitting(false);
      setError("Select who the invite is from.");
      return;
    }

    const response = await fetch("/api/passes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestName,
        guestNames:
          generationMode === "bulk"
            ? Array.from({ length: requestedPassCount }, (_, index) => parsedBulkGuestNames[index] ?? "")
            : undefined,
        inviteFrom,
        delivery: {
          sendEmail: shouldEmailPasses,
          recipientEmail,
          message: emailMessage,
        },
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      if (response.status === 409) {
        const data = (await response.json()) as {
          error?: string;
          ticketAvailability?: TicketAvailability;
        };

        if (data.ticketAvailability) {
          setTicketAvailability(data.ticketAvailability);
        }

        setError(data.error ?? "Ticket limit reached.");
        return;
      }

      setError("Could not create pass. Please try again.");
      return;
    }

    const data = (await response.json()) as PassResponse;
    const qrDataUrl = await createQrDataUrl(data.qrValue);
    const createdPasses = data.passes ?? [data.pass];

    setSelectedPass({ ...data, qrDataUrl });
    setPasses((current) => [...createdPasses, ...current]);
    setTicketAvailability(data.ticketAvailability);
    setGuestName("");
    setBulkGuestNames("");
    setBulkPassCount("5");
    setGenerationMode("single");
    setDeliveryMode("generate");
    setRecipientEmail("");
    setEmailMessage("Please find the attached hall pass ticket PDF. Present the QR code at entry.");
    setInviteFrom("");
    toaster.create({
      type: data.emailDelivery?.success === false ? "warning" : "success",
      title:
        data.emailDelivery?.success === false
          ? "Generated, but email failed"
          : createdPasses.length === 1
            ? shouldEmailPasses
              ? "Hall pass generated and emailed"
              : "Hall pass generated"
            : shouldEmailPasses
              ? `${createdPasses.length} hall passes generated and emailed`
              : `${createdPasses.length} hall passes generated`,
      description:
        data.emailDelivery?.success === false
          ? data.emailDelivery.error ?? "The pass was created, but Maileroo could not send the email."
          : shouldEmailPasses
            ? `${createdPasses.length} PDF attachment${createdPasses.length === 1 ? "" : "s"} sent to ${recipientEmail}.`
            : createdPasses.length === 1
              ? `${data.pass.token} is ready to view or download.`
              : "The first new pass is shown in the preview. All new passes are in the table.",
    });
  }

  async function handleSaveTicketLimit() {
    setError("");
    setIsSavingTicketLimit(true);

    const trimmedLimit = ticketLimitInput.trim();
    const ticketLimit = trimmedLimit ? Number(trimmedLimit) : null;

    if (ticketLimit !== null && (!Number.isInteger(ticketLimit) || ticketLimit < 0)) {
      setIsSavingTicketLimit(false);
      setError("Ticket limit must be a non-negative whole number.");
      toaster.create({
        type: "error",
        title: "Invalid ticket limit",
        description: "Use a non-negative whole number, or leave it blank.",
      });
      return;
    }

    const response = await fetch("/api/ticket-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketLimit }),
    });

    setIsSavingTicketLimit(false);

    if (!response.ok) {
      setError("Could not update ticket limit.");
      toaster.create({
        type: "error",
        title: "Ticket limit not updated",
        description: "Could not save the new ticket limit.",
      });
      return;
    }

    const data = (await response.json()) as { ticketAvailability: TicketAvailability };
    setTicketAvailability(data.ticketAvailability);
    setTicketLimitInput(data.ticketAvailability.ticket_limit?.toString() ?? "");
    setIsEditingTicketLimit(false);
    toaster.create({
      type: "success",
      title: "Ticket limit updated",
      description:
        data.ticketAvailability.ticket_limit === null
          ? "QR creation is now unlimited."
          : `${data.ticketAvailability.remaining_count} tickets left of ${data.ticketAvailability.ticket_limit}.`,
    });
  }

  async function handleViewPass(pass: HallPass) {
    setError("");
    const qrDataUrl = await createQrDataUrl(pass.token);
    setSelectedPass({
      pass,
      qrValue: pass.token,
      qrDataUrl,
    });
  }

  function openResendEmail(pass: HallPass) {
    setError("");
    setPassToEmail(pass);
    setResendEmail(pass.email_recipient ?? recipientEmail);
    setResendMessage(emailMessage);
  }

  async function handleResendEmail() {
    if (!passToEmail) return;

    if (!isLikelyEmail(resendEmail)) {
      setError("Enter a valid recipient email address.");
      toaster.create({
        type: "error",
        title: "Email not sent",
        description: "Enter a valid recipient email address.",
      });
      return;
    }

    setError("");
    setIsResendingEmail(true);

    const response = await fetch(`/api/passes/${passToEmail.id}/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientEmail: resendEmail,
        message: resendMessage,
      }),
    });
    const data = (await response.json().catch(() => null)) as { pass?: HallPass; error?: string } | null;

    setIsResendingEmail(false);

    if (data?.pass) {
      setPasses((current) => current.map((item) => (item.id === data.pass?.id ? data.pass : item)));

      if (selectedPass?.pass.id === data.pass.id) {
        const qrDataUrl = await createQrDataUrl(data.pass.token);
        setSelectedPass({
          pass: data.pass,
          qrValue: data.pass.token,
          qrDataUrl,
        });
      }
    }

    if (!response.ok) {
      setError(data?.error ?? "Could not resend this ticket email.");
      toaster.create({
        type: "error",
        title: "Email failed",
        description: data?.error ?? "Could not resend this ticket email.",
      });
      return;
    }

    setPassToEmail(null);
    toaster.create({
      type: "success",
      title: "Ticket emailed",
      description: `${formatTicketNumber(data?.pass?.ticket_number)} was sent to ${resendEmail}.`,
    });
  }

  async function handleInvalidatePass() {
    if (!passToInvalidate) return;
    setIsInvalidating(true);

    const response = await fetch(`/api/passes/${passToInvalidate.id}/invalidate`, {
      method: "POST",
    });
    const data = (await response.json().catch(() => null)) as {
      pass?: HallPass;
      ticketAvailability?: TicketAvailability;
      error?: string;
    } | null;

    setIsInvalidating(false);

    if (!response.ok) {
      toaster.create({
        type: "error",
        title: "Invalidation failed",
        description: data?.error ?? "Could not invalidate this QR code.",
      });
      return;
    }

    const pass = data?.pass;
    if (!pass) {
      toaster.create({
        type: "error",
        title: "Invalidation failed",
        description: "Could not invalidate this QR code.",
      });
      return;
    }

    setPasses((current) => current.map((item) => (item.id === pass.id ? pass : item)));

    if (data.ticketAvailability) {
      setTicketAvailability(data.ticketAvailability);
      setTicketLimitInput(data.ticketAvailability.ticket_limit?.toString() ?? "");
    }

    if (selectedPass?.pass.id === pass.id) {
      const qrDataUrl = await createQrDataUrl(pass.token);
      setSelectedPass({
        pass,
        qrValue: pass.token,
        qrDataUrl,
      });
    }

    setPassToInvalidate(null);
    toaster.create({
      type: "success",
      title: "QR code invalidated",
      description: `${pass.token} will now scan as invalid.`,
    });
  }

  async function handleInvalidateAllPasses() {
    // Intentionally a no-op: bulk invalidation is disabled.
    setShowInvalidateAllModal(false);
  }

  function getPassStatus(pass: HallPass) {
    if (pass.invalidated_at) {
      return { label: "Invalidated", color: "red" };
    }

    if (pass.used_at) {
      return { label: "Used", color: "gray" };
    }

    return { label: "Unused", color: "green" };
  }

  const tabPasses = passes.filter((pass) =>
    passListTab === "active" ? !pass.invalidated_at : Boolean(pass.invalidated_at),
  );

  const filteredPasses = tabPasses.filter((pass) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const searchableText = [
      pass.guest_name,
      pass.token,
      pass.ticket_number?.toString(),
      pass.invite_from,
      pass.email_recipient,
      pass.email_status,
      pass.created_by,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesQuery = normalizedQuery ? searchableText.includes(normalizedQuery) : true;
    const matchesStatus =
      passListTab === "invalidated" ||
      statusFilter === "all" ||
      (statusFilter === "used" && Boolean(pass.used_at)) ||
      (statusFilter === "unused" && !pass.used_at);

    return matchesQuery && matchesStatus;
  });

  const invalidatableCount = passes.filter((pass) => !pass.invalidated_at).length;
  const activePassCount = passes.filter((pass) => !pass.invalidated_at).length;
  const invalidatedPassCount = passes.length - activePassCount;

  return (
    <Box>
      <Container maxW="1100px" mx="auto" px={6} py={8}>
        <Flex align="center" justify="space-between" gap={4} mb={6}>
          <Box>
            <Text textStyle="accent" color="roseWine">
              Super Admin
            </Text>
            <Heading fontFamily="subheading" color="burgundy" fontSize="3xl">
              Hall Passes
            </Heading>
          </Box>
          <Flex align="center" gap={2} color="green.700">
            <ShieldCheck size={18} />
            <Text fontSize="sm" fontWeight="600">
              Protected
            </Text>
          </Flex>
        </Flex>

        <Flex align="start" gap={6} direction={{ base: "column", lg: "row" }}>
          <Box
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="sm"
            p={6}
            w={{ base: "full", lg: "380px" }}
          >
            <Stack gap={4} onKeyDown={preventEnterSubmit}>
                <Box>
                  <Heading fontFamily="subheading" color="textPrimary" fontSize="2xl">
                    Generate Pass
                  </Heading>
                  <Text color="gray.600" fontSize="sm">
                    Each pass gets a unique QR token.
                  </Text>
                </Box>

                <Box borderWidth="1px" borderColor="gray.200" borderRadius="sm" p={4}>
                  <Text fontWeight="700" color="textPrimary">
                    Tickets
                  </Text>
                  <Text color={isTicketLimitReached ? "red.700" : "gray.700"} fontSize="sm">
                    {ticketAvailability.ticket_limit === null
                      ? `${ticketAvailability.issued_count} issued. No limit set.`
                      : `${ticketAvailability.remaining_count} left of ${ticketAvailability.ticket_limit}.`}
                  </Text>
                </Box>

                <Field.Root>
                  <Field.Label>Generation mode</Field.Label>
                  <SegmentGroup.Root
                    value={generationMode}
                    onValueChange={(details) =>
                      setGenerationMode((details.value ?? "single") as GenerationMode)
                    }
                    w="full"
                  >
                    <SegmentGroup.Indicator />
                    <SegmentGroup.Item value="single" flex="1">
                      <SegmentGroup.ItemText>Single</SegmentGroup.ItemText>
                      <SegmentGroup.ItemHiddenInput />
                    </SegmentGroup.Item>
                    <SegmentGroup.Item value="bulk" flex="1">
                      <SegmentGroup.ItemText>Bulk</SegmentGroup.ItemText>
                      <SegmentGroup.ItemHiddenInput />
                    </SegmentGroup.Item>
                  </SegmentGroup.Root>
                </Field.Root>

                {generationMode === "single" ? (
                  <Field.Root>
                    <Field.Label>Guest name</Field.Label>
                    <Input
                      value={guestName}
                      onChange={(event) => setGuestName(event.target.value)}
                      placeholder="Optional"
                    />
                  </Field.Root>
                ) : (
                  <Stack gap={3}>
                    <Field.Root invalid={isInvalidBulkCount || isOverBatchLimit || isOverTicketLimit}>
                      <Field.Label>Number of passes</Field.Label>
                      <Input
                        type="number"
                        min={1}
                        max={MAX_BATCH_SIZE}
                        step={1}
                        value={bulkPassCount}
                        onChange={(event) => setBulkPassCount(event.target.value)}
                        placeholder="10"
                      />
                      <Field.HelperText>
                        Names are optional. Unnamed passes will show as Guest.
                      </Field.HelperText>
                      {isInvalidBulkCount ? (
                        <Field.ErrorText>Enter at least 1 pass.</Field.ErrorText>
                      ) : null}
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>Guest names</Field.Label>
                      <Textarea
                        value={bulkGuestNames}
                        onChange={(event) => setBulkGuestNames(event.target.value)}
                        placeholder={"Bob, Tola, Sarah"}
                        rows={6}
                      />
                      <Field.HelperText>
                        Optional. Add one name per line, or separate names with commas.
                      </Field.HelperText>
                    </Field.Root>

                    <Flex
                      align="center"
                      justify="space-between"
                      gap={3}
                      color={
                        isInvalidBulkCount || isOverBatchLimit || isOverTicketLimit
                          ? "red.700"
                          : "gray.600"
                      }
                      fontSize="sm"
                    >
                      <Flex align="center" gap={2}>
                        <Users size={15} />
                        <Text>
                          {requestedPassCount} of {MAX_BATCH_SIZE} selected
                        </Text>
                      </Flex>
                      {ticketAvailability.remaining_count === null ? (
                        <Text>No ticket limit</Text>
                      ) : (
                        <Text>{ticketAvailability.remaining_count} tickets left</Text>
                      )}
                    </Flex>
                    {isOverBatchLimit ? (
                      <Text color="red.700" fontSize="sm">
                        Split this into batches of {MAX_BATCH_SIZE} or fewer.
                      </Text>
                    ) : null}
                    {isOverTicketLimit ? (
                      <Text color="red.700" fontSize="sm">
                        Reduce the count or increase the ticket limit before generating.
                      </Text>
                    ) : null}
                  </Stack>
                )}

                <Field.Root invalid={isMissingInviteFrom}>
                  <Field.Label>Invite from</Field.Label>
                  <Select.Root
                    collection={inviteFromOptions}
                    value={inviteFrom ? [inviteFrom] : []}
                    onValueChange={(details) => setInviteFrom(details.value[0] ?? "")}
                  >
                    <Select.HiddenSelect required />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder="Select stakeholder" />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          {inviteFromOptions.items.map((item) => (
                            <Select.Item item={item} key={item.value}>
                              {item.label}
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                  {isMissingInviteFrom ? (
                    <Field.ErrorText>Select who the invite is from.</Field.ErrorText>
                  ) : null}
                </Field.Root>

                <Box borderWidth="1px" borderColor="gray.200" borderRadius="sm" p={4}>
                  <Stack gap={3}>
                    <Field.Root>
                      <Field.Label>Delivery</Field.Label>
                      <SegmentGroup.Root
                        value={deliveryMode}
                        onValueChange={(details) =>
                          setDeliveryMode((details.value ?? "generate") as DeliveryMode)
                        }
                        w="full"
                      >
                        <SegmentGroup.Indicator />
                        <SegmentGroup.Item value="generate" flex="1">
                          <SegmentGroup.ItemText>Generate only</SegmentGroup.ItemText>
                          <SegmentGroup.ItemHiddenInput />
                        </SegmentGroup.Item>
                        <SegmentGroup.Item value="email" flex="1">
                          <SegmentGroup.ItemText>Email PDF</SegmentGroup.ItemText>
                          <SegmentGroup.ItemHiddenInput />
                        </SegmentGroup.Item>
                      </SegmentGroup.Root>
                    </Field.Root>

                    {shouldEmailPasses ? (
                      <>
                        <Field.Root invalid={isInvalidRecipientEmail}>
                          <Field.Label>
                            {generationMode === "bulk" ? "Packet recipient email" : "Recipient email"}
                          </Field.Label>
                          <Input
                            type="email"
                            value={recipientEmail}
                            onChange={(event) => setRecipientEmail(event.target.value)}
                            placeholder="name@example.com"
                          />
                          <Field.HelperText>
                            {generationMode === "bulk"
                              ? "All generated tickets will be sent to this address as PDF attachments."
                              : "The ticket will be sent to this address as a PDF attachment."}
                          </Field.HelperText>
                          {isInvalidRecipientEmail ? (
                            <Field.ErrorText>Enter a valid email address.</Field.ErrorText>
                          ) : null}
                        </Field.Root>

                        <Field.Root>
                          <Field.Label>Email message</Field.Label>
                          <Textarea
                            value={emailMessage}
                            onChange={(event) => setEmailMessage(event.target.value)}
                            rows={4}
                          />
                        </Field.Root>
                      </>
                    ) : (
                      <Flex align="center" gap={2} color="gray.600" fontSize="sm">
                        <Mail size={16} />
                        <Text>Passes will be created without sending email.</Text>
                      </Flex>
                    )}
                  </Stack>
                </Box>

                {error ? (
                  <Text color="red.600" fontSize="sm">
                    {error}
                  </Text>
                ) : null}

                <Button
                  type="button"
                  bg="burgundy"
                  color="white"
                  loading={isSubmitting}
                  disabled={!canSubmit}
                  onClick={() => void handleCreatePass()}
                >
                  <Plus size={18} />
                  {isTicketLimitReached
                    ? "Limit Reached"
                    : generationMode === "bulk"
                      ? requestedPassCount > 0
                        ? shouldEmailPasses
                          ? `Generate & Email ${requestedPassCount} PDFs`
                          : `Generate ${requestedPassCount} QRs`
                        : "Generate QRs"
                      : shouldEmailPasses
                        ? "Generate & Email PDF"
                        : "Generate QR"}
                </Button>
              </Stack>

            <Box mt={6} pt={6} borderTopWidth="1px" borderColor="gray.200">
              <Stack gap={3}>
                <Box>
                  <Heading fontFamily="subheading" color="textPrimary" fontSize="xl">
                    Ticket Limit
                  </Heading>
                  <Text color="gray.600" fontSize="sm">
                    Leave blank for unlimited QR creation.
                  </Text>
                </Box>

                {!isEditingTicketLimit ? (
                  <>
                    <Box borderWidth="1px" borderColor="gray.200" borderRadius="sm" p={4}>
                      <Text fontSize="sm" color="gray.500">
                        Total tickets available
                      </Text>
                      <Text fontWeight="700" fontSize="lg" color="textPrimary">
                        {ticketAvailability.ticket_limit === null
                          ? "Unlimited"
                          : ticketAvailability.ticket_limit}
                      </Text>
                    </Box>
                    <Button
                      type="button"
                      variant="outline"
                      alignSelf="start"
                      onClick={() => {
                        setTicketLimitInput(ticketAvailability.ticket_limit?.toString() ?? "");
                        setIsEditingTicketLimit(true);
                      }}
                    >
                      <Pencil size={16} />
                      Edit
                    </Button>
                  </>
                ) : (
                  <Stack gap={3} onKeyDown={preventEnterSubmit}>
                    <Field.Root>
                      <Field.Label>Total tickets available</Field.Label>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={ticketLimitInput}
                        onChange={(event) => setTicketLimitInput(event.target.value)}
                        placeholder="Unlimited"
                      />
                    </Field.Root>
                    <Flex gap={2}>
                      <Button
                        type="button"
                        variant="outline"
                        loading={isSavingTicketLimit}
                        onClick={() => void handleSaveTicketLimit()}
                      >
                        Save Limit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={isSavingTicketLimit}
                        onClick={() => {
                          setTicketLimitInput(ticketAvailability.ticket_limit?.toString() ?? "");
                          setIsEditingTicketLimit(false);
                        }}
                      >
                        <X size={16} />
                        Cancel
                      </Button>
                    </Flex>
                  </Stack>
                )}
              </Stack>
            </Box>
          </Box>

          <Box
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="sm"
            p={6}
            flex="1"
            w="full"
          >
            <HallPassPreview selectedPass={selectedPass} onEmailPass={openResendEmail} />
          </Box>
        </Flex>

        <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="sm" mt={6}>
          <Stack gap={4} p={5}>
            <Field.Root>
              <Field.Label>Pass list</Field.Label>
              <SegmentGroup.Root
                value={passListTab}
                onValueChange={(details) => setPassListTab((details.value ?? "active") as PassListTab)}
                w={{ base: "full", md: "320px" }}
              >
                <SegmentGroup.Indicator />
                <SegmentGroup.Item value="active" flex="1">
                  <SegmentGroup.ItemText>Active ({activePassCount})</SegmentGroup.ItemText>
                  <SegmentGroup.ItemHiddenInput />
                </SegmentGroup.Item>
                <SegmentGroup.Item value="invalidated" flex="1">
                  <SegmentGroup.ItemText>Invalidated ({invalidatedPassCount})</SegmentGroup.ItemText>
                  <SegmentGroup.ItemHiddenInput />
                </SegmentGroup.Item>
              </SegmentGroup.Root>
            </Field.Root>

            <Flex gap={3} direction={{ base: "column", md: "row" }}>
              <Field.Root flex="1">
                <Field.Label>Search passes</Field.Label>
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Guest, ticket number, token, stakeholder, or creator"
                />
              </Field.Root>

              {passListTab === "active" ? (
                <Field.Root w={{ base: "full", md: "220px" }}>
                  <Field.Label>Status</Field.Label>
                  <Select.Root
                    collection={statusOptions}
                    value={[statusFilter]}
                    onValueChange={(details) => setStatusFilter((details.value[0] ?? "all") as StatusFilter)}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder="All statuses" />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          {statusOptions.items.map((item) => (
                            <Select.Item item={item} key={item.value}>
                              {item.label}
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                </Field.Root>
              ) : null}
            </Flex>

            <Flex align="center" justify="space-between" gap={3} wrap="wrap">
              <Text color="gray.600" fontSize="sm">
                Showing {filteredPasses.length} of {tabPasses.length}{" "}
                {passListTab === "active" ? "active" : "invalidated"} passes.
              </Text>
              {passListTab === "active" ? (
                <Button
                  size="sm"
                  variant="outline"
                  colorPalette="red"
                  disabled
                  title="Bulk invalidation is currently disabled"
                >
                  <Ban size={14} />
                  Invalidate All
                </Button>
              ) : null}
            </Flex>
          </Stack>

          <Box overflowX="auto">
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Guest</Table.ColumnHeader>
                  <Table.ColumnHeader>Ticket</Table.ColumnHeader>
                  <Table.ColumnHeader>Invite From</Table.ColumnHeader>
                  <Table.ColumnHeader>Token</Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                  <Table.ColumnHeader>Email</Table.ColumnHeader>
                  <Table.ColumnHeader>Created</Table.ColumnHeader>
                  <Table.ColumnHeader>Created By</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">Actions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filteredPasses.map((pass) => {
                  const status = getPassStatus(pass);
                  const emailStatus = getEmailStatus(pass);

                  return (
                    <Table.Row key={pass.id}>
                      <Table.Cell>{pass.guest_name ?? "Guest"}</Table.Cell>
                      <Table.Cell fontWeight="700">{formatTicketNumber(pass.ticket_number)}</Table.Cell>
                      <Table.Cell>{pass.invite_from ?? "-"}</Table.Cell>
                      <Table.Cell fontFamily="mono" fontWeight="700">
                        {pass.token}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette={status.color}>{status.label}</Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Stack gap={1}>
                          <Badge colorPalette={emailStatus.color} alignSelf="start">
                            {emailStatus.label}
                          </Badge>
                          {pass.email_recipient ? (
                            <Text color="gray.600" fontSize="xs">
                              {pass.email_recipient}
                            </Text>
                          ) : null}
                        </Stack>
                      </Table.Cell>
                      <Table.Cell>{formatDateTime(pass.created_at)}</Table.Cell>
                      <Table.Cell>{pass.created_by ?? "-"}</Table.Cell>
                      <Table.Cell textAlign="right">
                        <Flex gap={2} justify="end">
                          <Button size="xs" variant="outline" onClick={() => void handleViewPass(pass)}>
                            <Eye size={14} />
                            View
                          </Button>
                          <Button size="xs" variant="outline" onClick={() => openResendEmail(pass)}>
                            <Mail size={14} />
                            Email
                          </Button>
                          {passListTab === "active" ? (
                            <Button
                              size="xs"
                              variant="outline"
                              colorPalette="red"
                              onClick={() => setPassToInvalidate(pass)}
                            >
                              <Ban size={14} />
                              Invalidate
                            </Button>
                          ) : null}
                        </Flex>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          </Box>
        </Box>
      </Container>

      <Dialog.Root
        open={Boolean(passToInvalidate)}
        onOpenChange={(details) => {
          if (!details.open && !isInvalidating) {
            setPassToInvalidate(null);
          }
        }}
        placement="center"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="420px">
              <Dialog.Header>
                <Dialog.Title>Invalidate QR code?</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Stack gap={3}>
                  <Text color="gray.700">
                    This QR code will stop working immediately. Future scans will return invalid.
                  </Text>
                  <Box borderWidth="1px" borderColor="gray.200" borderRadius="sm" p={3}>
                    <Text fontSize="sm" color="gray.500">
                      Token
                    </Text>
                    <Text fontFamily="mono" fontWeight="700">
                      {passToInvalidate?.token}
                    </Text>
                    <Text fontSize="sm" color="gray.500" mt={3}>
                      Guest
                    </Text>
                    <Text fontWeight="700">{passToInvalidate?.guest_name ?? "Guest"}</Text>
                  </Box>
                </Stack>
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant="outline" disabled={isInvalidating} onClick={() => setPassToInvalidate(null)}>
                  Cancel
                </Button>
                <Button colorPalette="red" loading={isInvalidating} onClick={() => void handleInvalidatePass()}>
                  <Ban size={16} />
                  Invalidate
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <Dialog.Root
        open={showInvalidateAllModal}
        onOpenChange={(details) => {
          if (!details.open && !isInvalidatingAll) {
            setShowInvalidateAllModal(false);
          }
        }}
        placement="center"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="460px">
              <Dialog.Header>
                <Dialog.Title>Invalidate all tickets?</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Stack gap={3}>
                  <Text color="gray.700">
                    This will invalidate every active hall pass immediately. All affected QR codes will stop working
                    and future scans will return invalid.
                  </Text>
                  <Box borderWidth="1px" borderColor="red.200" bg="red.50" borderRadius="sm" p={3}>
                    <Text fontSize="sm" color="red.800" fontWeight="700">
                      {invalidatableCount} active pass{invalidatableCount === 1 ? "" : "es"} will be invalidated.
                    </Text>
                    <Text fontSize="sm" color="red.700" mt={2}>
                      Already invalidated passes will not be changed.
                    </Text>
                  </Box>
                </Stack>
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="outline"
                  disabled={isInvalidatingAll}
                  onClick={() => setShowInvalidateAllModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  colorPalette="red"
                  loading={isInvalidatingAll}
                  onClick={() => void handleInvalidateAllPasses()}
                >
                  <Ban size={16} />
                  Invalidate All
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <Dialog.Root
        open={Boolean(passToEmail)}
        onOpenChange={(details) => {
          if (!details.open && !isResendingEmail) {
            setPassToEmail(null);
          }
        }}
        placement="center"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="460px">
              <Dialog.Header>
                <Dialog.Title>Email ticket PDF</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Stack gap={4} onKeyDown={preventEnterSubmit}>
                  <Box borderWidth="1px" borderColor="gray.200" borderRadius="sm" p={3}>
                    <Text fontSize="sm" color="gray.500">
                      Ticket
                    </Text>
                    <Text fontWeight="700">{formatTicketNumber(passToEmail?.ticket_number)}</Text>
                    <Text fontSize="sm" color="gray.500" mt={3}>
                      Guest
                    </Text>
                    <Text fontWeight="700">{passToEmail?.guest_name ?? "Guest"}</Text>
                  </Box>

                  <Field.Root invalid={Boolean(resendEmail) && !isLikelyEmail(resendEmail)}>
                    <Field.Label>Recipient email</Field.Label>
                    <Input
                      type="email"
                      value={resendEmail}
                      onChange={(event) => setResendEmail(event.target.value)}
                      placeholder="name@example.com"
                    />
                    {Boolean(resendEmail) && !isLikelyEmail(resendEmail) ? (
                      <Field.ErrorText>Enter a valid email address.</Field.ErrorText>
                    ) : null}
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Email message</Field.Label>
                    <Textarea
                      value={resendMessage}
                      onChange={(event) => setResendMessage(event.target.value)}
                      rows={4}
                    />
                  </Field.Root>
                </Stack>
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant="outline" disabled={isResendingEmail} onClick={() => setPassToEmail(null)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  bg="burgundy"
                  color="white"
                  loading={isResendingEmail}
                  disabled={!isLikelyEmail(resendEmail)}
                  onClick={() => void handleResendEmail()}
                >
                  <Mail size={16} />
                  Send PDF
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  );
}
