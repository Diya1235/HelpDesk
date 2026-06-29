// Creates 10 tickets whose questions match the knowledge base,
// runs them through the full AI pipeline, and waits for resolution.
// Run: bun run --env-file=./.env prisma/seed-auto-resolved.ts

import { db } from "../src/db";
import { boss, CLASSIFY_JOB, startBoss, type ClassifyTicketData } from "../src/lib/boss";

const TICKETS = [
  {
    fromName: "James Harrington",
    fromEmail: "james.h@gmail.com",
    subject: "Forgot my password — how do I reset it?",
    body: "Hi, I can't log in because I've forgotten my password. What's the process to reset it? I didn't see a clear option on the login screen.",
  },
  {
    fromName: "Sofia Mendez",
    fromEmail: "sofia.mendez@outlook.com",
    subject: "Can I get a refund?",
    body: "I purchased a plan 2 weeks ago and I'd like to request a refund. What is your refund policy and how long does it take to process?",
  },
  {
    fromName: "Tom Nguyen",
    fromEmail: "tom.nguyen@yahoo.com",
    subject: "When is your support team available?",
    body: "I keep missing your support window. What are your business hours? Is there any weekend support available?",
  },
  {
    fromName: "Priya Kapoor",
    fromEmail: "priya.k@business.com",
    subject: "Need to change my account email address",
    body: "I recently changed my personal email and need to update the one associated with my account. How do I go about changing my account email?",
  },
  {
    fromName: "Lucas Ferreira",
    fromEmail: "lucas.f@protonmail.com",
    subject: "How do I cancel my subscription?",
    body: "I'd like to cancel my subscription. Will I still have access until the end of my billing period? And will I be charged again after cancelling?",
  },
  {
    fromName: "Hannah Brooks",
    fromEmail: "h.brooks@company.io",
    subject: "Where can I download my invoices?",
    body: "Our finance team needs copies of all our invoices for this year. Where do I find and download them from my account?",
  },
  {
    fromName: "Ethan Clarke",
    fromEmail: "ethan.c@gmail.com",
    subject: "Password reset link not working",
    body: "I requested a password reset but when I click the link in the email it doesn't seem to do anything. Can you explain the reset steps again?",
  },
  {
    fromName: "Amelia Watson",
    fromEmail: "amelia.watson@hotmail.com",
    subject: "Refund request — charged after cancelling",
    body: "I cancelled my subscription last month but was still billed. Your refund policy says 30 days — I'm well within that. How do I submit a refund request?",
  },
  {
    fromName: "Daniel Park",
    fromEmail: "d.park@startup.co",
    subject: "What hours can I contact support?",
    body: "I'm based in a different timezone and want to know your exact support hours so I can reach out at the right time.",
  },
  {
    fromName: "Isabella Rossi",
    fromEmail: "isabella.rossi@gmail.com",
    subject: "Invoice download — can't find it in settings",
    body: "I need to download a receipt for a purchase I made last month for expense reporting. I looked in Settings but couldn't find an invoices section. Help?",
  },
];

console.log("Starting boss...");
await startBoss();

const ids: number[] = [];

for (const t of TICKETS) {
  const ticket = await db.ticket.create({
    data: {
      subject: t.subject,
      body: t.body,
      fromEmail: t.fromEmail,
      fromName: t.fromName,
    },
  });
  await boss.send<ClassifyTicketData>(CLASSIFY_JOB, {
    ticketId: ticket.id,
    subject: ticket.subject,
    body: ticket.body,
  });
  ids.push(ticket.id);
  console.log(`  queued ticket #${ticket.id}: ${t.subject}`);
}

console.log(`\nWaiting for AI pipeline (${ids.length} tickets)...`);

const done = new Set<number>();
for (let i = 0; i < 45 && done.size < ids.length; i++) {
  await new Promise((r) => setTimeout(r, 2000));
  const rows = await db.ticket.findMany({
    where: { id: { in: ids }, status: { in: ["Resolved", "Open"] } },
    select: { id: true, status: true, category: true },
  });
  for (const row of rows) {
    if (!done.has(row.id)) {
      done.add(row.id);
      console.log(`  #${row.id}  ${row.status}  [${row.category}]`);
    }
  }
}

const remaining = ids.filter((id) => !done.has(id));
if (remaining.length) {
  console.log(`\nTimed out — still processing: ${remaining.join(", ")}`);
} else {
  console.log(`\nAll ${ids.length} tickets resolved.`);
}

await boss.stop();
await db.$disconnect();
