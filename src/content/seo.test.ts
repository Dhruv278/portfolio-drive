import { describe, expect, it } from 'vitest'
import { seo } from './seo'

describe('search snippets', () => {
  it('keeps every description between 70 and 155 characters so it shows whole', () => {
    for (const [page, text] of Object.entries(seo.descriptions)) {
      expect(text.length, `${page}: ${text.length}`).toBeLessThanOrEqual(155)
      expect(text.length, `${page}: ${text.length}`).toBeGreaterThanOrEqual(70)
      expect(text.endsWith('.'), page).toBe(true)
      expect(text.includes('  '), page).toBe(false)
    }
  })

  it('keeps fixed page titles under 60 characters and carrying the name', () => {
    for (const [page, text] of Object.entries(seo.titles)) {
      expect(text.length, `${page}: ${text}`).toBeLessThanOrEqual(60)
      expect(text, page).toContain('Dhruv Gopani')
    }
  })

  it('lists at least ten short topics for the Person entity', () => {
    expect(seo.knowsAbout.length).toBeGreaterThanOrEqual(10)
    for (const k of seo.knowsAbout) expect(k.length).toBeLessThanOrEqual(60)
  })
})
