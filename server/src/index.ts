import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env["SENTRY_DSN"],
  environment: process.env["NODE_ENV"] ?? "development",
  enabled: !!process.env["SENTRY_DSN"],
});

import express from "express";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import { toNodeHandler } from "better-auth/node";
import { db } from "./db";
import { auth } from "./lib/auth";
import { requireAuth } from "./middleware/requireAuth";
import { errorHandler } from "./middleware/errorHandler";
import usersRouter from "./routes/users";
import ticketsRouter from "./routes/tickets";
import webhooksRouter from "./routes/webhooks";
import { startBoss } from "./lib/boss";

const REQUIRED_ENV = ["BETTER_AUTH_SECRET", "BETTER_AUTH_URL", "DATABASE_URL"];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}
const secret = process.env["BETTER_AUTH_SECRET"]!;
if (secret.length < 32) {
  console.error("FATAL: BETTER_AUTH_SECRET must be at least 32 characters long");
  process.exit(1);
}

const app = express();
const PORT = process.env["PORT"] ?? 3001;

if (process.env["NODE_ENV"] === "production") {
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    })
  );
}
app.get('/debug-sentry',(req,res)=>{
  throw new Error('failed');

});
const allowedOrigins: (string | RegExp)[] = [
  /^http:\/\/localhost(:\d+)?$/,
];
if (process.env["FRONTEND_URL"]) {
  allowedOrigins.push(process.env["FRONTEND_URL"]);
}

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Normalize sign-in errors to prevent user enumeration (attacker cannot
// distinguish "email not found" from "wrong password").
app.use("/api/auth/sign-in/email", (_req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function (body: unknown) {
    if (res.statusCode >= 400) {
      return originalJson({ error: "Invalid email or password" });
    }
    return originalJson(body);
  };
  next();
});

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use("/api/webhooks", webhooksRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/users", usersRouter);

app.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user, session: req.session });
});

app.get("/api/health", async (_req, res) => {
  try {
    await db.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch {
    res.status(503).json({ status: "error", db: "disconnected" });
  }
});

Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

app.listen(PORT, async () => {
  await db.$connect();
  await startBoss();
  console.log(`Server running on http://localhost:${PORT}`);
});
