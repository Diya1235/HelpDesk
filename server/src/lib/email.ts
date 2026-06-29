import sgMail from "@sendgrid/mail";
import * as Sentry from "@sentry/node";

const apiKey = process.env["SENDGRID_API_KEY"];
const from = process.env["EMAIL_FROM"];

if (apiKey) {
  sgMail.setApiKey(apiKey);
}

function isConfigured(): boolean {
  return !!apiKey && !!from;
}

async function send(msg: sgMail.MailDataRequired): Promise<void> {
  if (!isConfigured()) {
    console.warn("[email] SendGrid not configured — skipping");
    return;
  }
  try {
    await sgMail.send(msg);
  } catch (err) {
    console.error("[email] Failed to send email to", (msg as { to: string }).to, err);
    Sentry.captureException(err);
  }
}

export async function sendTicketCreatedEmail(
  to: string,
  name: string,
  ticketId: number,
  subject: string,
): Promise<void> {
  const firstName = name.split(" ")[0];
  await send({
    to,
    from: from!,
    subject: `We received your request: ${subject}`,
    text: [
      `Hi ${firstName},`,
      ``,
      `Thanks for reaching out. We've created support ticket #${ticketId} for you.`,
      ``,
      `Subject: ${subject}`,
      ``,
      `We'll get back to you as soon as possible.`,
      ``,
      `Best regards,`,
      `Support Team`,
    ].join("\n"),
    html: `<p>Hi ${firstName},</p>
<p>Thanks for reaching out. We've created support ticket <strong>#${ticketId}</strong> for you.</p>
<p><strong>Subject:</strong> ${subject}</p>
<p>We'll get back to you as soon as possible.</p>
<p>Best regards,<br>Support Team</p>`,
  });
}

export async function sendTicketStatusUpdateEmail(
  to: string,
  name: string,
  ticketId: number,
  subject: string,
  status: string,
): Promise<void> {
  const firstName = name.split(" ")[0];
  const statusLabel = status.toLowerCase();
  await send({
    to,
    from: from!,
    subject: `Your ticket #${ticketId} has been ${statusLabel}`,
    text: [
      `Hi ${firstName},`,
      ``,
      `Your support ticket #${ticketId} ("${subject}") has been ${statusLabel}.`,
      ``,
      `If you have further questions, feel free to reply to this email.`,
      ``,
      `Best regards,`,
      `Support Team`,
    ].join("\n"),
    html: `<p>Hi ${firstName},</p>
<p>Your support ticket <strong>#${ticketId}</strong> (<em>${subject}</em>) has been <strong>${statusLabel}</strong>.</p>
<p>If you have further questions, feel free to reply to this email.</p>
<p>Best regards,<br>Support Team</p>`,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetLink: string,
): Promise<void> {
  const firstName = name.split(" ")[0];
  await send({
    to,
    from: from!,
    subject: "Reset your password",
    text: [
      `Hi ${firstName},`,
      ``,
      `We received a request to reset your password. Use the link below:`,
      ``,
      resetLink,
      ``,
      `This link expires in 1 hour. If you didn't request this, you can ignore this email.`,
      ``,
      `Best regards,`,
      `Support Team`,
    ].join("\n"),
    html: `<p>Hi ${firstName},</p>
<p>We received a request to reset your password. Click the link below:</p>
<p><a href="${resetLink}">Reset my password</a></p>
<p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
<p>Best regards,<br>Support Team</p>`,
  });
}

export async function sendNotificationEmail(
  to: string,
  name: string,
  subject: string,
  message: string,
): Promise<void> {
  const firstName = name.split(" ")[0];
  await send({
    to,
    from: from!,
    subject,
    text: [`Hi ${firstName},`, ``, message, ``, `Best regards,`, `Support Team`].join("\n"),
    html: `<p>Hi ${firstName},</p>
<p>${message.replace(/\n/g, "<br>")}</p>
<p>Best regards,<br>Support Team</p>`,
  });
}
