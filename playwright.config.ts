import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/test-results',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Stop dev servers before running tests — they use a different database.
  webServer: [
    {
      command: 'bun run dev:test',
      cwd: path.resolve(__dirname, 'server'),
      port: 3002,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: 'bun run dev -- --port 5174',
      cwd: path.resolve(__dirname, 'client'),
      port: 5174,
      env: { API_PORT: '3002' },
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
