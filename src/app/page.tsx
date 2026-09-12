import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { HeroRoad } from '@/components/track/HeroRoad'
import { Starfield } from '@/components/track/Starfield'
import { AskBot } from '@/components/bot/AskBot'
import { Clips } from '@/components/track/Clips'
import { TrackScene } from '@/components/track/TrackScene'
import { ViewMemory } from '@/components/ViewMemory'
import { ViewSwitch } from '@/components/ViewSwitch'
import { FinishButton } from '@/components/FinishButton'
import { identity, stops } from '@/content/profile'
import { seo } from '@/content/seo'
import { track } from '@/content/track'
import { articles } from '@/content/writing'
import { jsonLd, profilePageJsonLd } from '@/lib/seo'

export const metadata: Metadata = {
  title: seo.titles.home,
  description: seo.descriptions.home,
}

const TOTAL = 10
const cp = (n: number, rest: string) => `Checkpoint ${String(n).padStart(2, '0')} of ${String(TOTAL).padStart(2, '0')}. ${rest}`

function Chips({ items }: { items: readonly string[] }) {
  return (
    <div className="tp-chips">
      {items.map((c) => (
        <span key={c} className="tp-chip">
          {c}
        </span>
      ))}
    </div>
  )
}

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return href.startsWith('http') ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ) : (
    <Link href={href}>{children}</Link>
  )
}

