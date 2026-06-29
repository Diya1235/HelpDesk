import { db } from "../src/db";

const replies = await db.reply.findMany({
  where: { ticketId: { in: [334, 335, 336, 337, 338] } },
  include: { author: { select: { name: true } }, ticket: { select: { subject: true } } },
  orderBy: { id: "asc" },
});

for (const r of replies) {
  console.log(`\nTicket: ${r.ticket.subject}`);
  console.log(`Author: ${r.author.name}`);
  console.log("---");
  console.log(r.body);
  console.log("===");
}

await db.$disconnect();
