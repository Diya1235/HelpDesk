import { test, expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Seeded credentials — created by server/prisma/seed.ts on every test run.
// ---------------------------------------------------------------------------

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'TestPassword123!';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/');
}

// ---------------------------------------------------------------------------
// Shared helper: create an agent via the UI and wait for the modal to close.
// Returns the unique name and email used so the caller can locate the row.
// ---------------------------------------------------------------------------

async function createAgentViaUI(
  page: Page,
  name: string,
  email: string
): Promise<void> {
  await page.getByRole('button', { name: /add agent/i }).click();
  await expect(page.getByRole('heading', { name: 'New Agent' })).toBeVisible();

  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name').fill(name);
  await dialog.getByLabel('Email').fill(email);
  await dialog.getByLabel('Password').fill('AgentPass123!');
  await page.getByRole('button', { name: /create agent/i }).click();

  // Wait for the modal to close before the caller proceeds.
  await expect(page.getByRole('heading', { name: 'New Agent' })).not.toBeVisible();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Users page — CRUD happy paths', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/users');
    await expect(page).toHaveURL('/users');
  });

  // -------------------------------------------------------------------------
  // Read
  // -------------------------------------------------------------------------

  test('displays the Users heading and the seeded admin row', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
    // The member count paragraph is rendered once the query resolves.
    await expect(page.getByText(/members?/)).toBeVisible();
    // The seeded admin email must appear in the table.
    await expect(page.getByText(ADMIN_EMAIL)).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Create
  // -------------------------------------------------------------------------

  test('creates a new agent and shows the new user in the table', async ({ page }) => {
    const ts = Date.now();
    const name = `New Agent ${ts}`;
    const email = `agent.${ts}@example.com`;

    await page.getByRole('button', { name: /add agent/i }).click();
    await expect(page.getByRole('heading', { name: 'New Agent' })).toBeVisible();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Name').fill(name);
    await dialog.getByLabel('Email').fill(email);
    await dialog.getByLabel('Password').fill('AgentPass123!');
    await page.getByRole('button', { name: /create agent/i }).click();

    // Modal must close on success.
    await expect(page.getByRole('heading', { name: 'New Agent' })).not.toBeVisible();

    // The new agent's name must appear in the users table.
    await expect(page.getByText(name)).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Update
  // -------------------------------------------------------------------------

  test('edits an existing agent and reflects the updated name in the table', async ({ page }) => {
    const ts = Date.now();
    const originalName = `Edit Me ${ts}`;
    const updatedName = `Edited User ${ts}`;
    const email = `edit.${ts}@example.com`;

    // Create the user to edit.
    await createAgentViaUI(page, originalName, email);
    await expect(page.getByText(originalName)).toBeVisible();

    // Find the specific row by the original name and click its edit button.
    const row = page.getByRole('row').filter({ hasText: originalName });
    await row.getByTitle('Edit user').click();

    await expect(page.getByRole('heading', { name: 'Edit Agent' })).toBeVisible();

    // Update the name field.
    const dialog = page.getByRole('dialog');
    const nameInput = dialog.getByLabel('Name');
    await nameInput.clear();
    await nameInput.fill(updatedName);

    await page.getByRole('button', { name: /save changes/i }).click();

    // Modal must close on success.
    await expect(page.getByRole('heading', { name: 'Edit Agent' })).not.toBeVisible();

    // The table must show the updated name and no longer show the original.
    await expect(page.getByText(updatedName)).toBeVisible();
    await expect(page.getByText(originalName)).not.toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------

  test('deletes an agent and removes the row from the table', async ({ page }) => {
    const ts = Date.now();
    const name = `Delete Me ${ts}`;
    const email = `delete.${ts}@example.com`;

    // Create the user to delete.
    await createAgentViaUI(page, name, email);
    await expect(page.getByText(name)).toBeVisible();

    // Register the dialog handler BEFORE clicking delete so the confirm
    // prompt is accepted the moment it fires.
    page.on('dialog', (dialog) => dialog.accept());

    const row = page.getByRole('row').filter({ hasText: name });
    await row.getByTitle('Delete user').click();

    // The deleted user's row must disappear from the table.
    await expect(page.getByText(name)).not.toBeVisible();
  });
});
