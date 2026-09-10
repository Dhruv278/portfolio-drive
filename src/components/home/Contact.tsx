import { home, stops } from '@/content/profile'

export function Contact() {
  const stop = stops.find((s) => s.kind === 'contact')
  if (!stop || stop.kind !== 'contact') return null
  return (
    <section className="contact-home" id="contact">
      <div className="wrap">
        <h2 className="section-title">{home.contactHeading}</h2>
        <p className="contact-line">{home.contactLine}</p>
        <div className="contact">
          {stop.links.map((l) => (
            <a key={l.label} href={l.href} {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
              {l.label} <span>{l.value}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
