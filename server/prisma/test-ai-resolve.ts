// Self-contained test for the AI auto-resolve pipeline.
// Creates a ticket directly in the DB, runs the boss worker in-process,
// and polls the DB to watch New → Processing → Resolved/Open.
//
// Run with:  bun run --env-file=./.env prisma/test-ai-resolve.ts

import { db } from "../src/db";
import { boss, CLASSIFY_JOB, startBoss, type ClassifyTicketData } from "../src/lib/boss";

const SUBJECT = "How do I reset my password?";
const BODY =
  "Hi, I forgot my password and I'm locked out of my account. " +
  "Could you please let me know the steps to reset it? Thanks, Alice";

// --- 1. Create ticket ---
const ticket = await db.ticket.create({
  data: {
    subject: SUBJECT,
    body: BODY,
    fromEmail: "alice.brennan@example.com",
    fromName: "Alice Brennan",
  },
});

console.log(`\nTicket created  id=${ticket.id}  status=${ticket.status}`);

// --- 2. Start boss worker ---
await startBoss();

// --- 3. Enqueue the classify job ---
await boss.send<ClassifyTicketData>(CLASSIFY_JOB, {
  ticketId: ticket.id,
  subject: SUBJECT,
  body: BODY,
});

console.log("Job enqueued — waiting for AI pipeline...\n");

// --- 4. Poll DB until terminal state ---
let final = ticket.status as string;
for (let i = 0; i < 30; i++) {
  await new Promise((r) => setTimeout(r, 2000));
  const t = await db.ticket.findUnique({ where: { id: ticket.id } });
  const status = t?.status ?? "?";
  const category = t?.category ?? "—";
  console.log(`  ${String(i * 2).padStart(2)}s  status=${status.padEnd(12)} category=${category}`);
  if (status === "Resolved" || status === "Open") {
    final = status;
    break;
  }
}

console.log(`\nResult: ticket ${ticket.id} ended as "${final}"`);
if (final === "Resolved") {
  console.log("Knowledge base match — ticket auto-resolved.");
} else if (final === "Open") {
  console.log("No KB match — ticket queued for an agent.");
} else {
  console.log("Timed out before reaching a terminal state.");
}

await boss.stop();
await db.$disconnect();
