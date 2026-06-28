---
name: playwright-test-ports
description: Actual ports used by the test servers in playwright.config.ts — different from the dev ports in the task description
metadata:
  type: project
---

In test mode (playwright runs), the ports differ from dev mode:
- Server: **3002** (webServer command: `bun run dev:test`, port: 3002)
- Client: **5174** (webServer command: `bun run dev -- --port 5174`, port: 5174)
- Client Vite proxy: `/api` → `http://localhost:${API_PORT}` where `API_PORT=3002` is injected via webServer env in playwright.config.ts
- `baseURL` in playwright config: `http://localhost:5174`

**Why:** The project uses separate dev:test and dev:seed scripts to isolate the test DB (`helpdesk_test`) from the dev DB (`helpdesk`).

**How to apply:** Always use `http://localhost:3002` as the SERVER_URL constant in test files for direct API calls (e.g. webhook posts). Use relative paths like `/tickets` when navigating via `page.goto()` since baseURL handles the client host.
