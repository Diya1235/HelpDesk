import { Router } from "express";
import { inboundEmailWebhookSchema } from "@helpdesk/core";
import { db } from "../db";
import { boss, CLASSIFY_JOB, type ClassifyTicketData } from "../lib/boss";

const router = Router();

function parseFrom(from: string): { email: string; name: string } {
  const match = from.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    const name = match[1].trim();
    const email = match[2].trim();
    return { name: name || email, email };
  }
  const email = from.trim();
  return { name: email, email };
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// POST /api/webhooks/inbound-email
// Receives inbound email payloads (Resend / SendGrid JSON format) and creates a ticket.
// Protect with WEBHOOK_SECRET env var: set x-webhook-secret header on the provider side.
router.post("/inbound-email", async (req, res) => {
  const webhookSecret = process.env["WEBHOOK_SECRET"];
  if (webhookSecret) {
    const provided = req.headers["x-webhook-secret"];
    if (provided !== webhookSecret) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
  }

  const result = inboundEmailWebhookSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.errors[0].message });
    return;
  }

  const { from, subject, text, html } = result.data;
  const { email: fromEmail, name: fromName } = parseFrom(from);
  const body = text ?? (html ? stripHtml(html) : "");

  const ticket = await db.ticket.create({
    data: {
      subject: subject?.trim() || "(No subject)",
      body,
      bodyHtml: html ?? null,
      fromEmail,
      fromName,
    },
  });

  res.status(201).json({ id: ticket.id });

  await boss.send<ClassifyTicketData>(CLASSIFY_JOB, {
    ticketId: ticket.id,
    subject: ticket.subject,
    body: ticket.body,
  });
});

export default router;
