import { expect, test } from '@playwright/test'

test.describe('The Drive', () => {
  test('renders six stops with the resume content', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('section.stop')).toHaveCount(6)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Dhruv')
    await expect(page.getByRole('heading', { name: /MedChron: medical records in/ })).toBeVisible()
    await expect(page.locator('#contact a[href^="mailto:"]')).toHaveCount(1)
  })

  test('odometer follows the scroll through every stop', async ({ page }) => {
    // Headless Chrome renders WebGL in software, which starves the page thread and makes this
    // scroll loop time out. The HTML layer is what is under test here, so the scene is switched off.
    await page.goto('/?scene=off')
    const odo = page.getByTestId('odometer')
    await expect(odo).toContainText('Stop 1 of 6')
    const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
    const seen = new Set<string>()
    for (let i = 0; i <= 20; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round((total * i) / 20))
      await page.waitForTimeout(60)
      const m = (await odo.textContent())?.match(/Stop (\d) of 6/)
      if (m) seen.add(m[1])
    }
    expect([...seen].sort()).toEqual(['1', '2', '3', '4', '5', '6'])
    await expect(odo).toContainText('Stop 6 of 6')
  })

  test('resume PDF and resume page are reachable', async ({ page, request }) => {
    await page.goto('/')
    const href = await page.locator('.hud.top a.btn.primary').getAttribute('href')
    expect(href).toBe('/Dhruv_Gopani_Resume.pdf')
    const pdf = await request.get(href!)
    expect(pdf.status()).toBe(200)
    expect(pdf.headers()['content-type']).toContain('pdf')
    const res = await page.goto('/resume')
    expect(res?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Dhruv Gopani')
  })

  test('shows the fallback and all content when WebGL is unavailable', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'no-webgl', 'only meaningful with WebGL disabled')
    await page.goto('/')
    await expect(page.getByTestId('nogl')).toBeVisible()
    await expect(page.locator('section.stop')).toHaveCount(6)
  })

  test('mounts the 3D scene when WebGL is available', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'no-webgl', 'WebGL disabled in this project')
    await page.goto('/')
    const chromium = testInfo.project.name === 'desktop' || testInfo.project.name === 'phone'
    if (chromium) {
      await expect(page.getByTestId('scene').locator('canvas')).toBeVisible({ timeout: 20_000 })
      // every model arrives and the canvas fades in
      await expect(page.getByTestId('scene')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 })
      await expect(page.getByTestId('loadstatus')).toHaveText('')
    } else {
      // Firefox and WebKit headless builds differ in WebGL 2 support. Either outcome must leave the
      // content intact: the scene mounts, or the fallback note shows. Never a blank page or a crash.
      const outcome = page.getByTestId('scene').locator('canvas').or(page.getByTestId('nogl'))
      await expect(outcome.first()).toBeVisible({ timeout: 30_000 })
    }
    await expect(page.locator('section.stop')).toHaveCount(6)
  })
})
