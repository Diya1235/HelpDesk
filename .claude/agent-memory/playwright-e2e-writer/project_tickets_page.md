---
name: tickets-page-selectors
description: TicketsPage (/tickets) — table structure and selector strategy for E2E tests
metadata:
  type: project
---

Route: `/tickets` (client/src/pages/TicketsPage.tsx). Requires auth — GET /api/tickets uses requireAuth middleware.

Table columns (left to right): #, Subject, From, Status, Category, Assigned To, Received.

**From cell structure:**
```html
<td>
  <div>{ticket.fromName}</div>
  <div class="text-xs text-gray-400">{ticket.fromEmail}</div>
</td>
```
Both fromName and fromEmail rendered in the same cell as stacked divs.

**Status cell:** inline span with class `bg-blue-100 text-blue-700` for Open, `bg-green-100 text-green-700` for Resolved, etc.

**Category cell:** rendered by `<TicketCategory />` — shows "—" (text-gray-300 span) when category is null.

**Locator patterns that work:**
- Find a row by subject: `page.getByRole('row').filter({ hasText: subject })`
- Then scope sub-assertions: `row.getByText(email, { exact: true })` for the From cell
- For bare-email case where fromName === fromEmail: `row.getByText(email).first()` since the value appears twice in the cell
- Empty state: `page.getByText('No tickets yet.')` (shown when tickets.length === 0)
