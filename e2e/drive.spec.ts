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
    await page.goto('/')
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
    await expect(page.getByTestId('scene').locator('canvas')).toBeVisible({ timeout: 20_000 })
  })
})
