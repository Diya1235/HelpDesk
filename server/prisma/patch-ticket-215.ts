import { db } from "../src/db";

const ticket = await db.ticket.update({
  where: { id: 215 },
  data: { category: "GeneralQuestion" },
  select: { id: true, subject: true, status: true, category: true },
});

console.log("Patched:", ticket);
await db.$disconnect();
