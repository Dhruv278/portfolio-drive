import { expect, test } from '@playwright/test'

test.describe('The Drive', () => {
  test('renders six stops with the resume content', async ({ page }) => {
    await page.goto('/drive')
    await expect(page.locator('section.stop')).toHaveCount(6)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Dhruv')
    await expect(page.getByRole('heading', { name: /MedChron: medical records in/ })).toBeVisible()
    await expect(page.locator('#contact a[href^="mailto:"]')).toHaveCount(1)
  })

  test('odometer follows the scroll through every stop', async ({ page }) => {
    // Headless Chrome renders WebGL in software, which starves the page thread and makes this
    // scroll loop time out. The HTML layer is what is under test here, so the scene is switched off.
    await page.goto('/drive?scene=off')
    const odo = page.getByTestId('odometer')
    await expect(odo).toContainText('Stop 1 of 6')
    const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
    const seen = new Set<string>()
    for (let i = 0; i <= 30; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round((total * i) / 30))
      await page.waitForTimeout(120)
      const m = (await odo.textContent())?.match(/Stop (\d) of 6/)
      if (m) seen.add(m[1])
    }
    expect([...seen].sort()).toEqual(['1', '2', '3', '4', '5', '6'])
    await expect(odo).toContainText('Stop 6 of 6')
  })

  test('projects carry skill chips and the skills board is grouped', async ({ page }) => {
    await page.goto('/drive?scene=off')
    expect(await page.locator('#platforms .chip').count()).toBeGreaterThan(20)
    expect(await page.locator('#products .card .chip').count()).toBeGreaterThan(10)
    expect(await page.locator('#how .skillgroup').count()).toBeGreaterThanOrEqual(8)
    await expect(page.locator('#how .skillgroup h3').first()).toHaveText('Languages')
  })

  test('stops reveal as the car arrives and stay revealed', async ({ page }) => {
    await page.goto('/drive?scene=off')
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
    // Walk the scroll through a section and record the panel at every sample where the scroll
    // model says the car is parked at this stop (data-stop and data-parked on the odometer). A wheel
    // over the panel must move the page, never the panel's inside.
    const probe = (id: string) =>
      page.evaluate(async (id) => {
        const sec = document.querySelector<HTMLElement>(`section#${id}`)!
        const panel = sec.querySelector<HTMLElement>('.panel')!
        const odo = document.querySelector<HTMLElement>('[data-testid="odometer"]')!
        const settle = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
        const out = { parked: 0, allVisible: true, endVisible: false, topAtArrival: NaN, overflow: getComputedStyle(panel).overflowY }
        for (let y = sec.offsetTop - innerHeight; y <= sec.offsetTop + sec.offsetHeight; y += 40) {
          window.scrollTo(0, y)
          await settle()
          if (odo.dataset.parked !== 'true' || odo.dataset.stop !== sec.dataset.stop) continue
          const r = panel.getBoundingClientRect()
          if (out.parked === 0) out.topAtArrival = r.top
          out.parked++
          if (r.bottom <= innerHeight + 0.5) out.endVisible = true
          if (!(r.top >= -0.5 && r.bottom <= innerHeight + 0.5)) out.allVisible = false
        }
        return out
      }, id)

    await page.goto('/drive?scene=off')
    const medchron = await probe('medchron')
    expect(medchron.overflow).toBe('visible')
    expect(medchron.parked).toBeGreaterThan(5)
    expect(medchron.allVisible).toBe(true)

    // A short window, where the tallest panel no longer fits: its heading is on screen when the car
    // arrives, and it slides up to show its end before the car leaves.
    await page.setViewportSize({ width: 1000, height: 600 })
    await page.goto('/drive?scene=off')
    const platforms = await probe('platforms')
    expect(platforms.overflow).toBe('visible')
    expect(platforms.parked).toBeGreaterThan(3)
    expect(platforms.topAtArrival).toBeGreaterThanOrEqual(0)
    expect(platforms.endVisible).toBe(true)
  })

  test('phone: top bar stays clear of the hero and controls are touch sized', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'phone', 'phone layout only')
    await page.goto('/drive?scene=off')
    const m = await page.evaluate(() => {
      const hud = document.querySelector('.hud.top')!.getBoundingClientRect()
      const hero = document.querySelector('section#start .panel')!.getBoundingClientRect()
      const buttons = [...document.querySelectorAll<HTMLElement>('.hud.top a, section#start .btn')].map((b) => b.getBoundingClientRect().height)
      const overflow = document.documentElement.scrollWidth - innerWidth
      return { hudBottom: hud.bottom, heroTop: hero.top, hudRows: hud.height, minButton: Math.min(...buttons), overflow }
    })
    expect(m.overflow).toBe(0)
    expect(m.hudRows).toBeLessThan(60) // one row of controls
    expect(m.hudBottom).toBeLessThanOrEqual(m.heroTop)
    expect(m.minButton).toBeGreaterThanOrEqual(44)
  })

  test('plays the intro once and ends within six seconds', async ({ page }, testInfo) => {
    test.skip(!['desktop', 'phone'].includes(testInfo.project.name), 'needs a real WebGL scene')
    await page.goto('/drive?stats=1')
    const scene = page.getByTestId('scene')
    await expect(scene).toHaveAttribute('data-ready', 'true', { timeout: 60_000 })
    await expect(scene).toHaveAttribute('data-intro', /playing|done/)
    await expect(scene).toHaveAttribute('data-intro', 'done', { timeout: 8_000 })
    // the intro left the car at the first stop
    await expect(page.getByTestId('odometer')).toContainText('Stop 1 of 6')
  })

  test('skips the intro when the visitor has already scrolled', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'one engine is enough')
    await page.goto('/drive?stats=1')
    await page.evaluate(() => window.scrollTo(0, 600))
    await expect(page.getByTestId('scene')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 })
    await expect(page.getByTestId('scene')).toHaveAttribute('data-intro', 'skipped', { timeout: 8_000 })
  })

  test('builds the garage and the MedChron set piece', async ({ page }, testInfo) => {
    test.skip(!['desktop', 'phone'].includes(testInfo.project.name), 'needs a real WebGL scene')
    await page.goto('/drive?stats=1&intro=0')
    await expect(page.getByTestId('scene')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 })
    const names = await page.evaluate(() => {
      const d = (window as unknown as { __drive?: { scene: { getObjectByName: (n: string) => unknown } } }).__drive
      return ['piece-garage', 'piece-medchron', 'car'].map((n) => Boolean(d?.scene.getObjectByName(n)))
    })
    expect(names).toEqual([true, true, true])
  })

  test('writing: both articles render and are linked from the home page', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#writing .tp-list a')).toHaveCount(2)
    const res = await page.goto('/writing/cited-chronologies')
    expect(res?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Every fact cites its page')
    await expect(page.locator('.article h2')).toHaveCount(5)
    const missing = await page.goto('/writing/does-not-exist')
    expect(missing?.status()).toBe(404)
  })

  test('the drive has a visible way back to the proof', async ({ page }) => {
    await page.goto('/drive?scene=off')
    const exit = page.getByTestId('exit-drive')
    await expect(exit).toBeVisible()
    await expect(exit).toHaveAttribute('href', '/')
    await exit.click()
    await expect(page.locator('section.tp-stop')).toHaveCount(10)
  })

  test('home: ten checkpoints, telemetry follows the scroll, no sideways overflow', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('section.tp-stop')).toHaveCount(10)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Dhruv')
    const odo = page.getByTestId('track-odometer')
    await expect(odo).toContainText('01 / 10')
    await page.evaluate(() => {
      const c = document.querySelector('#skills .tp-card')!
      const r = c.getBoundingClientRect()
      window.scrollTo(0, r.top + scrollY + r.height / 2 - innerHeight / 2)
    })
    await expect(odo).toContainText('07 / 10', { timeout: 5_000 })
    await expect(page.locator('#skills')).toHaveClass(/on/)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBe(0)
    await expect(page.locator('#top').getByRole('link', { name: 'Take the 3D drive' })).toHaveAttribute('href', '/drive')
    // the old address still lands on the home page
    await page.goto('/track')
    await expect(page).toHaveURL(/\/$/)
  })

  test('home on a phone: the route bar takes over after the hero and the car drives across it', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'phone', 'phone layout only')
    await page.goto('/')
    const road = page.getByTestId('track-road')
    const carX = () => page.evaluate(() => parseFloat(document.querySelector('[data-testid=track-car]')!.getAttribute('transform')!.match(/translate\(([-\d.]+)/)![1]))
    await expect(road).toHaveClass(/bar/)
    await expect(road).not.toHaveClass(/shown/)
    await expect(page.locator('.tp-heroroad')).toBeVisible()
    const x0 = await carX()
    const centre = (id: string) =>
      page.evaluate((id) => {
        const r = document.querySelector(`#${id} .tp-card`)!.getBoundingClientRect()
        window.scrollTo(0, r.top + scrollY + r.height / 2 - innerHeight / 2)
      }, id)
    await centre('why')
    await expect(road).toHaveClass(/shown/, { timeout: 5_000 })
    const box = (await road.boundingBox())!
    expect(box.height).toBeLessThanOrEqual(60)
    expect(box.y).toBeGreaterThan(40)
    expect(box.y).toBeLessThan(130)
    await expect(page.getByTestId('track-caption')).toContainText('02 / 10')
    await centre('skills')
    await expect(page.getByTestId('track-caption')).toContainText('07 / 10', { timeout: 5_000 })
    await expect.poll(carX, { timeout: 5_000 }).toBeGreaterThan(x0 + 100)
    const m = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      projectsSwipe: document.querySelector('.tp-projects')!.scrollWidth > document.querySelector('.tp-projects')!.clientWidth + 20,
      skillsSwipe: document.querySelector('.tp-skills')!.scrollWidth > document.querySelector('.tp-skills')!.clientWidth + 20,
      cardW: document.querySelector('#skills .tp-card')!.getBoundingClientRect().width,
    }))
    expect(m.overflow).toBe(0)
    expect(m.projectsSwipe).toBe(true)
    expect(m.skillsSwipe).toBe(true)
    expect(m.cardW).toBeGreaterThan(300)
  })

  test('home on tablets: the bar below 1024 px, and above it the road never crosses a card', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'one engine is enough')
    const road = page.getByTestId('track-road')
    const centre = (id: string) =>
      page.evaluate((id) => {
        const r = document.querySelector(`#${id} .tp-card`)!.getBoundingClientRect()
        window.scrollTo(0, r.top + scrollY + r.height / 2 - innerHeight / 2)
      }, id)
    await page.setViewportSize({ width: 820, height: 1180 })
    await page.goto('/')
    await expect(road).toHaveClass(/bar/)
    await centre('experience')
    await expect(road).toHaveClass(/shown/, { timeout: 5_000 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)
    for (const width of [1024, 1400]) {
      await page.setViewportSize({ width, height: 800 })
      await page.waitForTimeout(400)
      await expect(road).not.toHaveClass(/bar/)
      await centre('experience')
      await page.waitForTimeout(400)
      const g = await page.evaluate(() => {
        const card = document.querySelector('#experience .tp-card')!.getBoundingClientRect()
        const cp = document.querySelectorAll('.tp-cp')[2]
        return { cardRight: card.right, roadX: parseFloat(cp.getAttribute('cx')!) }
      })
      // road centre minus half the road and kerb, with a gap
      expect(g.cardRight).toBeLessThan(g.roadX - 29 - 20)
    }
  })

  test('resume PDF and resume page are reachable', async ({ page, request }) => {
    await page.goto('/drive')
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
    await page.goto('/drive')
    await expect(page.getByTestId('nogl')).toBeVisible()
    await expect(page.locator('section.stop')).toHaveCount(6)
  })

  test('mounts the 3D scene when WebGL is available', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'no-webgl', 'WebGL disabled in this project')
    await page.goto('/drive')
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
