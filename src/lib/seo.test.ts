import { describe, expect, it } from 'vitest'
import { identity } from '@/content/profile'
import { articles } from '@/content/writing'
import { articleJsonLd, breadcrumbJsonLd, jsonLd, layoutGraph, PERSON_ID, personJsonLd, profilePageJsonLd } from './seo'
import { SITE_URL } from './site'

describe('structured data', () => {
  it('describes one person with the profiles that confirm the identity', () => {
    const p = personJsonLd()
    expect(p['@id']).toBe(PERSON_ID)
    expect(p.sameAs).toEqual([identity.linkedin.href, identity.github.href])
    expect(p.alumniOf.name).toContain('Sarvajanik')
    expect(p.worksFor.name).toBe('Omnis AI')
    expect(p.knowsAbout.length).toBeGreaterThan(8)
    expect(p.image).toBe(`${SITE_URL}/og.jpg`)
  })

  it('emits a WebSite and the Person on every page, linked by id', () => {
    const g = layoutGraph()
    expect(g['@graph'].map((n) => n['@type'])).toEqual(['WebSite', 'Person'])
    expect(g['@graph'][0]).toMatchObject({ publisher: { '@id': PERSON_ID } })
  })

  it('makes the home page a ProfilePage whose main entity is the same person', () => {
    const p = profilePageJsonLd()
    expect(p['@type']).toBe('ProfilePage')
    expect(p.mainEntity).toMatchObject({ '@type': 'Person', '@id': PERSON_ID })
    expect(p.url).toBe(`${SITE_URL}/`)
  })

  it('describes each write-up as an Article by the same author with dates and a word count', () => {
    for (const a of articles) {
      const j = articleJsonLd(a)
      expect(j).toMatchObject({ '@type': 'Article', headline: a.title, datePublished: a.date, author: { '@id': PERSON_ID }, url: `${SITE_URL}/writing/${a.slug}` })
      expect(j.wordCount).toBeGreaterThan(200)
    }
  })

  it('numbers breadcrumbs from one with absolute item URLs', () => {
    const b = breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Writing', path: '/writing' },
    ])
    expect(b.itemListElement.map((x) => x.position)).toEqual([1, 2])
    expect(b.itemListElement[1].item).toBe(`${SITE_URL}/writing`)
  })

  it('serializes without a character that could close the script tag', () => {
    expect(jsonLd({ a: '</script>' })).not.toContain('</script>')
    expect(JSON.parse(jsonLd({ a: '</script>' }))).toEqual({ a: '</script>' })
  })
})
