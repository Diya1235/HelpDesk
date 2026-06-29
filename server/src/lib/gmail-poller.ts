import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import * as Sentry from "@sentry/node";
import { db } from "../db";
import { boss, CLASSIFY_JOB, type ClassifyTicketData } from "./boss";
import { sendTicketCreatedEmail } from "./email";

const POLL_INTERVAL_MS = parseInt(process.env["GMAIL_POLL_INTERVAL_MS"] ?? "30000");

function parseFrom(from: string): { email: string; name: string } {
  const match = from.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
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

async function pollOnce(user: string, password: string): Promise<void> {
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user, pass: password },
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      // Collect UIDs of unseen messages first
      const uids: number[] = [];
      for await (const msg of client.fetch({ seen: false }, { uid: true })) {
        uids.push(msg.uid);
      }

      for (const uid of uids) {
        try {
          // Fetch full source of this message
          const msgData = await client.fetchOne(String(uid), { source: true }, { uid: true });
          if (!msgData || typeof msgData === "boolean") continue;
          const source = (msgData as unknown as Record<string, unknown>)["source"] as Buffer | undefined;
          if (!source) continue;

          const parsed = await simpleParser(source);

          const fromStr = parsed.from?.text ?? "";
          if (!fromStr) continue;

          const { email: fromEmail, name: fromName } = parseFrom(fromStr);

          // Skip self-sent emails to prevent loops
          if (fromEmail.toLowerCase() === user.toLowerCase()) {
            await client.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true });
            continue;
          }

          const subject = parsed.subject?.trim() || "(No subject)";
          const body = parsed.text ?? (parsed.html ? stripHtml(parsed.html) : "");
          const bodyHtml = typeof parsed.html === "string" ? parsed.html : null;

          const ticket = await db.ticket.create({
            data: { subject, body, bodyHtml, fromEmail, fromName },
          });

          // Mark as read only after ticket is safely created
          await client.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true });

          console.log(`[gmail] ticket #${ticket.id} created from ${fromEmail}`);

          sendTicketCreatedEmail(fromEmail, fromName, ticket.id, ticket.subject).catch(() => {});

          await (boss.send as (name: string, data: ClassifyTicketData) => Promise<unknown>)(CLASSIFY_JOB, {
            ticketId: ticket.id,
            subject: ticket.subject,
            body: ticket.body,
          });
        } catch (err) {
          console.error(`[gmail] failed to process uid ${uid}:`, err);
          Sentry.captureException(err);
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (err) {
    console.error("[gmail] poll failed:", err);
    Sentry.captureException(err);
    try {
      await client.logout();
    } catch {}
  }
}

export function startGmailPoller(): void {
  const user = process.env["GMAIL_USER"];
  const password = process.env["GMAIL_APP_PASSWORD"];

  if (!user || !password) {
    console.log("[gmail] GMAIL_USER / GMAIL_APP_PASSWORD not set — polling disabled");
    return;
  }

  const run = () => pollOnce(user, password).catch(() => {});

  // First poll immediately on startup, then on interval
  run();
  setInterval(run, POLL_INTERVAL_MS);

  console.log(`[gmail] polling ${user} every ${POLL_INTERVAL_MS / 1000}s`);
}
