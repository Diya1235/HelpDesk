import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "../src/db";
import { Role } from "../src/generated/prisma";

const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
const password = process.env.SEED_ADMIN_PASSWORD ?? "password123";

// Separate instance without disableSignUp so we can create the user
const seedAuth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
});

async function main() {
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== Role.admin) {
      await db.user.update({ where: { email }, data: { role: Role.admin } });
      console.log(`Updated ${email} role to admin.`);
    } else {
      console.log(`Admin user already exists (${email}), skipping.`);
    }
    return;
  }

  const result = await seedAuth.api.signUpEmail({
    body: { email, password, name: "Admin" },
  });

  await db.user.update({
    where: { id: result.user.id },
    data: { role: Role.admin },
  });

  console.log(`Admin user created: ${email} (role: admin)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
