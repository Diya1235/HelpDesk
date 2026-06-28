---
name: seeded-users
description: Credentials for test users that are guaranteed to exist in the test DB after global-setup runs
metadata:
  type: project
---

Both users are created by `server/prisma/seed.ts` which is called from `e2e/global-setup.ts` via `bun run db:seed:test`.

| Role | Email | Password | How role is set |
|------|-------|----------|----------------|
| admin | admin@example.com | TestPassword123! | Explicitly via `db.user.update({ role: Role.admin })` after sign-up |
| agent | agent@example.com | AgentPassword123! | Prisma schema `@default(agent)` — no explicit update needed |

**Why:** The main auth has `disableSignUp: true`, so the seed uses a separate `seedAuth` instance (with signup enabled) to create users. See [[agent-user-creation]].

**How to apply:** Use these credentials directly in `loginAs()` helper calls. No `beforeEach` setup required for auth tests; these users always exist.
