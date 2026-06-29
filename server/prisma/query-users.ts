import { db } from "../src/db";

async function main() {
  const users = await db.user.findMany({ select: { id: true, name: true, role: true } });
  console.log(JSON.stringify(users, null, 2));
}

main().finally(() => db.$disconnect());
