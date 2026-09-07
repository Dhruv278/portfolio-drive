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

  test('projects carry skill chips and the skills board is grouped', async ({ page }) => {
    await page.goto('/?scene=off')
    expect(await page.locator('#platforms .chip').count()).toBeGreaterThan(20)
    expect(await page.locator('#products .card .chip').count()).toBeGreaterThan(10)
    expect(await page.locator('#how .skillgroup').count()).toBeGreaterThanOrEqual(8)
    await expect(page.locator('#how .skillgroup h3').first()).toHaveText('Languages')
  })

  test('stops reveal as the car arrives and stay revealed', async ({ page }) => {
    await page.goto('/?scene=off')
    await expect(page.locator('section#start')).toHaveAttribute('data-active', 'true')
    await expect(page.locator('section#platforms')).toHaveAttribute('data-active', 'false')
    const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(total * 0.6))
    await expect(page.locator('section#platforms')).toHaveAttribute('data-active', 'true')
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(page.locator('section#platforms')).toHaveAttribute('data-active', 'true')
  })

  test('a panel is fully on screen while the car is parked at its stop', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'phone', 'phones use a bottom sheet that scrolls inside')
    await page.goto('/?scene=off')
    // Walk the scroll through a section and record what the panel looked like while the odometer
    // named that stop. A wheel over the panel must move the page, never the panel's inside.
    const probe = (id: string, label: string) =>
      page.evaluate(
        async ([id, label]) => {
          const sec = document.querySelector<HTMLElement>(`section#${id}`)!
          const panel = sec.querySelector<HTMLElement>('.panel')!
          const odo = document.querySelector('[data-testid="odometer"]')!
          const settle = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
          const out = { parked: 0, fullyVisible: false, endVisible: false, overflow: getComputedStyle(panel).overflowY }
          for (let y = sec.offsetTop - innerHeight; y <= sec.offsetTop + sec.offsetHeight; y += 40) {
            window.scrollTo(0, y)
            await settle()
            if (!odo.textContent?.includes(label)) continue
            out.parked++
            const r = panel.getBoundingClientRect()
            if (r.bottom <= innerHeight + 0.5) out.endVisible = true
            if (r.top >= -0.5 && r.bottom <= innerHeight + 0.5) out.fullyVisible = true
          }
          return out
        },
        [id, label] as const,
      )
    const medchron = await probe('medchron', 'Stop 2 of 6')
    expect(medchron.overflow).toBe('visible')
    expect(medchron.parked).toBeGreaterThan(5)
    expect(medchron.fullyVisible).toBe(true)
    // The platforms panel is the tallest. Its end must come on screen before the car leaves.
    const platforms = await probe('platforms', 'Stop 4 of 6')
    expect(platforms.overflow).toBe('visible')
    expect(platforms.endVisible).toBe(true)
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
