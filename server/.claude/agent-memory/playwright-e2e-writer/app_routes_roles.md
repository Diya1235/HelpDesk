---
name: app-routes-roles
description: Route structure, which component guards each route, and where each role is redirected on access
metadata:
  type: project
---

## Client-side routes (App.tsx)

| Path | Guard component | Unauthenticated | Wrong role (agent) |
|------|----------------|-----------------|-------------------|
| `/login` | none — `LoginPage` redirects away if session exists | shown | shown |
| `/` | `ProtectedRoute` | → `/login` | allowed |
| `/users` | `AdminRoute` | → `/login` | → `/` (dashboard) |
| `*` | none | → `/` (via Navigate) | → `/` |

Important: the admin area is `/users`, NOT `/admin/*`. CLAUDE.md mentions `/admin/*` as the intended architecture but the current implementation uses `/users`.

**ProtectedRoute** (`client/src/components/ProtectedRoute.tsx`):
- `isPending` → renders "Loading..."
- no session → `<Navigate to="/login" replace />`
- session → `<Outlet />`

**AdminRoute** (`client/src/components/AdminRoute.tsx`):
- `isPending` → renders "Loading..."
- no session → `<Navigate to="/login" replace />`
- `session.user.role !== "admin"` → `<Navigate to="/" replace />`
- admin → `<Outlet />`

**Why:** Guards are client-side React Router components. They rely on `authClient.useSession()`. The role is cast as `(session.user as { role?: string }).role`.

**How to apply:** When writing auth guard tests, assert `/login` for unauthenticated users and `/` (dashboard) for logged-in non-admins hitting `/users`. Do not assert a 403 — role rejection is a client-side redirect.
