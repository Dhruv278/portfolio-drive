import type { Metadata } from 'next'
import Link from 'next/link'
import { identity } from '@/content/profile'
import { seo } from '@/content/seo'
import { articles } from '@/content/writing'
import { breadcrumbJsonLd, jsonLd } from '@/lib/seo'

export const metadata: Metadata = {
  title: seo.titles.writing,
  description: seo.descriptions.writing,
  alternates: { canonical: '/writing', types: { 'application/rss+xml': '/feed.xml' } },
  openGraph: { title: seo.titles.writing, description: seo.descriptions.writing, url: '/writing', type: 'website', images: ['/og.jpg'] },
}

const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

// The index of write-ups: the home for articles search engines and feed readers can reach directly.
export default function WritingIndex() {
  const list = articles.filter((a) => !a.draft).sort((a, b) => b.date.localeCompare(a.date))
  return (
    <>
      <header className="topbar">
        <Link className="wordmark" href="/">
          {identity.name}
        </Link>
        <nav className="actions" aria-label="Site">
          <Link className="btn" href="/resume">
            Resume
          </Link>
          <a className="btn" href="/feed.xml">
            RSS
          </a>
        </nav>
      </header>
      <main id="content" className="home">
        <article className="article">
          <div className="wrap">
            <p className="eyebrow">Writing by {identity.name}</p>
            <h1>Notes from building AI for regulated work.</h1>
            <p className="standfirst">{seo.descriptions.writing}</p>
            <ul className="writing-index">
              {list.map((a) => (
                <li key={a.slug}>
                  <p className="eyebrow">
                    {fmt(a.date)}. {a.readingMinutes} minute read.
                  </p>
                  <h2>
                    <Link href={`/writing/${a.slug}`}>{a.title}</Link>
                  </h2>
                  <p>{a.standfirst}</p>
                </li>
              ))}
            </ul>
            <p className="article-foot">
              <Link href="/">Home</Link> <a href="/feed.xml">RSS feed</a>
            </p>
          </div>
        </article>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Writing', path: '/writing' }])) }} />
    </>
  )
}
