---
name: agent-user-creation
description: Why signup is disabled in prod auth and how test agent users must be created
metadata:
  type: project
---

## The problem

`server/src/lib/auth.ts` configures Better Auth with `emailAndPassword: { enabled: true, disableSignUp: true }`.

This means the public `POST /api/auth/sign-up/email` endpoint is disabled. There is currently no admin API endpoint for creating users either (the `/users` page is a stub with no backend route yet).

## The solution (current)

The seed script (`server/prisma/seed.ts`) uses a **separate** `seedAuth` instance that has signup enabled:
```ts
const seedAuth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },  // no disableSignUp
});
```

This instance is used server-side (not via HTTP) to create users in the test DB.

The agent user is seeded with known fixed credentials:
- Email: `agent@example.com`
- Password: `AgentPassword123!`
- Role: defaults to `agent` via Prisma schema `@default(agent)` — no explicit update in the seed

## Future consideration

When the admin user-management API (`POST /api/admin/users`) is implemented, E2E tests for user CRUD should switch to creating users via that endpoint in `test.beforeEach` rather than relying on the seed. See [[seeded-users]].

**Why:** Keeping test data creation in beforeEach/afterEach makes each test truly independent and avoids accumulating stale seed data over time.
