import type { ErrorRequestHandler } from "express";
import { Prisma } from "../generated/prisma";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2025"
  ) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};
