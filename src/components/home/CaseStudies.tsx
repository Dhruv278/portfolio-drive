import Image from 'next/image'
import { home } from '@/content/profile'

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
            <figure className={`case-art ${c.artefact.kind}`}>
              {c.artefact.kind === 'image' ? (
                <Image src={c.artefact.src} alt={c.artefact.alt} width={1280} height={800} sizes="(max-width: 900px) 90vw, 40vw" />
              ) : (
                <div className="pending-box" aria-hidden="true" />
              )}
              <figcaption>{c.artefact.caption}</figcaption>
            </figure>
          </article>
        ))}
      </div>
    </section>
  )
}
