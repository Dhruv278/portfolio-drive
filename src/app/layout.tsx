import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'
import { identity } from '@/content/profile'
import { SITE_URL } from '@/lib/site'
import './globals.css'

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['opsz'],
  variable: '--font-display',
  display: 'swap',
})

const body = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-mono',
  display: 'swap',
})

const fullTitle = `${identity.name}, ${identity.shortHeadline}`

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: fullTitle,
  description: `${identity.headline}. ${identity.location}. ${identity.availability}.`,
  alternates: { canonical: '/' },
  openGraph: {
    title: fullTitle,
    description: identity.headline,
    type: 'website',
    url: '/',
    siteName: identity.name,
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: fullTitle }],
  },
  twitter: { card: 'summary_large_image', title: fullTitle, description: identity.headline, images: ['/og.jpg'] },
}

// Structured data for search engines: one person, one job, the profiles that confirm it.
const person = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: identity.name,
  jobTitle: identity.shortHeadline,
  url: SITE_URL,
  email: `mailto:${identity.email}`,
  address: { '@type': 'PostalAddress', addressLocality: 'Surat', addressCountry: 'IN' },
  sameAs: [identity.linkedin.href, identity.github.href],
  worksFor: { '@type': 'Organization', name: 'Omnis AI' },
}

export const viewport: Viewport = {
  themeColor: '#070f22',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <a className="skip" href="#content">
          Skip to content
        </a>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />
      </body>
    </html>
  )
}
