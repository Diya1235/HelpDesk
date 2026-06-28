import { Router } from "express";
import { db } from "../db";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.use(requireAuth);

router.get("/", async (_req, res) => {
  const tickets = await db.ticket.findMany({
    orderBy: { createdAt: "desc" },
    include: { assignee: { select: { id: true, name: true } } },
  });
  res.json(tickets);
});

export default router;
