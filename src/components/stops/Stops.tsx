import type { CSSProperties } from 'react'
import { identity, stops, type StopContent } from '@/content/profile'

// Stagger index for the reveal animation. Read by CSS as var(--i).
const at = (i: number) => ({ '--i': i } as CSSProperties)

function Chips({ items, offset = 0, first }: { items: readonly string[]; offset?: number; first?: 'blue' }) {
  return (
    <div className="chips">
      {items.map((c, i) => (
        <span key={c} className={`chip${first === 'blue' && i === 0 ? ' blue' : ''}`} style={at(offset + i)}>
          {c}
        </span>
      ))}
    </div>
  )
}

function Hero({ stop }: { stop: Extract<StopContent, { kind: 'hero' }> }) {
  return (
    <div className="panel">
      <p className="eyebrow">{stop.eyebrow}</p>
      <h1>
        <span>{identity.first}</span> <span>{identity.last}</span>
      </h1>
      <p className="lede">{stop.lede}</p>
      <p className="meta">
        <span>{stop.meta}</span>
      </p>
      <div className="actions">
        <a className="btn primary" href={identity.resumePdf} download>
          Download resume
        </a>
        <a className="btn" href={`#${stops[1].id}`}>
          Start the drive
        </a>
      </div>
    </div>
  )
}

function Bullets({ stop }: { stop: Extract<StopContent, { kind: 'bullets' }> }) {
  return (
    <div className="panel">
      <p className="eyebrow">{stop.eyebrow}</p>
      <h2>{stop.heading}</h2>
      <p>{stop.intro}</p>
      <ul>
        {stop.bullets.map((b, i) => (
          <li key={b.lead} style={at(i)}>
            <b>{b.lead}</b> {b.text}
          </li>
        ))}
      </ul>
      <Chips items={stop.stack} offset={stop.bullets.length} />
      <Chips items={stop.chips} offset={stop.bullets.length + stop.stack.length} first="blue" />
    </div>
  )
}

function Cards({ stop }: { stop: Extract<StopContent, { kind: 'cards' }> }) {
  return (
    <div className="panel">
      <p className="eyebrow">{stop.eyebrow}</p>
      <h2>{stop.heading}</h2>
      <div className="mini">
        {stop.cards.map((c, i) => (
          <div key={c.title} className="card" style={at(i)}>
            <h3>{c.title}</h3>
            <p>{c.body}</p>
            <Chips items={c.chips} offset={2 + i * 8} />
          </div>
        ))}
      </div>
    </div>
  )
}

function Platforms({ stop }: { stop: Extract<StopContent, { kind: 'platforms' }> }) {
  return (
    <div className="panel wide">
      <p className="eyebrow">{stop.eyebrow}</p>
      <h2>{stop.heading}</h2>
      <ul className="platforms">
        {stop.platforms.map((p, i) => (
          <li key={p.title} style={at(i)}>
            <i className="dot" aria-hidden="true" />
            <div>
              <b>{p.title}</b> {p.body}
              <Chips items={p.chips} offset={0} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Skills({ stop }: { stop: Extract<StopContent, { kind: 'skills' }> }) {
  return (
    <div className="panel skills wide">
      <p className="eyebrow">{stop.eyebrow}</p>
      <h2>{stop.heading}</h2>
      <div className="skillboard">
        {stop.groups.map((g, i) => (
          <div key={g.label} className="skillgroup" style={at(i)}>
            <h3>{g.label}</h3>
            <div className="chips">
              {g.items.map((s) => (
                <span key={s} className="chip">
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="habits">
        <b>How I work.</b> {stop.habits}
      </p>
    </div>
  )
}

function Contact({ stop }: { stop: Extract<StopContent, { kind: 'contact' }> }) {
  return (
    <div className="panel">
      <p className="eyebrow">{stop.eyebrow}</p>
      <h2>{stop.heading}</h2>
      <div className="contact">
        {stop.links.map((l, i) => (
          <a key={l.label} href={l.href} style={at(i)} {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
            {l.label} <span>{l.value}</span>
          </a>
        ))}
      </div>
      <div className="wheel">{stop.wheel}</div>
    </div>
  )
}

function StopBody({ stop }: { stop: StopContent }) {
  switch (stop.kind) {
    case 'hero':
      return <Hero stop={stop} />
    case 'bullets':
      return <Bullets stop={stop} />
    case 'cards':
      return <Cards stop={stop} />
    case 'platforms':
      return <Platforms stop={stop} />
    case 'skills':
      return <Skills stop={stop} />
    case 'contact':
      return <Contact stop={stop} />
  }
}

export function Stops() {
  return (
    <main id="content">
      {stops.map((stop, i) => (
        <section key={stop.id} id={stop.id} className={`stop${i === 0 ? ' hero' : ''}`} data-stop={i} data-name={stop.name}>
          <StopBody stop={stop} />
        </section>
      ))}
      <div id="end" className="end" aria-hidden="true" />
    </main>
  )
}
