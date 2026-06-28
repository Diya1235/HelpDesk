---
name: webhook-inbound-email-endpoint
description: Inbound email webhook endpoint details — public, no auth, creates Ticket rows
metadata:
  type: project
---

`POST /api/webhooks/inbound-email` — public endpoint (mounted before requireAuth in server/src/index.ts).

Request schema (from core/src/schemas/tickets.ts `inboundEmailWebhookSchema`):
- `from`: string, min(1) — required
- `subject`: string, optional
- `text`: string, optional
- `html`: string, optional
- `to`: string | string[], optional

Responses:
- `201 { id: number }` — ticket created
- `400 { error: string }` — validation failed (from missing/empty)
- `401 { error: "Unauthorized" }` — only if WEBHOOK_SECRET env var is set and x-webhook-secret header does not match

Parsing logic (server/src/routes/webhooks.ts):
- "Name <email>" → fromName = "Name", fromEmail = "email"
- bare "email@x.com" → fromName = fromEmail = "email@x.com"
- Body: prefers `text`; falls back to stripHtml(html) if no text

Ticket is created with status: Open (Prisma default), category: null, assignedTo: null.

**How to apply:** Use `http://localhost:3002/api/webhooks/inbound-email` in tests. The `request` fixture can call it without any auth headers. Verify creation via 201 + numeric id, then optionally navigate to /tickets via page fixture (after login) to check the row.
