import { Router } from "express";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createUserSchema, updateRoleSchema } from "@helpdesk/core";
import { db } from "../db";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";

// Separate auth instance to allow server-side user creation
// (main instance has disableSignUp: true for public routes)
const createAuth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      role: { type: "string", required: true, defaultValue: "agent", input: false },
    },
  },
});

const router = Router();
router.use(requireAuth, requireRole("admin"));

router.get("/", async (_req, res) => {
  const users = await db.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(users);
});

router.post("/", async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid input" });
    return;
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    res.status(409).json({ error: "A user with that email already exists" });
    return;
  }

  const result = await createAuth.api.signUpEmail({
    body: { name: name.trim(), email: normalizedEmail, password },
  });
  const user = await db.user.findUnique({
    where: { id: result.user.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  res.status(201).json(user);
});

router.patch("/:id/role", async (req, res) => {
  const { id } = req.params;

  const parsed = updateRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid input" });
    return;
  }

  const { role } = parsed.data;
  if (id === req.user.id) {
    res.status(400).json({ error: "Cannot change your own role" });
    return;
  }

  const user = await db.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  res.json(user);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (id === req.user.id) {
    res.status(400).json({ error: "Cannot delete your own account" });
    return;
  }

  await db.user.delete({ where: { id } });
  res.status(204).send();
});

export default router;
