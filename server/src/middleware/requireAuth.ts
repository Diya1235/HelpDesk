import type { RequestHandler } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";

declare global {
  namespace Express {
    interface Request {
      user: typeof auth.$Infer.Session.user;
      session: typeof auth.$Infer.Session.session;
    }
  }
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  const result = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!result) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.user = result.user;
  req.session = result.session;
  next();
};
