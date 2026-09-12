import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'
import { identity } from '@/content/profile'
import { seo } from '@/content/seo'
import { jsonLd, layoutGraph } from '@/lib/seo'
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

const fullTitle = seo.titles.home

// Search Console and Bing Webmaster Tools confirm ownership through these tags once the owner
// creates the properties. Without the variables nothing is emitted.
const google = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
const bing = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
const verification: Metadata['verification'] = {
  ...(google ? { google } : {}),
  ...(bing ? { other: { 'msvalidate.01': bing } } : {}),
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: fullTitle,
  description: seo.descriptions.home,
  alternates: { canonical: '/', types: { 'application/rss+xml': '/feed.xml' } },
  verification,
  openGraph: {
    title: fullTitle,
    description: seo.descriptions.home,
    type: 'profile',
    firstName: identity.first,
    lastName: identity.last,
    username: identity.github.label,
    url: '/',
    siteName: identity.name,
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: fullTitle }],
  },
  twitter: { card: 'summary_large_image', title: fullTitle, description: seo.descriptions.home, images: ['/og.jpg'] },
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(layoutGraph()) }} />
      </body>
    </html>
  )
}
