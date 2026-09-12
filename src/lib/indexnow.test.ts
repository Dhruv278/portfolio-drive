import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { INDEXNOW_KEY, indexNowBody, locsFromSitemap } from './indexnow.mjs'
import { SITE_URL } from './site'

describe('IndexNow', () => {
  it('serves the key from the file the engines fetch', () => {
    expect(INDEXNOW_KEY).toMatch(/^[a-f0-9]{32}$/)
    expect(readFileSync(`public/${INDEXNOW_KEY}.txt`, 'utf8')).toBe(INDEXNOW_KEY)
  })

  it('reads every location out of a sitemap', () => {
    const xml = '<urlset><url><loc>https://a.b/</loc></url><url><loc> https://a.b/x </loc></url></urlset>'
    expect(locsFromSitemap(xml)).toEqual(['https://a.b/', 'https://a.b/x'])
  })

  it('submits only this host, once each, with the key location', () => {
    const body = indexNowBody(SITE_URL, [`${SITE_URL}/`, `${SITE_URL}/`, 'https://evil.example/x', 'not a url'])
    expect(body).toEqual({ host: new URL(SITE_URL).host, key: INDEXNOW_KEY, keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`, urlList: [`${SITE_URL}/`] })
  })
})
