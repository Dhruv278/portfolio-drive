import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Starfield } from '@/components/track/Starfield'
import { TrackScene } from '@/components/track/TrackScene'
import { home, identity, resume, skillGroups, stops } from '@/content/profile'
import { articles } from '@/content/writing'

export const metadata: Metadata = {
  title: `${identity.name}, the track`,
  description: `${identity.headline}. ${identity.location}. ${identity.availability}.`,
}

// The 2D track home: a dark instrument-panel page where a car follows a road through every
// checkpoint of the resume. The 3D drive stays one click away.
export default function TrackPage() {
  const medchron = stops.find((s) => s.kind === 'bullets')
  const products = stops.find((s) => s.kind === 'cards')
  const platforms = stops.find((s) => s.kind === 'platforms')
  const contact = stops.find((s) => s.kind === 'contact')
  const total = 9
  const cp = (n: number, rest: string) => `Checkpoint ${String(n).padStart(2, '0')} of ${String(total).padStart(2, '0')}. ${rest}`

  return (
    <div className="tp">
      <div className="tp-aurora a" aria-hidden="true" />
      <div className="tp-aurora b" aria-hidden="true" />
      <header className="tp-hud top">
        <a className="tp-wordmark" href="#top">
          {identity.name}
        </a>
        <nav className="tp-actions" aria-label="Site">
          <Link className="tp-btn" href="/drive">
            3D drive
          </Link>
          <Link className="tp-btn" href="/resume">
            Resume
          </Link>
          <a className="tp-btn primary" href={identity.resumePdf} download>
            PDF
          </a>
        </nav>
      </header>
      <TrackScene mainId="track-main" stopSelector="section.tp-stop" cardSelector=".tp-card" />
      <main id="track-main" className="tp-main">
        <section className="tp-stop hero left on" id="top" data-name="Start">
          <Starfield />
          <div className="tp-card">
            <p className="tp-eyebrow">{cp(1, 'Start')}</p>
            <h1>
              {identity.first}
              <br />
              {identity.last}
            </h1>
            <p className="tp-lede">{home.hero.line}</p>
            <p className="tp-meta">{home.hero.meta}</p>
            <div className="tp-actions">
              <a className="tp-btn primary" href="#experience">
                Start the drive
              </a>
              <Link className="tp-btn" href="/drive">
                Take the 3D drive
              </Link>
            </div>
          </div>
        </section>

        <section className="tp-stop right" id="experience" data-name="Experience">
          <div className="tp-card wide">
            <p className="tp-eyebrow">{cp(2, 'Experience, 2023 to now')}</p>
            <h2>Three roles, one thread: products that handle other people&apos;s data.</h2>
            <ol className="tp-roles">
              {resume.experience.map((r) => (
                <li key={r.title}>
                  <div className="tp-role-head">
                    <b>{r.title}</b>
                    <span>{r.dates}</span>
                  </div>
                  <small>{r.where}</small>
                  <p>{r.bullets[0]}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {medchron && medchron.kind === 'bullets' && (
          <section className="tp-stop left" id="medchron" data-name="MedChron">
            <div className="tp-card">
              <p className="tp-eyebrow">{cp(3, 'Omnis AI, January 2026 to now')}</p>
              <h2>{medchron.heading}</h2>
              <p>{medchron.intro}</p>
              <ul className="tp-bullets">
                {medchron.bullets.map((b) => (
                  <li key={b.lead}>
                    <b>{b.lead}</b> {b.text}
                  </li>
                ))}
              </ul>
              <div className="tp-nums">
                {home.proof.slice(0, 2).map((p) => (
                  <div key={p.label}>
                    <b data-from={p.from} data-to={p.to} data-suffix={p.suffix}>
                      {p.from ? `${p.from}${p.suffix} to ${p.to}${p.suffix}` : `${p.to}${p.suffix}`}
                    </b>
                    <span>{p.label}</span>
                  </div>
                ))}
              </div>
              <figure className="tp-figure">
                <Image src="/images/medchron-chronology.webp" alt="Illustrative MedChron chronology screen with page citations and a citation check" width={1280} height={800} sizes="(max-width: 760px) 90vw, 520px" />
                <figcaption>Illustrative screen drawn for this portfolio. Not a product screenshot. Sample data.</figcaption>
              </figure>
              <div className="tp-chips">
                {medchron.stack.map((c) => (
                  <span key={c} className="tp-chip">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {products && products.kind === 'cards' && (
          <section className="tp-stop right" id="products" data-name="Own products">
            <div className="tp-card wide">
              <p className="tp-eyebrow">{cp(4, 'Own products')}</p>
              <h2>{products.heading}</h2>
              <div className="tp-two">
                {products.cards.map((c) => (
                  <div key={c.title} className="tp-mini">
                    <h3>{c.title}</h3>
                    <p>{c.body}</p>
                    <div className="tp-chips">
                      {c.chips.map((ch) => (
                        <span key={ch} className="tp-chip">
                          {ch}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="tp-clips" aria-label="Three shorts rendered by the pipeline, sound off">
                {[1, 2, 3].map((n) => (
                  <video key={n} src={`/media/short-${n}.mp4`} poster={`/media/short-${n}.webp`} muted loop autoPlay playsInline preload="none" />
                ))}
              </div>
              <div className="tp-nums">
                <div>
                  <b>$0.57 to $3.41</b>
                  <span>Cost per video across three quality tiers</span>
                </div>
                <div>
                  <b data-from={0} data-to={7} data-suffix="">
                    7
                  </b>
                  <span>Shorts rendered unattended in one run, April 2026</span>
                </div>
              </div>
              <p className="tp-links">
                <a href="https://github.com/Dhruv278/Agentflow-frontend" target="_blank" rel="noopener noreferrer">
                  AgentFlow frontend repository
                </a>
                <Link href="/#video">The 59-node workflow, drawn</Link>
              </p>
            </div>
          </section>
        )}

        {platforms && platforms.kind === 'platforms' && (
          <section className="tp-stop left" id="platforms" data-name="Platforms">
            <div className="tp-card wide">
              <p className="tp-eyebrow">{cp(5, 'Delivered platforms, 2024 to 2026')}</p>
              <h2>{platforms.heading}</h2>
              <ul className="tp-list">
                {platforms.platforms.map((p) => (
                  <li key={p.title}>
                    <b>{p.title}</b>
                    {p.body}
                    <small>{p.chips.join(', ')}</small>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section className="tp-stop right" id="skills" data-name="Skills">
          <div className="tp-card wide">
            <p className="tp-eyebrow">{cp(6, 'Skills, all shipped to production')}</p>
            <h2>Everything here has shipped.</h2>
            <div className="tp-skills">
              {skillGroups.map((g) => (
                <div key={g.label} className="tp-skillgroup">
                  <h3>{g.label}</h3>
                  <div className="tp-chips">
                    {g.items.map((s) => (
                      <span key={s} className="tp-chip">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="tp-stop left" id="education" data-name="Education">
          <div className="tp-card">
            <p className="tp-eyebrow">{cp(7, 'Education and awards')}</p>
            <h2>{resume.education.degree}</h2>
            <p>{resume.education.school}</p>
            <p className="tp-muted">{resume.education.awards}</p>
          </div>
        </section>

        <section className="tp-stop right" id="writing" data-name="Writing">
          <div className="tp-card">
            <p className="tp-eyebrow">{cp(8, 'Writing')}</p>
            <h2>Two write-ups.</h2>
            <ul className="tp-list">
              {articles.map((a) => (
                <li key={a.slug}>
                  <Link href={`/writing/${a.slug}`}>
                    <b>{a.title}</b>
                  </Link>
                  {a.standfirst}
                  <small>
                    {a.readingMinutes} minute read.{a.draft ? ' Draft.' : ''}
                  </small>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {contact && contact.kind === 'contact' && (
          <section className="tp-stop left" id="contact" data-name="Contact">
            <div className="tp-card">
              <p className="tp-eyebrow">{cp(9, 'Contact')}</p>
              <h2>{contact.heading}</h2>
              <p className="tp-muted">{home.contactLine}</p>
              <div className="tp-contact">
                {contact.links.map((l) => (
                  <a key={l.label} href={l.href} {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                    {l.label} <span>{l.value}</span>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}
        <div className="tp-end" />
      </main>
    </div>
  )
}
