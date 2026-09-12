import { identity } from '@/content/profile'
import { seo } from '@/content/seo'
import { articles, type Article } from '@/content/writing'
import { SITE_URL } from '@/lib/site'

// RSS 2.0 for the write-ups. Static at build time; feed readers and aggregators pick up new
// articles without anyone posting a link.
export const dynamic = 'force-static'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const cdata = (s: string) => `<![CDATA[${s.replaceAll(']]>', ']]]]><![CDATA[>')}]]>`

function body(a: Article): string {
  return a.sections
    .map((s) => `<h2>${esc(s.heading)}</h2>` + s.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('') + (s.list ? `<ul>${s.list.map((li) => `<li>${esc(li)}</li>`).join('')}</ul>` : ''))
    .join('')
}

export function published(): Article[] {
  return articles.filter((a) => !a.draft).sort((a, b) => b.date.localeCompare(a.date))
}

export function buildFeed(): string {
  const items = published()
  const newest = items[0] ? new Date(items[0].date) : new Date(0)
  const item = (a: Article) => {
    const url = `${SITE_URL}/writing/${a.slug}`
    return `<item><title>${esc(a.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${new Date(a.date).toUTCString()}</pubDate><dc:creator>${esc(identity.name)}</dc:creator><description>${esc(a.standfirst)}</description><content:encoded>${cdata(body(a))}</content:encoded></item>`
  }
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">` +
    `<channel><title>${esc(seo.feed.title)}</title><link>${SITE_URL}/writing</link><description>${esc(seo.feed.description)}</description><language>en</language>` +
    `<lastBuildDate>${newest.toUTCString()}</lastBuildDate><atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>` +
    items.map(item).join('') +
    `</channel></rss>`
  )
}

export function GET() {
  return new Response(buildFeed(), { headers: { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
}
