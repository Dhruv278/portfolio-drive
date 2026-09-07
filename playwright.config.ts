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
  // Five engines share one machine. Two workers and one retry absorb the cold-start of a browser
  // that lands while another project is software-rendering WebGL.
  workers: 2,
  retries: 1,
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
    // Other engines: Firefox (Gecko) and Safari's engine (WebKit). Headless WebGL support varies
    // between them, so the scene test accepts either the canvas or the fallback there.
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1400, height: 900 } } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1400, height: 900 } } },
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
