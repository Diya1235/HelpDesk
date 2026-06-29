// Sends a test inbound-email webhook and polls until the ticket is resolved or open.
// Run with: bun run --env-file=./.env prisma/fire-webhook.ts

const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3001";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

const payload = {
  from: "Alice Brennan <alice.brennan@gmail.com>",
  subject: "How do I reset my password?",
  text: "Hi, I forgot my password and I'm unable to log in to my account. Could you let me know how I can reset it? Thanks, Alice",
};

console.log("Firing inbound-email webhook...");
const headers: Record<string, string> = { "Content-Type": "application/json" };
if (WEBHOOK_SECRET) headers["x-webhook-secret"] = WEBHOOK_SECRET;

const res = await fetch(`${SERVER_URL}/api/webhooks/inbound-email`, {
  method: "POST",
  headers,
  body: JSON.stringify(payload),
});

if (!res.ok) {
  console.error("Webhook failed:", res.status, await res.text());
  process.exit(1);
}

const { id } = (await res.json()) as { id: number };
console.log(`Ticket created: id=${id} — polling for AI resolution...`);

for (let i = 0; i < 20; i++) {
  await new Promise((r) => setTimeout(r, 2000));
  const t = await fetch(`${SERVER_URL}/api/tickets/${id}`, {
    headers: { Cookie: "" },
  });
  if (t.status === 401 || t.status === 403) {
    console.log(`Ticket ${id}: auth required to check status — check the UI`);
    break;
  }
  if (!t.ok) continue;

  const ticket = (await t.json()) as { status: string };
  console.log(`  [${i * 2}s] status = ${ticket.status}`);

  if (ticket.status === "Resolved" || ticket.status === "Open") {
    console.log(`\nFinal status: ${ticket.status}`);
    break;
  }
}
