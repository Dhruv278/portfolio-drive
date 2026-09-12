import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { bot } from './bot'
import { bannedPatterns, identity, milestones, resume, setPieces, stops } from './profile'
import { seo } from './seo'
import { track } from './track'
import { articles } from './writing'

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out))
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collectStrings(v, out))
  return out
}

describe('profile content', () => {
  const all = collectStrings({ identity, milestones, stops, resume, setPieces, articles, track, seo })

  it('has six stops with unique ids in the agreed order', () => {
    expect(stops.map((s) => s.id)).toEqual(['start', 'medchron', 'products', 'platforms', 'how', 'contact'])
    expect(new Set(stops.map((s) => s.id)).size).toBe(6)
  })

  it('contains no banned words, dashes, semicolons or commit counts', () => {
    const offenders: string[] = []
    for (const text of all) {
      // hrefs and the phone number are exempt from the word rules but not from dash rules
      for (const re of bannedPatterns) {
        if (re.test(text)) offenders.push(`${re} in "${text.slice(0, 80)}"`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('uses US spelling for the words that differ', () => {
    const british = [/\blicence\b/i, /\btravelled\b/i, /\binstalment/i, /\borganisation/i, /\bcategoris/i, /\bspecialis/i, /\bcolour\b/i]
    const offenders = all.filter((t) => british.some((re) => re.test(t)))
    expect(offenders).toEqual([])
  })

  it('keeps the contact details consistent between hero identity and the contact stop', () => {
    const contact = stops.find((s) => s.kind === 'contact')
    expect(contact && contact.kind === 'contact' ? contact.links.map((l) => l.href) : []).toEqual([
      `mailto:${identity.email}`,
      identity.linkedin.href,
      identity.github.href,
      identity.resumePdf,
    ])
  })

  it('gives the MedChron set piece six chronology cards with page citations and three counters', () => {
    expect(setPieces.medchron.chronology).toHaveLength(6)
    for (const c of setPieces.medchron.chronology) expect(c.page).toMatch(/^p\. \d+$/)
    expect(setPieces.medchron.counters.map((c) => c.to)).toEqual([26, 28, 3])
    expect(setPieces.garage.door).toBe('DHRUV GOPANI')
  })

  it('numbers the eyebrows two to six for the non-hero stops', () => {
    const nums = stops.filter((s) => s.kind !== 'hero').map((s) => s.eyebrow.match(/^Stop (\d) of 6/)?.[1])
    expect(nums).toEqual(['2', '3', '4', '5', '6'])
  })

  it('keeps the bot copy and the knowledge markdown inside the writing rules', () => {
    const dir = join(process.cwd(), 'src', 'content', 'knowledge')
    const files = readdirSync(dir).filter((f) => f.endsWith('.md'))
    expect(files.sort()).toEqual(['certifications.md', 'faq.md', 'how-medchron-works.md', 'improving-medchron.md', 'numbers.md', 'working-style.md'])
    const texts = [...collectStrings(bot), ...files.map((f) => readFileSync(join(dir, f), 'utf8'))]
    for (const f of files) expect(readFileSync(join(dir, f), 'utf8').startsWith('# ')).toBe(true)
    for (const text of texts) {
      for (const re of bannedPatterns) {
        expect(text, `${re} in: ${text.slice(0, 80)}`).not.toMatch(re)
      }
    }
    expect(bot.starters).toHaveLength(4)
  })
})
