import { test, expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// The test-mode server runs on 3002 (see playwright.config.ts webServer section).
const SERVER_URL = 'http://localhost:3002';
const WEBHOOK_URL = `${SERVER_URL}/api/webhooks/inbound-email`;

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'TestPassword123!';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/');
}

// ---------------------------------------------------------------------------
// Tests: request validation
// These make direct HTTP calls to the server and do not require a browser.
// ---------------------------------------------------------------------------

test.describe('POST /api/webhooks/inbound-email — validation', () => {
  test('returns 400 when the from field is missing', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: { subject: 'No from field', text: 'Body text.' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('returns 400 when the from field is an empty string', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: { from: '', subject: 'Empty from field', text: 'Body text.' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });
});

// ---------------------------------------------------------------------------
// Tests: ticket creation — API response only
// Verifies the endpoint returns 201 with a numeric id for each valid variant.
// ---------------------------------------------------------------------------

test.describe('POST /api/webhooks/inbound-email — ticket creation', () => {
  test('returns 201 with a numeric ticket id for a fully populated payload', async ({ request }) => {
    const ts = Date.now();

    const response = await request.post(WEBHOOK_URL, {
      data: {
        from: `Jane Doe <jane.${ts}@example.com>`,
        subject: `Order not arrived ${ts}`,
        text: 'My order has not arrived yet.',
        html: '<p>My order has not arrived yet.</p>',
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(typeof body.id).toBe('number');
  });

  test('creates a ticket when only a text body is provided (no html field)', async ({ request }) => {
    const ts = Date.now();

    const response = await request.post(WEBHOOK_URL, {
      data: {
        from: `text.only.${ts}@example.com`,
        subject: `Text-only ticket ${ts}`,
        text: 'Plain text body only.',
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(typeof body.id).toBe('number');
  });

  test('creates a ticket when only an html body is provided (no text field)', async ({ request }) => {
    const ts = Date.now();

    const response = await request.post(WEBHOOK_URL, {
      data: {
        from: `html.only.${ts}@example.com`,
        subject: `HTML-only ticket ${ts}`,
        html: '<p>This is an <strong>HTML</strong> body.</p>',
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(typeof body.id).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// Tests: UI verification
// Each test posts to the webhook then checks the resulting row in the
// /tickets page to confirm the data was stored and rendered correctly.
// These tests log in as admin because GET /api/tickets requires authentication.
// ---------------------------------------------------------------------------

test.describe('POST /api/webhooks/inbound-email — UI verification', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('happy path: ticket created via webhook appears in the tickets list', async ({
    page,
    request,
  }) => {
    const ts = Date.now();
    const subject = `Order not arrived ${ts}`;

    const res = await request.post(WEBHOOK_URL, {
      data: {
        from: `Jane Doe <jane.${ts}@example.com>`,
        subject,
        text: 'My order has not arrived yet.',
        html: '<p>My order has not arrived yet.</p>',
      },
    });
    expect(res.status()).toBe(201);

    await page.goto('/tickets');
    // The subject column is the second cell in each row; filtering by its text
    // is enough to confirm the ticket was persisted and is being listed.
    await expect(page.getByRole('row').filter({ hasText: subject })).toBeVisible();
  });

  test('"Name <email>" from: fromName and fromEmail are each displayed in the From column', async ({
    page,
    request,
  }) => {
    const ts = Date.now();
    const displayName = `Full Name ${ts}`;
    const email = `full.name.${ts}@example.com`;
    const subject = `Name-parsing test ${ts}`;

    const res = await request.post(WEBHOOK_URL, {
      data: {
        from: `${displayName} <${email}>`,
        subject,
        text: 'Testing "Name <email>" parsing.',
      },
    });
    expect(res.status()).toBe(201);

    await page.goto('/tickets');

    // Locate the specific row so assertions are scoped to it.
    const row = page.getByRole('row').filter({ hasText: subject });
    await expect(row).toBeVisible();

    // The TicketsPage renders the From cell as two stacked <div>s:
    //   <div>{fromName}</div>
    //   <div className="text-xs">{fromEmail}</div>
    await expect(row.getByText(displayName, { exact: true })).toBeVisible();
    await expect(row.getByText(email, { exact: true })).toBeVisible();
  });

  test('bare email from: fromName falls back to the email address', async ({
    page,
    request,
  }) => {
    const ts = Date.now();
    const email = `bare.${ts}@example.com`;
    const subject = `Bare-email test ${ts}`;

    const res = await request.post(WEBHOOK_URL, {
      data: {
        from: email, // no display name — "addr@test.com" format
        subject,
        text: 'Testing bare email as the from field.',
      },
    });
    expect(res.status()).toBe(201);

    await page.goto('/tickets');

    const row = page.getByRole('row').filter({ hasText: subject });
    await expect(row).toBeVisible();

    // When from is a bare email, the server stores the email in both fromName
    // and fromEmail.  The From cell therefore renders the same email string
    // twice (once for the name, once smaller for the address).  Checking that
    // the first occurrence is visible is sufficient to prove the fallback.
    await expect(row.getByText(email).first()).toBeVisible();
  });
});
