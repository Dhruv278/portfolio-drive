// What happens to an answer before a visitor sees it. All pure. The order in guardAnswer matters:
// a leak is replaced before anything else, then sources come off, then numbers are checked.
export type Guarded = { answer: string; sources: string[]; flags: string[] }

export function parseSources(answer: string, titles: readonly string[]): { body: string; sources: string[]; hadLine: boolean } {
  const lines = answer.trimEnd().split('\n')
  let idx = -1
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^\s*sources?\s*:/i.test(lines[i])) {
      idx = i
      break
    }
  }
  if (idx < 0) return { body: answer.trim(), sources: [], hadLine: false }
  const list = lines[idx].replace(/^\s*sources?\s*:/i, '')
  const byLower = new Map(titles.map((t) => [t.toLowerCase(), t]))
  const sources = list
    .split(/[,;]/)
    .map((s) => s.trim().replace(/\.$/, '').toLowerCase())
    .filter((s) => s && s !== 'none')
    .map((s) => byLower.get(s))
    .filter((s): s is string => !!s)
  return { body: lines.slice(0, idx).join('\n').trim(), sources: [...new Set(sources)], hadLine: true }
}

const words = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N} ]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)

export function hasPromptLeak(answer: string, rules: string, run = 12): boolean {
  const r = words(rules)
  const hay = ` ${words(answer).join(' ')} `
  for (let i = 0; i + run <= r.length; i++) if (hay.includes(` ${r.slice(i, i + run).join(' ')} `)) return true
  return false
}

const NUM = /\d[\d,.]*\d|\d/g
const normalize = (n: string) => n.replace(/[,.]+$/, '').replace(/,/g, '')

// Numbers of two or more digits in the answer that never appear in the known text.
export function unknownNumbers(answer: string, known: string): string[] {
  const knownSet = new Set((known.match(NUM) ?? []).map(normalize))
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of answer.match(NUM) ?? []) {
    const n = normalize(raw)
    if (n.replace(/\D/g, '').length < 2 || seen.has(n)) continue
    seen.add(n)
    if (!knownSet.has(n)) out.push(n)
  }
  return out
}

export function trimLength(answer: string, max = 1200): string {
  if (answer.length <= max) return answer
  const cut = answer.slice(0, max)
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('.\n'), cut.endsWith('.') ? cut.length - 1 : -1)
  return end > max / 4 ? cut.slice(0, end + 1) : cut.trimEnd()
}

// The site's writing rules: no dashes as punctuation, no semicolons, and plain text, so markdown
// emphasis and headings are removed. Ranges become "to".
export function fixTone(answer: string): string {
  return answer
    .replace(/\*\*|__/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/(\d)\s*[–—-]\s*(\d)/g, '$1 to $2')
    .replace(/\s*[–—]\s*/g, ', ')
    .replace(/ - /g, ', ')
    .replace(/;/g, ',')
}

export function guardAnswer(raw: string, ctx: { rules: string; titles: readonly string[]; known: string; lines: { decline: string; unverified: string } }): Guarded {
  if (hasPromptLeak(raw, ctx.rules)) return { answer: ctx.lines.decline, sources: [], flags: ['leak'] }
  const flags: string[] = []
  const { body, sources, hadLine } = parseSources(raw, ctx.titles)
  if (!hadLine) flags.push('no-sources')
  const bad = unknownNumbers(body, ctx.known)
  if (bad.length) return { answer: ctx.lines.unverified, sources: [], flags: [`number:${bad.join('|')}`] }
  return { answer: fixTone(trimLength(body)), sources, flags }
}
