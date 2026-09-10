import { home, stops } from '@/content/profile'

// The six delivered platforms as compact rows: name, one line, stack.
export function PlatformsList() {
  const stop = stops.find((s) => s.kind === 'platforms')
  if (!stop || stop.kind !== 'platforms') return null
  return (
    <section className="platforms-home" id="platforms">
      <div className="wrap">
        <h2 className="section-title">{home.platformsHeading}</h2>
        <ul className="platform-rows">
          {stop.platforms.map((p) => (
            <li key={p.title}>
              <i className="dot" aria-hidden="true" />
              <div>
                <b>{p.title}</b>
                <span>{p.body}</span>
                <small>{p.chips.join(', ')}</small>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
