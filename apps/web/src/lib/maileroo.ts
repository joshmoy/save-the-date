import "server-only";

type EmailAddress = {
  address: string;
  display_name?: string;
};

type EmailAttachment = {
  file_name: string;
  content_type: string;
  content: string;
  inline?: boolean;
};

type SendEmailInput = {
  to: EmailAddress;
  subject: string;
  plain: string;
  html: string;
  attachments: EmailAttachment[];
};

function getMailerooConfig() {
  const apiKey = process.env.MAILEROO_API_KEY;
  const fromEmail = process.env.MAILEROO_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    throw new Error("Missing MAILEROO_API_KEY or MAILEROO_FROM_EMAIL.");
  }

  return {
    apiKey,
    from: {
      address: fromEmail,
      display_name: process.env.MAILEROO_FROM_NAME || "Adeola & Joshua",
    },
  };
}

export function isLikelyEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export async function sendMailerooEmail(input: SendEmailInput) {
  const config = getMailerooConfig();
  const response = await fetch("https://smtp.maileroo.com/api/v2/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      from: config.from,
      to: input.to,
      subject: input.subject,
      plain: input.plain,
      html: input.html,
      tracking: false,
      attachments: input.attachments,
    }),
  });

  const data = (await response.json().catch(() => null)) as { success?: boolean; message?: string } | null;

  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || `Maileroo request failed with status ${response.status}.`);
  }

  return data;
}
