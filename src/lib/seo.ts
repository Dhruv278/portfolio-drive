import { identity } from '@/content/profile'
import { seo } from '@/content/seo'
import type { Article } from '@/content/writing'
import { SITE_URL } from './site'

// JSON-LD for search engines. One Person entity with a stable id, referenced from the WebSite, the
// home ProfilePage and every Article, so the pages describe one person rather than several.
export const PERSON_ID = `${SITE_URL}/#person`
export const SITE_ID = `${SITE_URL}/#website`
const IMAGE = `${SITE_URL}/og.jpg`
const CONTEXT = 'https://schema.org'

type Crumb = { name: string; path: string }

export function personJsonLd() {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: identity.name,
    givenName: identity.first,
    familyName: identity.last,
    jobTitle: identity.shortHeadline,
    description: identity.headline,
    url: SITE_URL,
    image: IMAGE,
    email: `mailto:${identity.email}`,
    address: { '@type': 'PostalAddress', addressLocality: 'Surat', addressRegion: 'Gujarat', addressCountry: 'IN' },
    sameAs: [identity.linkedin.href, identity.github.href],
    worksFor: { '@type': 'Organization', name: seo.employer },
    alumniOf: { '@type': 'CollegeOrUniversity', name: seo.school },
    knowsAbout: [...seo.knowsAbout],
  }
}

export function siteJsonLd() {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: SITE_URL,
    name: identity.name,
    alternateName: seo.siteAlternateName,
    description: seo.descriptions.home,
    inLanguage: 'en',
    publisher: { '@id': PERSON_ID },
  }
}

// Emitted by the root layout on every page.
export function layoutGraph() {
  return { '@context': CONTEXT, '@graph': [siteJsonLd(), personJsonLd()] }
}

// The home page is the profile page for the person.
export function profilePageJsonLd() {
  return {
    '@context': CONTEXT,
    '@type': 'ProfilePage',
    '@id': `${SITE_URL}/#profile`,
    url: `${SITE_URL}/`,
    name: seo.titles.home,
    description: seo.descriptions.home,
    inLanguage: 'en',
    isPartOf: { '@id': SITE_ID },
    mainEntity: personJsonLd(),
  }
}

const words = (a: Article) => a.sections.reduce((n, s) => n + [...s.paragraphs, ...(s.list ?? [])].join(' ').split(/\s+/).length, 0)

export function articleJsonLd(a: Article) {
  const url = `${SITE_URL}/writing/${a.slug}`
  const author = { '@type': 'Person', '@id': PERSON_ID, name: identity.name, url: SITE_URL }
  return {
    '@context': CONTEXT,
    '@type': 'Article',
    '@id': url,
    url,
    mainEntityOfPage: url,
    headline: a.title,
    description: a.standfirst,
    datePublished: a.date,
    dateModified: a.date,
    inLanguage: 'en',
    image: IMAGE,
    wordCount: words(a),
    author,
    publisher: author,
    isPartOf: { '@id': SITE_ID },
  }
}

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: `${SITE_URL}${c.path}` })),
  }
}

// Serialized for a <script type="application/ld+json">. The only character that could close the
// script early is escaped.
export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
