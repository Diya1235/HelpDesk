import type { RequestHandler } from "express";

export function requireRole(...roles: string[]): RequestHandler {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const userRole = (req.user as { role?: string }).role;
    if (!roles.includes(userRole ?? "")) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
