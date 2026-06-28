import { Router } from "express";
import { db } from "../db";
import { requireAuth } from "../middleware/requireAuth";
import { TicketStatus, Category, type Prisma } from "../generated/prisma";

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

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const ticket = await db.ticket.findUnique({
    where: { id },
    include: { assignee: { select: { id: true, name: true } } },
  });

  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  res.json(ticket);
});

export default router;
