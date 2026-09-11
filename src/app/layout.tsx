import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'
import { identity } from '@/content/profile'
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

export const metadata: Metadata = {
  title: `${identity.name}, ${identity.shortHeadline}`,
  description: `${identity.headline}. ${identity.location}. ${identity.availability}.`,
  openGraph: {
    title: identity.name,
    description: identity.headline,
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#DCEAF4',
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
      </body>
    </html>
  )
}
