import { defineConfig, devices } from '@playwright/test'

// A deliberately unusual port. reuseExistingServer is off so a stray server on this port fails the
// run loudly instead of the suite silently testing someone else's app.
const PORT = process.env.E2E_PORT ?? '3777'
const baseURL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1400, height: 900 } } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
    {
      name: 'no-webgl',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1400, height: 900 },
        launchOptions: { args: ['--disable-gpu', '--disable-webgl', '--disable-webgl2', '--disable-3d-apis'] },
      },
    },
  ],
})
