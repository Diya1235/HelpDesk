import { Router } from "express";
import { db } from "../db";
import { requireAuth } from "../middleware/requireAuth";
import { assignTicketSchema, updateTicketSchema, createReplySchema } from "@helpdesk/core";
import { TicketStatus, Category, SenderType, type Prisma } from "../generated/prisma";

const router = Router();

router.use(requireAuth);

const VALID_SORT_FIELDS = [
  "id",
  "subject",
  "fromName",
  "status",
  "category",
  "createdAt",
  "assignee",
] as const;
type SortField = (typeof VALID_SORT_FIELDS)[number];

const VALID_STATUSES = Object.values(TicketStatus);
const VALID_CATEGORIES = Object.values(Category);

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const TICKET_INCLUDE = {
  assignee: { select: { id: true, name: true } },
  replies: {
    orderBy: { createdAt: "asc" as const },
    include: { author: { select: { id: true, name: true, role: true } } },
  },
} satisfies Prisma.TicketInclude;

router.get("/", async (req, res) => {
  // --- sort ---
  const rawSortBy = req.query.sortBy as string | undefined;
  const rawSortOrder = req.query.sortOrder as string | undefined;

  const sortBy: SortField = (VALID_SORT_FIELDS as readonly string[]).includes(
    rawSortBy ?? "",
  )
    ? (rawSortBy as SortField)
    : "createdAt";

  const sortOrder: "asc" | "desc" = rawSortOrder === "asc" ? "asc" : "desc";

  const orderBy =
    sortBy === "assignee"
      ? { assignee: { name: sortOrder } }
      : { [sortBy]: sortOrder };

  // --- filter + search ---
  const where: Prisma.TicketWhereInput = {};

  const rawStatus = req.query.status as string | undefined;
  const rawCategory = req.query.category as string | undefined;
  const rawSearch = (req.query.search as string | undefined)?.trim();

  if (rawStatus && VALID_STATUSES.includes(rawStatus as TicketStatus)) {
    where.status = rawStatus as TicketStatus;
  }
  if (rawCategory && VALID_CATEGORIES.includes(rawCategory as Category)) {
    where.category = rawCategory as Category;
  }
  if (rawSearch) {
    where.OR = [
      { subject: { contains: rawSearch, mode: "insensitive" } },
      { body: { contains: rawSearch, mode: "insensitive" } },
      { fromName: { contains: rawSearch, mode: "insensitive" } },
      { fromEmail: { contains: rawSearch, mode: "insensitive" } },
    ];
  }

  // --- pagination ---
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(req.query.pageSize as string) || DEFAULT_PAGE_SIZE),
  );
  const skip = (page - 1) * pageSize;

  const [tickets, total] = await Promise.all([
    db.ticket.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: { assignee: { select: { id: true, name: true } } },
    }),
    db.ticket.count({ where }),
  ]);

  res.json({ tickets, total });
});

router.get("/agents", async (_req, res) => {
  const agents = await db.user.findMany({
    where: { role: "agent" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  res.json(agents);
});

router.patch("/:id/assign", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const parsed = assignTicketSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid input" });
    return;
  }

  const { assigneeId } = parsed.data;

  if (assigneeId !== null) {
    const agent = await db.user.findUnique({ where: { id: assigneeId } });
    if (!agent || agent.role !== "agent") {
      res.status(400).json({ error: "Assignee must be a valid agent" });
      return;
    }
  }

  const ticket = await db.ticket.update({
    where: { id },
    data: { assignedTo: assigneeId },
    include: TICKET_INCLUDE,
  });

  res.json(ticket);
});

router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const parsed = updateTicketSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid input" });
    return;
  }

  const ticket = await db.ticket.update({
    where: { id },
    data: parsed.data,
    include: TICKET_INCLUDE,
  });

  res.json(ticket);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const ticket = await db.ticket.findUnique({
    where: { id },
    include: TICKET_INCLUDE,
  });

  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  res.json(ticket);
});

router.post("/:id/replies", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const parsed = createReplySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid input" });
    return;
  }

  const ticket = await db.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const senderType: SenderType =
    req.user.role === "admin" || req.user.role === "agent"
      ? SenderType.Agent
      : SenderType.Customer;

  const reply = await db.reply.create({
    data: {
      body: parsed.data.body,
      bodyHtml: parsed.data.bodyHtml ?? null,
      senderType,
      authorId: req.user.id,
      ticketId: id,
    },
    include: { author: { select: { id: true, name: true, role: true } } },
  });

  res.status(201).json(reply);
});

export default router;
