---
name: auth-selectors
description: Exact Playwright selectors for the login form and navbar, derived from the actual component source
metadata:
  type: project
---

## LoginPage (`client/src/pages/LoginPage.tsx`)

| Element | Selector | Notes |
|---------|----------|-------|
| Email input | `page.getByLabel('Email')` | `<Label htmlFor="email">Email</Label>` |
| Password input | `page.getByLabel('Password')` | `<Label htmlFor="password">Password</Label>` |
| Submit button | `page.getByRole('button', { name: 'Sign in' })` | Text is "Sign in"; during submission it changes to "Signing in…" |
| Email validation error | `page.getByText('Enter a valid email address')` | From zod: `z.string().email("Enter a valid email address")` |
| Password validation error | `page.getByText('Password is required')` | From zod: `z.string().min(1, "Password is required")` |
| Server error | `page.getByText('Invalid email or password', { exact: false })` | Use `exact: false` — the UI may append a period if `error.message` is undefined |

## Navbar (`client/src/components/Navbar.tsx`)

| Element | Selector |
|---------|----------|
| Sign out button | `page.getByRole('button', { name: 'Sign Out' })` |

## Post-login redirect

After a successful sign-in, `navigate('/')` is called in `onSubmit`. The dashboard heading is:
```
page.getByRole('heading', { name: 'Dashboard' })
```
(from `<h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>` in `HomePage.tsx`)

## Server error normalisation

The server intercepts `POST /api/auth/sign-in/email` and replaces all 4xx responses with:
```json
{ "error": "Invalid email or password" }
```
Both wrong password AND unknown email produce this identical response (anti-enumeration).
The UI renders it via `setServerError(error.message ?? "Invalid email or password.")`.
