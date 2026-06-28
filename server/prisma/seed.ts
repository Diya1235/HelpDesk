import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "../src/db";
import { Role } from "../src/generated/prisma";

const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
const password = process.env.SEED_ADMIN_PASSWORD;
if (!password) {
  console.error("FATAL: SEED_ADMIN_PASSWORD environment variable is required");
  process.exit(1);
}
const safePassword = password as string;

// Separate instance without disableSignUp so we can create the user
const seedAuth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
});

const AGENTS = [
  { email: "agent@example.com", password: "AgentPassword123!", name: "Test Agent" },
  { email: "sara.jones@example.com", password: "AgentPassword123!", name: "Sara Jones" },
];

async function main() {
  // --- Admin user ---
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== Role.admin) {
      await db.user.update({ where: { email }, data: { role: Role.admin } });
      console.log(`Updated ${email} role to admin.`);
    } else {
      console.log(`Admin user already exists (${email}), skipping.`);
    }
  } else {
    const result = await seedAuth.api.signUpEmail({
      body: { email, password: safePassword, name: "Admin" },
    });

    await db.user.update({
      where: { id: result.user.id },
      data: { role: Role.admin },
    });

    console.log(`Admin user created: ${email} (role: admin)`);
  }

  // --- Agent users ---
  for (const agent of AGENTS) {
    const existing = await db.user.findUnique({ where: { email: agent.email } });
    if (existing) {
      console.log(`Agent already exists (${agent.email}), skipping.`);
    } else {
      await seedAuth.api.signUpEmail({ body: agent });
      console.log(`Agent created: ${agent.email}`);
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
