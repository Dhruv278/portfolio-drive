import { defineConfig, devices } from '@playwright/test'

const PORT = process.env.PORT ?? '3100'
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
    reuseExistingServer: true,
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
