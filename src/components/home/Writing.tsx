import Link from 'next/link'
import { articles } from '@/content/writing'

export function Writing() {
  return (
    <section className="writing" id="writing">
      <div className="wrap">
        <h2 className="section-title">Writing.</h2>
        <ul className="writing-list">
          {articles.map((a) => (
            <li key={a.slug}>
              <Link href={`/writing/${a.slug}`}>
                <b>{a.title}</b>
                <span>{a.standfirst}</span>
                <small>
                  {new Date(a.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}. {a.readingMinutes} minute read.{a.draft ? ' Draft.' : ''}
                </small>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
