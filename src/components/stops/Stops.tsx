import { identity, stops, type StopContent } from '@/content/profile'

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
        {stop.bullets.map((b) => (
          <li key={b.lead}>
            <b>{b.lead}</b> {b.text}
          </li>
        ))}
      </ul>
      <div className="chips">
        {stop.chips.map((c, i) => (
          <span key={c} className={`chip${i === 0 ? ' blue' : ''}`}>
            {c}
          </span>
        ))}
      </div>
    </div>
  )
}

function Cards({ stop }: { stop: Extract<StopContent, { kind: 'cards' }> }) {
  return (
    <div className="panel">
      <p className="eyebrow">{stop.eyebrow}</p>
      <h2>{stop.heading}</h2>
      <div className="mini">
        {stop.cards.map((c) => (
          <div key={c.title}>
            <h3>{c.title}</h3>
            <p>{c.body}</p>
          </div>
        ))}
      </div>
      <div className="chips">
        {stop.chips.map((c) => (
          <span key={c} className="chip">
            {c}
          </span>
        ))}
      </div>
    </div>
  )
}

function Platforms({ stop }: { stop: Extract<StopContent, { kind: 'platforms' }> }) {
  return (
    <div className="panel">
      <p className="eyebrow">{stop.eyebrow}</p>
      <h2>{stop.heading}</h2>
      <ul className="platforms">
        {stop.platforms.map((p) => (
          <li key={p.title}>
            <i className="dot" aria-hidden="true" />
            <div>
              <b>{p.title}</b> {p.body}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Paragraphs({ stop }: { stop: Extract<StopContent, { kind: 'paragraphs' }> }) {
  return (
    <div className="panel skills">
      <p className="eyebrow">{stop.eyebrow}</p>
      <h2>{stop.heading}</h2>
      {stop.paragraphs.map((p) => (
        <p key={p.lead}>
          <b>{p.lead}</b> {p.text}
        </p>
      ))}
    </div>
  )
}

function Contact({ stop }: { stop: Extract<StopContent, { kind: 'contact' }> }) {
  return (
    <div className="panel">
      <p className="eyebrow">{stop.eyebrow}</p>
      <h2>{stop.heading}</h2>
      <div className="contact">
        {stop.links.map((l) => (
          <a key={l.label} href={l.href} {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
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
    case 'paragraphs':
      return <Paragraphs stop={stop} />
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
