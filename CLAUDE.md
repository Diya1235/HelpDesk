
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered helpdesk web app. Receives support emails, auto-creates and classifies tickets, generates AI summaries and suggested replies, and routes unresolved tickets to agents. Two roles: **Admin** (manages agents) and **Agent** (resolves tickets). Ticket statuses: Open → Resolved → Closed. Categories: General Question, Technical Question, Refund Request.

## Monorepo Structure

```
/client   — React + TypeScript + Tailwind CSS frontend
/server   — Node.js + Express + TypeScript backend
```

## MCP Servers

### Context7 (up-to-date docs)
```bash
claude mcp add context7 -- npx -y @upstash/context7-mcp --api-key ctx7sk-a3fed466-1a6d-4bf9-8edb-25312392d233
```
Fetches live documentation for any library or framework used in this project.

## Commands

### Server (`/server`)
```bash
npm run dev       # start dev server with ts-node/tsx watch
npm run build     # compile TypeScript to dist/
npm start         # run compiled output
npx prisma migrate dev    # apply a new migration
npx prisma generate       # regenerate Prisma client after schema changes
npx prisma studio         # open DB browser UI
```

### Client (`/client`)
```bash
npm run dev       # start Vite dev server
npm run build     # production build
npm run lint      # ESLint
```

### Docker (root)
```bash
docker compose up --build   # start all services (db, server, client)
docker compose down         # stop and remove containers
```

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | Session-based, sessions stored in PostgreSQL |
| AI | Claude API (Anthropic) |
| Email | SendGrid or Resend |
| Deployment | Docker + Docker Compose |

## Architecture

### Authentication
Session-based auth with sessions persisted in PostgreSQL (not in-memory). Middleware guards all routes and enforces role (`admin` | `agent`). Unauthenticated requests redirect to `/login`.

### Role-Based Access
- Admin: full access including agent CRUD (`/admin/*` routes)
- Agent: access to ticket list, ticket detail, and resolution actions
- Guard middleware is applied at the router level, not per-endpoint

### AI Integration (Claude API)
Three discrete AI calls per ticket, triggered on inbound ticket creation:
1. **Classification** — assigns one of the three categories
2. **Summarization** — short human-readable summary
3. **Suggested reply** — draft response for agent review

Before assigning to an agent, a knowledge base lookup checks previously resolved tickets for an existing answer.

### Email Flow
- **Inbound**: webhook endpoint receives emails (SendGrid/Resend inbound parse) → creates ticket record
- **Outbound**: agent sends reply via API → email dispatched through SendGrid/Resend → linked to original ticket thread

### Database (Prisma)
Schema lives in `server/prisma/schema.prisma`. Always run `prisma generate` after schema changes. Migrations are committed to source control.

## Implementation Phases

See `implementation-plan.md` for the full phased roadmap (setup → auth → users → tickets → AI → email → dashboard → Docker).
