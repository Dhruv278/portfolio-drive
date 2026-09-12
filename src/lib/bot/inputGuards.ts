// Everything that happens to a request before the model sees it. Pure functions, so every rule has a test.
import { hasOverride } from './prompt'

export type Turn = { role: 'user' | 'assistant'; content: string }
export type Validated = { ok: true; turns: Turn[]; flagged: boolean } | { ok: false; status: 400; reason: 'shape' | 'content' }

export const LIMITS = { maxMessages: 12, maxChars: 600, maxTotal: 4000, keepTurns: 6 } as const

const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
const URL_RE = /https?:\/\/|www\./i

export function checkOrigin(origin: string | null, allowed: readonly string[]): boolean {
  return !!origin && allowed.includes(origin)
}

// True when fewer than half the non-space characters are letters.
export function mostlySymbols(text: string): boolean {
  const letters = (text.match(/\p{L}/gu) ?? []).length
  return letters < text.replace(/\s/g, '').length / 2
}

export function validateMessages(input: unknown): Validated {
  const fail = (reason: 'shape' | 'content'): Validated => ({ ok: false, status: 400, reason })
  if (!input || typeof input !== 'object' || !Array.isArray((input as { messages?: unknown }).messages)) return fail('shape')
  const raw = (input as { messages: unknown[] }).messages
  if (raw.length < 1 || raw.length > LIMITS.maxMessages) return fail('shape')
  const turns: Turn[] = []
  for (const m of raw) {
    if (!m || typeof m !== 'object') return fail('shape')
    const { role, content } = m as { role?: unknown; content?: unknown }
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return fail('shape')
    const text = content.replace(CONTROL, '').trim()
    if (text.length < 1 || text.length > LIMITS.maxChars) return fail('shape')
    turns.push({ role, content: text })
  }
  for (let i = 1; i < turns.length; i++) if (turns[i].role === turns[i - 1].role) return fail('shape')
  if (turns[turns.length - 1].role !== 'user') return fail('shape')
  if (turns.reduce((n, t) => n + t.content.length, 0) > LIMITS.maxTotal) return fail('shape')
  const last = turns[turns.length - 1].content
  if (URL_RE.test(last) || mostlySymbols(last)) return fail('content')
  const previousUser = turns.slice(0, -1).filter((t) => t.role === 'user').pop()
  if (previousUser && previousUser.content === last) return fail('content')
  const kept = turns.slice(-LIMITS.keepTurns)
  while (kept.length && kept[0].role !== 'user') kept.shift()
  return { ok: true, turns: kept, flagged: hasOverride(last) }
}
