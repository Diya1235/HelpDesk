# Helpdesk Implementation Plan

## Phase 1 — Project Setup
- Scaffold monorepo structure (`/client`, `/server`)
- [] setup express server with typescript
- setup react app with typescript
- setup postgresql database

  

## Phase 2 — Authentication
- create Login page 
- Implement login api end point
- implement session based authentication middleware
- Session-based auth stored in PostgreSQL
- Protect routes: redirect unauthenticated users to login
- Logout endpoint

## Phase 3 — User Management
- Admin-only: create, list, update, and delete agents
- Role-based access control (`admin` vs `agent`)
- Guard middleware to enforce role restrictions

## Phase 4 — Ticket CRUD
- Core ticket model operations (create, read, update status)
- Ticket list page with filtering by status and category
- Ticket detail view
- Manual ticket creation by agents

## Phase 5 — AI Features
- Claude API integration
- Auto-classify incoming tickets into categories (General, Technical, Refund)
- Generate a short ticket summary
- Suggest a reply for the agent to review and send
- Knowledge base lookup: check previous resolved tickets before assigning

## Phase 6 — Email Integration
- Inbound webhook to receive support emails and auto-create tickets
- Outbound: send replies via SendGrid or Resend
- Email threading (link replies to the original ticket)

## Phase 7 — Dashboard
- Stats overview: open, resolved, closed ticket counts
- Category breakdown
- Quick filters and recent ticket list

## Phase 8 — Polish & Deployment
- Input validation and error handling across all endpoints
- Loading states and error feedback on the frontend
- Dockerize frontend and backend
- Docker Compose for local + production setup
