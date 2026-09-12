import { expect, test } from '@playwright/test'

test.describe('site chrome', () => {
  test('robots, sitemap and the social image are served', async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'one engine is enough')
    const robots = await request.get('/robots.txt')
    expect(robots.status()).toBe(200)
    expect(await robots.text()).toContain('sitemap.xml')
    const sitemap = await request.get('/sitemap.xml')
    expect(sitemap.status()).toBe(200)
    expect(await sitemap.text()).toContain('/resume')
    const og = await request.get('/og.jpg')
    expect(og.status()).toBe(200)
    expect(og.headers()['content-type']).toContain('image/jpeg')
    const home = await request.get('/')
    const html = await home.text()
    expect(html).toContain('property="og:image"')
    expect(html).toContain('application/ld+json')
    expect(home.headers()['x-content-type-options']).toBe('nosniff')
  })

  test('the skip link lands on the content of the home page', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'one engine is enough')
    await page.goto('/')
    await page.keyboard.press('Tab')
    await expect(page.locator('.skip')).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#content$/)
    expect(await page.evaluate(() => document.getElementById('content')?.tagName)).toBe('MAIN')
  })
})
