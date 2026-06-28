import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "../db";

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, disableSignUp: true },
  trustedOrigins: [process.env["FRONTEND_URL"] ?? "http://localhost:5173"],
  rateLimit: {
    enabled: process.env["NODE_ENV"] === "production",
    window: 60,
    max: 10,
  },
  session: {
    expiresIn: 60 * 60 * 8,
    updateAge: 60 * 60 * 1,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  advanced: {
    defaultCookieAttributes: {
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax",
      httpOnly: true,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "agent",
        input: false,
      },
    },
  },
});
