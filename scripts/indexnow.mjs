// Notifies IndexNow after a production build (postbuild on Vercel) or by hand with --force.
// URLs: the live sitemap, the fixed pages, and every article slug in src/content/writing.ts, so a
// new write-up is submitted on the deploy that publishes it.
import { readFileSync } from 'node:fs'
import { INDEXNOW_ENDPOINT, indexNowBody, locsFromSitemap } from '../src/lib/indexnow.mjs'

const force = process.argv.includes('--force')
if (!force && process.env.VERCEL_ENV !== 'production') {
  console.log('indexnow: not a production build, skipped')
  process.exit(0)
}
const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://portfolio-drive-mu.vercel.app').replace(/\/$/, '')

const fixed = ['/', '/drive', '/resume', '/writing'].map((p) => site + p)
const slugs = [...readFileSync(new URL('../src/content/writing.ts', import.meta.url), 'utf8').matchAll(/slug: '([a-z0-9-]+)'/g)].map((m) => site + '/writing/' + m[1])
let live = []
try {
  const res = await fetch(site + '/sitemap.xml', { signal: AbortSignal.timeout(8000) })
  if (res.ok) live = locsFromSitemap(await res.text())
} catch (e) {
  console.log('indexnow: sitemap not reachable, using the fixed list (' + (e && e.message) + ')')
}

const body = indexNowBody(site, [...fixed, ...slugs, ...live])
try {
  const res = await fetch(INDEXNOW_ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify(body), signal: AbortSignal.timeout(8000) })
  console.log('indexnow: ' + res.status + ' for ' + body.urlList.length + ' URLs on ' + body.host)
} catch (e) {
  console.log('indexnow: submit failed, ' + (e && e.message))
}
