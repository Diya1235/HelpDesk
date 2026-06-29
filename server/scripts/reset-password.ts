/**
 * Usage: npx tsx scripts/reset-password.ts <email> <new-password>
 * Example: npx tsx scripts/reset-password.ts admin@example.com myNewPassword123
 */
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const [email, newPassword] = process.argv.slice(2);

  if (!email || !newPassword) {
    console.error("Usage: npx tsx scripts/reset-password.ts <email> <new-password>");
    process.exit(1);
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  const hashed = await hashPassword(newPassword);

  const updated = await db.account.updateMany({
    where: { userId: user.id, providerId: "credential" },
    data: { password: hashed },
  });

  if (updated.count === 0) {
    console.error("No credential account found for that user.");
    process.exit(1);
  }

  console.log(`Password reset successfully for ${email}`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
