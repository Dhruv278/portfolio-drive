import { describe, expect, it } from 'vitest'
import { articles } from '@/content/writing'
import { SITE_URL } from '@/lib/site'
import { GET, published } from './route'

describe('RSS feed', () => {
  it('is well-formed XML with one item per published write-up, newest first', async () => {
    const res = GET()
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/rss+xml')
    const xml = await res.text()
    const doc = new DOMParser().parseFromString(xml, 'application/xml')
    expect(doc.querySelector('parsererror')).toBeNull()
    const items = [...doc.querySelectorAll('item')]
    expect(items.length).toBe(articles.filter((a) => !a.draft).length)
    expect(items.map((i) => i.querySelector('link')?.textContent)).toEqual(published().map((a) => `${SITE_URL}/writing/${a.slug}`))
    expect(items[0].querySelector('pubDate')?.textContent).toMatch(/GMT$/)
    expect(xml).toContain('rel="self"')
    expect(xml).toContain('<content:encoded><![CDATA[<h2>')
  })
})