// Home: a dark instrument-panel page where a car follows a road through ten checkpoints of the resume.
export default function Page() {
  const platforms = stops.find((s) => s.kind === 'platforms')
  const contact = stops.find((s) => s.kind === 'contact')
  const t = track

  return (
    <div className="tp">
      <ViewMemory view="2d" />
      <div className="tp-aurora a" aria-hidden="true" />
      <div className="tp-aurora b" aria-hidden="true" />
      <header className="tp-hud top">
        <a className="tp-wordmark" href="#top">
          {identity.name}
        </a>
        <nav className="tp-actions" aria-label="Site">
          <ViewSwitch current="2d" />
          <Link className="tp-btn" href="/resume">
            Resume
          </Link>
          <a className="tp-btn primary" href={identity.resumePdf} download>
            PDF
          </a>
        </nav>
      </header>
      <TrackScene mainId="content" stopSelector="section.tp-stop" cardSelector=".tp-card" />
      <main id="content" className="tp-main">
        {/* 1 */}
        <section className="tp-stop hero left on" id="top" data-name="Start">
          <Starfield />
          <div className="tp-card">
            <p className="tp-eyebrow">{cp(1, t.hero.eyebrow)}</p>
            <h1>
              {identity.first}
              <br />
              {identity.last}
            </h1>
            <HeroRoad />
            <p className="tp-lede">{t.hero.line}</p>
            <p className="tp-meta">{t.hero.meta}</p>
            <div className="tp-actions">
              <a className="tp-btn primary" href="#why">
                Start the drive
              </a>
              <Link className="tp-btn" href="/drive" prefetch={false}>
                Take the 3D drive
              </Link>
            </div>
            <ul className="tp-tiles">
              {t.hero.tiles.map((x) => (
                <li key={x.title}>
                  <b>{x.title}</b>
                  <span>{x.body}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 2 */}
        <section className="tp-stop right" id="why" data-name="Why me">
          <div className="tp-card wide">
            <p className="tp-eyebrow">{cp(2, 'Why hire me')}</p>
            <h2>{t.why.heading}</h2>
            <p className="tp-intro">{t.why.intro}</p>
            <div className="tp-grid2">
              {t.why.points.map((p) => (
                <div key={p.title} className="tp-point">
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                </div>
              ))}
            </div>
            <h3 className="tp-sub">{t.why.planHeading}</h3>
            <ol className="tp-steps">
              {t.why.plan.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
        </section>

        {/* 3 */}
        <section className="tp-stop left" id="experience" data-name="Experience">
          <div className="tp-card wide">
            <p className="tp-eyebrow">{cp(3, 'Experience, 2023 to now')}</p>
            <h2>{t.experience.heading}</h2>
            <ol className="tp-roles">
              {t.experience.roles.map((r) => (
                <li key={r.company}>
                  <div className="tp-role-head">
                    <b>
                      {r.company}
                      <span className="tp-role-title">{r.title}</span>
                    </b>
                    <span>{r.dates}</span>
                  </div>
                  <small>{r.where}</small>
                  <ul className="tp-bullets">
                    {r.points.map((p) => (
                      <li key={p.slice(0, 40)}>{p}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 4 */}
        <section className="tp-stop right" id="medchron" data-name="MedChron">
          <div className="tp-card wide">
            <p className="tp-eyebrow">{cp(4, t.medchron.eyebrow)}</p>
            <h2>{t.medchron.heading}</h2>
            <div className="tp-split">
              <div>
                {t.medchron.what.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
                <p className="tp-role">{t.medchron.role}</p>
              </div>
              <figure className="tp-figure">
                <Image src="/images/medchron-chronology.webp" alt="Illustrative MedChron chronology screen with page citations and a citation check" width={1280} height={800} sizes="(max-width: 760px) 90vw, 360px" />
                <figcaption>Illustrative screen drawn for this portfolio. Not a product screenshot. Sample data.</figcaption>
              </figure>
            </div>
            <div className="tp-grid2 parts">
              {t.medchron.parts.map((p) => (
                <div key={p.title} className="tp-point">
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                </div>
              ))}
            </div>
            <h3 className="tp-sub">Why attorneys can trust it</h3>
            <ul className="tp-bullets">
              {t.medchron.trust.map((p) => (
                <li key={p.slice(0, 40)}>{p}</li>
              ))}
            </ul>
            <Chips items={t.medchron.stack} />
          </div>
        </section>

        {/* 5 */}
        <section className="tp-stop left" id="projects" data-name="Projects">
          <div className="tp-card wide">
            <p className="tp-eyebrow">{cp(5, 'Projects')}</p>
            <h2>{t.projects.heading}</h2>
            <p className="tp-intro">{t.projects.intro}</p>
            <div className="tp-projects">
              {t.projects.items.map((p) => (
                <article key={p.title} className="tp-project">
                  <p className="tp-kind">{p.kind}</p>
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                  {'clips' in p && p.clips && <Clips />}
                  <Chips items={p.stack} />
                  {'link' in p && p.link && (
                    <p className="tp-links">
                      <Ext href={p.link.href}>{p.link.label}</Ext>
                    </p>
                  )}
                </article>
              ))}
            </div>
            <p className="tp-swipe">Swipe for more</p>
          </div>
        </section>

        {/* 6 */}
        {platforms && platforms.kind === 'platforms' && (
          <section className="tp-stop right" id="platforms" data-name="Platforms">
            <div className="tp-card wide">
              <p className="tp-eyebrow">{cp(6, 'Delivered platforms, 2024 to 2026')}</p>
              <h2>{t.platforms.heading}</h2>
              <p className="tp-intro">{t.platforms.intro}</p>
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

        {/* 7 */}
        <section className="tp-stop left" id="skills" data-name="Skills">
          <div className="tp-card wide">
            <p className="tp-eyebrow">{cp(7, 'Skills and how I work')}</p>
            <h2>{t.skills.heading}</h2>
            <div className="tp-skills">
              {t.skills.groups.map((g) => (
                <div key={g.label} className="tp-skillgroup">
                  <h3>{g.label}</h3>
                  <Chips items={g.items} />
                </div>
              ))}
            </div>
            <h3 className="tp-sub">{t.skills.howHeading}</h3>
            <ul className="tp-bullets">
              {t.skills.how.map((h) => (
                <li key={h.slice(0, 40)}>{h}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* 8 */}
        <section className="tp-stop right" id="achievements" data-name="Achievements">
          <div className="tp-card wide">
            <p className="tp-eyebrow">{cp(8, 'Achievements, awards and education')}</p>
            <h2>{t.achievements.heading}</h2>
            <div className="tp-split">
              <div>
                <h3 className="tp-sub first">At work</h3>
                <ul className="tp-bullets">
                  {t.achievements.work.map((a) => (
                    <li key={a.slice(0, 40)}>{a}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="tp-sub first">Awards</h3>
                <ul className="tp-list compact">
                  {t.achievements.awards.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
                <h3 className="tp-sub">Education</h3>
                <p className="tp-muted">{t.achievements.education}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 9 */}
        <section className="tp-stop left" id="writing" data-name="Writing">
          <div className="tp-card wide">
            <p className="tp-eyebrow">{cp(9, 'Writing')}</p>
            <h2>{t.writing.heading}</h2>
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
            <p className="tp-more">
              <Link href="/writing">All writing</Link>
              <a href="/feed.xml">RSS feed</a>
            </p>
          </div>
        </section>

        {/* 10 */}
        {contact && contact.kind === 'contact' && (
          <section className="tp-stop right" id="contact" data-name="Contact">
            <div className="tp-card wide">
              <p className="tp-eyebrow">{cp(10, 'Contact')}</p>
              <div className="tp-split">
                <div>
                  <h2>{t.contact.heading}</h2>
                  <p className="tp-muted">{t.contact.line}</p>
                  <p className="tp-muted">{t.hero.meta}</p>
                </div>
                <div className="tp-contact">
                  {contact.links.map((l) => (
                    <a key={l.label} href={l.href} {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                      {l.label} <span>{l.value}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
        <aside className="tp-finish" aria-label="Switch to the 3D drive">
          <p className="tp-eyebrow">{t.finish.eyebrow}</p>
          <h2>{t.finish.heading}</h2>
          <p>{t.finish.body}</p>
          <FinishButton />
        </aside>
        <div className="tp-end" />
      </main>
      <AskBot page="track" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(profilePageJsonLd()) }} />
    </div>
  )
}
