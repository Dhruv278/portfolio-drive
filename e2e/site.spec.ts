import { readdirSync } from 'node:fs'
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

  test('the writing index, the feed, the icons, the IndexNow key and the structured data are served', async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'one engine is enough')
    const index = await request.get('/writing')
    expect(index.status()).toBe(200)
    const list = await index.text()
    expect(list).toContain('/writing/cited-chronologies')
    expect(list).toContain('/writing/three-js-on-integrated-graphics')
    const feed = await request.get('/feed.xml')
    expect(feed.status()).toBe(200)
    expect(feed.headers()['content-type']).toContain('application/rss+xml')
    expect(await feed.text()).toContain('<item>')
    for (const [path, type] of [
      ['/icon.svg', 'image/svg+xml'],
      ['/apple-icon.png', 'image/png'],
    ]) {
      const r = await request.get(path)
      expect(r.status(), path).toBe(200)
      expect(r.headers()['content-type'], path).toContain(type)
    }
    const key = readdirSync('public').find((f) => /^[a-f0-9]{32}\.txt$/.test(f))
    expect(key).toBeTruthy()
    expect((await request.get(`/${key}`)).status()).toBe(200)
    const home = await (await request.get('/')).text()
    expect(home).toContain('application/rss+xml')
    expect(home).toContain('"@type":"ProfilePage"')
    expect(home).toContain('rel="apple-touch-icon"')
    const article = await (await request.get('/writing/cited-chronologies')).text()
    expect(article).toContain('"@type":"Article"')
    expect(article).toContain('"@type":"BreadcrumbList"')
    expect(article).toContain('property="og:image"')
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
