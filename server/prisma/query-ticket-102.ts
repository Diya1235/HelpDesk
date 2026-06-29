import { db } from "../src/db";

async function main() {
  const ticket = await db.ticket.findUnique({
    where: { id: 102 },
    select: { id: true, subject: true, fromName: true, fromEmail: true, status: true, category: true },
  });
  console.log(JSON.stringify(ticket, null, 2));
}

main().finally(() => db.$disconnect());
