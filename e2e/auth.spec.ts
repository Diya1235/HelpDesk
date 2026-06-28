import { test, expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Seeded credentials — created by server/prisma/seed.ts on every test run.
// ---------------------------------------------------------------------------

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'TestPassword123!';

// Role defaults to "agent" via the Prisma schema @default(agent).
const AGENT_EMAIL = 'agent@example.com';
const AGENT_PASSWORD = 'AgentPassword123!';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Fill the login form and wait for the post-login redirect to '/'.
 * Only call this with credentials that are known to be correct — if sign-in
 * fails the helper will time out waiting for the URL change.
 */
async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/');
}

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

test.describe('Login — happy path', () => {
  test('valid admin credentials redirect to the dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill(ADMIN_EMAIL);
    await page.getByLabel('Password').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Already authenticated
// ---------------------------------------------------------------------------

test.describe('Login — already authenticated', () => {
  test('authenticated user navigating to /login is redirected away to the dashboard', async ({ page }) => {
    // Establish a session first.
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // LoginPage renders <Navigate to="/" replace /> when it detects a session,
    // so visiting /login while signed in should bounce straight back to /.
    await page.goto('/login');

    await expect(page).toHaveURL('/');
  });
});

// ---------------------------------------------------------------------------
// Client-side form validation (zod resolver fires before any network call)
// ---------------------------------------------------------------------------

test.describe('Login form — client-side validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('submitting with an empty email field shows a validation error', async ({ page }) => {
    // Fill only the password so the submit attempt is genuine.
    await page.getByLabel('Password').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Enter a valid email address')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('submitting with an invalid email format shows a validation error', async ({ page }) => {
    await page.getByLabel('Email').fill('not-a-valid-email');
    await page.getByLabel('Password').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Enter a valid email address')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('submitting with an empty password field shows a validation error', async ({ page }) => {
    await page.getByLabel('Email').fill(ADMIN_EMAIL);
    // Leave password blank.
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Password is required')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('submitting with both fields empty shows validation errors for both', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Enter a valid email address')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});

// ---------------------------------------------------------------------------
// Server-side failures
// The server normalises "wrong password" and "email not found" to an identical
// response so that an attacker cannot enumerate registered email addresses.
// ---------------------------------------------------------------------------

test.describe('Login failures — server-side errors', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('wrong password shows a generic error message and keeps the user on /login', async ({ page }) => {
    await page.getByLabel('Email').fill(ADMIN_EMAIL);
    await page.getByLabel('Password').fill('WrongPassword999!');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // exact: false guards against trailing-punctuation variants of the message.
    await expect(
      page.getByText('Invalid email or password', { exact: false })
    ).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('non-existent email shows the same generic error as wrong password', async ({ page }) => {
    // The server must not reveal whether the email exists in the database.
    await page.getByLabel('Email').fill('nobody@example.com');
    await page.getByLabel('Password').fill('SomePassword123!');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(
      page.getByText('Invalid email or password', { exact: false })
    ).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});

// ---------------------------------------------------------------------------
// Session persistence
// ---------------------------------------------------------------------------

test.describe('Session persistence', () => {
  test('session cookie survives a full page reload', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // Hard-reload — the browser sends the session cookie and the server
    // validates it. The app should remain on / with the dashboard visible.
    await page.reload();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Auth guards — unauthenticated access to protected routes
// Both ProtectedRoute and AdminRoute redirect unauthenticated users to /login.
// ---------------------------------------------------------------------------

test.describe('Auth guards — unauthenticated access', () => {
  test('unauthenticated user visiting / is redirected to /login', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL('/login');
  });

  test('unauthenticated user visiting the admin users page is redirected to /login', async ({ page }) => {
    await page.goto('/users');

    await expect(page).toHaveURL('/login');
  });
});

// ---------------------------------------------------------------------------
// Role guards — authenticated but insufficient role
// AdminRoute redirects non-admin users to / (dashboard), not to /login.
// ---------------------------------------------------------------------------

test.describe('Role guards', () => {
  test('agent user visiting the admin users page is redirected to the dashboard', async ({ page }) => {
    // Sign in as the seeded test agent (role: "agent").
    await loginAs(page, AGENT_EMAIL, AGENT_PASSWORD);

    // Attempt to access the admin-only route directly.
    await page.goto('/users');

    // AdminRoute detects role !== "admin" and renders <Navigate to="/" replace />.
    // This is a client-side redirect, not a server 403, so the landing page is
    // the dashboard — not the login page.
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------------

test.describe('Sign out', () => {
  test('clicking Sign Out clears the session and redirects to /login', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await page.getByRole('button', { name: 'Sign Out' }).click();

    await expect(page).toHaveURL('/login');
  });

  test('after signing out, navigating to a protected route redirects to /login', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // Sign out to invalidate the session cookie.
    await page.getByRole('button', { name: 'Sign Out' }).click();
    await expect(page).toHaveURL('/login');

    // The session is now gone — ProtectedRoute must reject direct navigation.
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });
});
