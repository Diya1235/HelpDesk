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

// Separate instance without disableSignUp so we can create the user
const seedAuth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
});

// Fixed credentials for the test agent — used by E2E tests in e2e/auth.spec.ts.
const AGENT_EMAIL = "agent@example.com";
const AGENT_PASSWORD = "AgentPassword123!";

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
      body: { email, password, name: "Admin" },
    });

    await db.user.update({
      where: { id: result.user.id },
      data: { role: Role.admin },
    });

    console.log(`Admin user created: ${email} (role: admin)`);
  }

  // --- Test agent user ---
  // Role defaults to "agent" via the Prisma schema (@default(agent)), so no
  // explicit role update is needed here.
  const existingAgent = await db.user.findUnique({ where: { email: AGENT_EMAIL } });
  if (existingAgent) {
    console.log(`Test agent user already exists (${AGENT_EMAIL}), skipping.`);
  } else {
    await seedAuth.api.signUpEmail({
      body: { email: AGENT_EMAIL, password: AGENT_PASSWORD, name: "Test Agent" },
    });
    console.log(`Test agent user created: ${AGENT_EMAIL} (role: agent)`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
