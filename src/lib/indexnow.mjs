// IndexNow: tells Bing, and through it DuckDuckGo, Yahoo and ChatGPT search, which pages changed.
// Google ignores IndexNow, so the sitemap in Search Console covers Google. The key is public by
// design: search engines confirm it by fetching /<key>.txt from this host.
export const INDEXNOW_KEY = '869933484618e54f6cdd930da4239de2'
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow'

/** @param {string} xml */
export function locsFromSitemap(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1])
}

/**
 * @param {string} siteUrl
 * @param {string[]} urls
 */
export function indexNowBody(siteUrl, urls) {
  const host = new URL(siteUrl).host
  const own = [...new Set(urls)].filter((u) => {
    try {
      return new URL(u).host === host
    } catch {
      return false
    }
  })
  return { host, key: INDEXNOW_KEY, keyLocation: siteUrl + '/' + INDEXNOW_KEY + '.txt', urlList: own }
}
