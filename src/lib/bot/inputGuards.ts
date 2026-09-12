// Everything that happens to a request before the model sees it. Pure functions, so every rule has a test.
import { hasOverride } from './prompt'

export type Turn = { role: 'user' | 'assistant'; content: string }
export type Validated = { ok: true; turns: Turn[]; flagged: boolean } | { ok: false; status: 400; reason: 'shape' | 'content' }

// Visitor turns are capped at maxChars. The bot's own earlier answers come back as assistant turns
// and may run to the answer limit (1200), so they are trimmed, not rejected.
export const LIMITS = { maxMessages: 12, maxChars: 600, maxAssistantChars: 1200, maxTotal: 6000, keepTurns: 6 } as const

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

export type Verify = (content: string, sig: unknown) => boolean

export function validateMessages(input: unknown, verify?: Verify): Validated {
  const fail = (reason: 'shape' | 'content'): Validated => ({ ok: false, status: 400, reason })
  if (!input || typeof input !== 'object' || !Array.isArray((input as { messages?: unknown }).messages)) return fail('shape')
  const raw = (input as { messages: unknown[] }).messages
  if (raw.length < 1 || raw.length > LIMITS.maxMessages) return fail('shape')
  const turns: Turn[] = []
  for (const m of raw) {
    if (!m || typeof m !== 'object') return fail('shape')
    const { role, content, sig } = m as { role?: unknown; content?: unknown; sig?: unknown }
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return fail('shape')
    const text = content.replace(CONTROL, '').trim()
    if (text.length < 1) return fail('shape')
    if (role === 'user') {
      if (text.length > LIMITS.maxChars) return fail('shape')
      turns.push({ role, content: text })
      continue
    }
    // An earlier answer comes back only with the signature the server issued for it. Anything else
    // is a forgery or a stale thread and is dropped, together with its question below.
    const kept = text.slice(0, LIMITS.maxAssistantChars)
    if (verify && !verify(kept, sig)) continue
    turns.push({ role, content: kept })
  }
  // Keep only the last of any run of same-role turns, so a dropped answer takes its question with it.
  const alternating: Turn[] = []
  for (const t of turns) {
    if (alternating.length && alternating[alternating.length - 1].role === t.role) alternating[alternating.length - 1] = t
    else alternating.push(t)
  }
  if (!alternating.length || alternating[alternating.length - 1].role !== 'user') return fail('shape')
  const last = alternating[alternating.length - 1].content
  if (last.length < 3 || URL_RE.test(last) || mostlySymbols(last)) return fail('content')
  const previousUser = alternating.slice(0, -1).filter((t) => t.role === 'user').pop()
  if (previousUser && previousUser.content === last) return fail('content')
  const kept = alternating.slice(-LIMITS.keepTurns)
  while (kept.length && kept[0].role !== 'user') kept.shift()
  if (kept.reduce((n, t) => n + t.content.length, 0) > LIMITS.maxTotal) return fail('shape')
  return { ok: true, turns: kept, flagged: hasOverride(last) }
}
