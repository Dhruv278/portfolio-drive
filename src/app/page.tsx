import Link from 'next/link'
import { CaseStudies } from '@/components/home/CaseStudies'
import { Contact } from '@/components/home/Contact'
import { HeroScene } from '@/components/home/HeroScene'
import { PlatformsList } from '@/components/home/PlatformsList'
import { ProofStrip } from '@/components/home/ProofStrip'
import { Writing } from '@/components/home/Writing'
import { home, identity } from '@/content/profile'

// The proof-first home page. The drive is the hero and lives in full at /drive.
export default function Page() {
  return (
    <>
      <header className="topbar">
        <a className="wordmark" href="#top">
          {identity.name}
        </a>
        <nav className="actions" aria-label="Site">
          <Link className="btn" href="/drive">
            Drive
          </Link>
          <Link className="btn" href="/resume">
            Resume
          </Link>
          <a className="btn primary" href={identity.resumePdf} download>
            PDF
          </a>
        </nav>
      </header>
      <main id="content" className="home">
        <section className="hero-scene" id="top">
          <HeroScene />
          <div className="hero-copy">
            <h1>
              <span>{identity.first}</span> <span>{identity.last}</span>
            </h1>
            <p className="line">{home.hero.line}</p>
            <p className="meta">
              <span>{home.hero.meta}</span>
            </p>
            <div className="actions">
              <a className="btn primary" href="#proof">
                {home.hero.seeProof}
              </a>
              <Link className="btn" href="/drive">
                {home.hero.takeDrive}
              </Link>
            </div>
          </div>
        </section>
        <ProofStrip />
        <CaseStudies />
        <PlatformsList />
        <Writing />
        <Contact />
      </main>
    </>
  )
}
