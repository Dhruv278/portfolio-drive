import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { identity } from '@/content/profile'
import { articles } from '@/content/writing'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const a = articles.find((x) => x.slug === slug)
  return a ? { title: `${a.title} ${identity.name}`, description: a.standfirst } : {}
}

export default async function WritingPage({ params }: Props) {
  const { slug } = await params
  const a = articles.find((x) => x.slug === slug)
  if (!a) notFound()
  const date = new Date(a.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  return (
    <>
      <header className="topbar">
        <Link className="wordmark" href="/">
          {identity.name}
        </Link>
        <nav className="actions" aria-label="Site">
          <Link className="btn" href="/#writing">
            Writing
          </Link>
          <Link className="btn" href="/resume">
            Resume
          </Link>
        </nav>
      </header>
      <main id="content" className="home">
        <article className="article">
          <div className="wrap">
            <p className="eyebrow">
              {date}. {a.readingMinutes} minute read.
              {a.draft ? ' Draft, under review.' : ''}
            </p>
            <h1>{a.title}</h1>
            <p className="standfirst">{a.standfirst}</p>
            {a.sections.map((s) => (
              <section key={s.heading}>
                <h2>{s.heading}</h2>
                {s.paragraphs.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
                {s.list && (
                  <ul>
                    {s.list.map((li) => (
                      <li key={li.slice(0, 40)}>{li}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
            <p className="article-foot">
              <Link href="/#writing">All writing</Link> <Link href="/">Home</Link>
            </p>
          </div>
        </article>
      </main>
    </>
  )
}
