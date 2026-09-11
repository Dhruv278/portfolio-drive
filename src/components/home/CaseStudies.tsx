import Image from 'next/image'
import { home, type Artefact as ArtefactSpec } from '@/content/profile'

// An artefact frame: a real screenshot, a pair of screenshots, muted looping clips, or a drawing.
function Artefact({ a }: { a: ArtefactSpec }) {
  return (
    <figure className={`case-art ${a.kind}`}>
      {a.kind === 'image' && <Image src={a.src} alt={a.alt} width={a.width ?? 1280} height={a.height ?? 800} sizes="(max-width: 900px) 90vw, 40vw" />}
      {a.kind === 'images' && (
        <div className="art-pair">
          {a.items.map((it) => (
            <Image key={it.src} src={it.src} alt={it.alt} width={1280} height={800} sizes="(max-width: 900px) 90vw, 20vw" />
          ))}
        </div>
      )}
      {a.kind === 'clips' && (
        <div className="art-clips">
          {a.items.map((it) => (
            <video key={it.src} src={it.src} poster={it.poster} muted loop autoPlay playsInline preload="none" aria-label={it.alt} />
          ))}
        </div>
      )}
      {a.kind === 'svg' && (
        <>
          <div className="scroller" tabIndex={0}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.src} alt={a.alt} loading="lazy" />
          </div>
          <div className="hint">Scroll sideways to follow the whole run.</div>
        </>
      )}
      {a.kind === 'pending' && <div className="pending-box" aria-hidden="true" />}
      <figcaption>{a.caption}</figcaption>
    </figure>
  )
}

// Four case studies: the problem, the call, what shipped, what it measured, and an artefact.
export function CaseStudies() {
  return (
    <section id="proof" className="cases">
      <div className="wrap">
        <h2 className="section-title">{home.casesHeading}</h2>
        {home.caseStudies.map((c, i) => (
          <article key={c.id} id={c.id} className={`case${i % 2 ? ' flip' : ''}`} data-testid="case">
            <div className="case-text">
              <h3>{c.title}</h3>
              <p>
                <b>The problem.</b> {c.problem}
              </p>
              <p>
                <b>The call.</b> {c.decision}
              </p>
              <p>
                <b>What shipped.</b> {c.shipped}
              </p>
              <p className="result">
                <b>What it measured.</b> {c.result}
              </p>
              {c.figures && (
                <table className="figures">
                  <thead>
                    <tr>
                      <th scope="col">
                        <span className="sr-only">Measure</span>
                      </th>
                      <th scope="col">Before</th>
                      <th scope="col">After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.figures.map(([label, before, after]) => (
                      <tr key={label}>
                        <th scope="row">{label}</th>
                        <td>{before}</td>
                        <td>{after}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="chips">
                {c.stack.map((s) => (
                  <span key={s} className="chip">
                    {s}
                  </span>
                ))}
              </div>
              {c.links.length > 0 && (
                <p className="links">
                  {c.links.map((l) =>
                    l.href.startsWith('http') ? (
                      <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
                        {l.label}
                      </a>
                    ) : (
                      <a key={l.href} href={l.href}>
                        {l.label}
                      </a>
                    ),
                  )}
                </p>
              )}
            </div>
            <Artefact a={c.artefact} />
            {c.workflow && (
              <div className="case-wide">
                <Artefact a={c.workflow} />
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
