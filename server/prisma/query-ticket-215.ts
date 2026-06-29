import { db } from "../src/db";

async function main() {
  const ticket = await db.ticket.findUnique({
    where: { id: 215 },
    select: { id: true, subject: true, category: true, status: true },
  });
  console.log(JSON.stringify(ticket, null, 2));
}

main().finally(() => db.$disconnect());
