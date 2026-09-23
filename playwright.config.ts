import { defineConfig, devices } from '@playwright/test'

/**
 * E2E suite. Requires a configured Supabase project (VITE_SUPABASE_URL /
 * VITE_SUPABASE_PUBLISHABLE_KEY in .env) plus a disposable E2E account:
 *
 *   E2E_EMAIL=… E2E_PASSWORD=… npx playwright test
 *
 * Without credentials every spec is skipped so CI can run anywhere.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 180_000,
  },
})
