import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { db } from "./db";
import { auth } from "./lib/auth";
import { requireAuth } from "./middleware/requireAuth";

const app = express();
const PORT = process.env["PORT"] ?? 3001;

app.use(cors({ origin: "http://localhost:5174" }));
app.use(express.json());

app.all("/api/auth/*splat", toNodeHandler(auth));

app.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user, session: req.session });
});

app.get("/health", async (_req, res) => {
  try {
    await db.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch {
    res.status(503).json({ status: "error", db: "disconnected" });
  }
});

app.listen(PORT, async () => {
  await db.$connect();
  console.log(`Server running on http://localhost:${PORT}`);
});
