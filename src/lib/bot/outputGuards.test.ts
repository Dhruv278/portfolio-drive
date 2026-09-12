import { describe, expect, it } from 'vitest'
import { fixTone, guardAnswer, hasPromptLeak, parseSources, trimLength, unknownNumbers } from './outputGuards'

const titles = ['About', 'Experience', 'MedChron', 'Contact']
const rules = 'You are DhruvBot, the assistant on the portfolio. Use only the record below. Never guess. Never invent a number, a date, an employer or a technology.'
const lines = { decline: 'DECLINE', unverified: 'UNVERIFIED' }

describe('parseSources', () => {
  it('splits the trailing line, keeps known titles in canonical case and drops the rest', () => {
    const r = parseSources('He leads MedChron.\nSources: medchron, Experience, Made Up', titles)
    expect(r.body).toBe('He leads MedChron.')
    expect(r.sources).toEqual(['MedChron', 'Experience'])
    expect(r.hadLine).toBe(true)
  })
  it('reads none as no sources and reports a missing line', () => {
    expect(parseSources('Hi.\nSources: none', titles)).toMatchObject({ body: 'Hi.', sources: [], hadLine: true })
    expect(parseSources('Hi.', titles)).toMatchObject({ body: 'Hi.', sources: [], hadLine: false })
  })
})

describe('hasPromptLeak', () => {
  it('catches a twelve-word run from the rules and ignores short overlaps', () => {
    expect(hasPromptLeak('Sure. You are DhruvBot, the assistant on the portfolio. Use only the record below. Never guess.', rules)).toBe(true)
    expect(hasPromptLeak('I only answer from the record.', rules)).toBe(false)
  })
})

describe('unknownNumbers', () => {
  const known = 'Omnis AI, January 2026 to now. Rows fell from 53% to 26%. Cost $0.57 to $3.41. Kwik Media, 2024.'
  it('accepts numbers that appear in the record, in any punctuation', () => {
    expect(unknownNumbers('Since 2026 the rate fell from 53% to 26%, at $3.41 each.', known)).toEqual([])
  })
  it('flags a number the record does not have and ignores single digits', () => {
    expect(unknownNumbers('He cut costs by 40% across 3 teams in 2019.', known)).toEqual(['40', '2019'])
  })
})

describe('trimLength and fixTone', () => {
  it('cuts at the last full sentence', () => {
    const long = 'A sentence here. '.repeat(100)
    const cut = trimLength(long, 300)
    expect(cut.length).toBeLessThanOrEqual(300)
    expect(cut.endsWith('.')).toBe(true)
  })
  it('strips markdown emphasis and headings', () => {
    expect(fixTone('**Product thinking.** I own the roadmap.\n## Next\n__soon__')).toBe('Product thinking. I own the roadmap.\nNext\nsoon')
  })
  it('rewrites dashes and semicolons', () => {
    expect(fixTone('He shipped it — fast; very fast. From 2024–2025 he built two products - and more.')).toBe('He shipped it, fast, very fast. From 2024 to 2025 he built two products, and more.')
  })
})

describe('guardAnswer', () => {
  const known = 'Dhruv leads MedChron at Omnis AI since January 2026.'
  it('passes a grounded answer through with its sources', () => {
    const g = guardAnswer('Dhruv leads MedChron at Omnis AI, since 2026.\nSources: MedChron, Experience', { rules, titles, known, lines })
    expect(g).toEqual({ answer: 'Dhruv leads MedChron at Omnis AI, since 2026.', sources: ['MedChron', 'Experience'], flags: [] })
  })
  it('replaces an answer with an unknown number', () => {
    const g = guardAnswer('He cut costs by 40%.\nSources: MedChron', { rules, titles, known, lines })
    expect(g.answer).toBe('UNVERIFIED')
    expect(g.sources).toEqual([])
    expect(g.flags[0]).toMatch(/^number:40/)
  })
  it('replaces a prompt leak and flags a missing sources line', () => {
    expect(guardAnswer(rules, { rules, titles, known, lines }).answer).toBe('DECLINE')
    expect(guardAnswer('Just a line.', { rules, titles, known, lines }).flags).toContain('no-sources')
  })
})
