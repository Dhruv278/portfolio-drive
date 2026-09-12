// POST /api/ask: the visitor's turns in, a vetted answer and its sources out. Guards run in this
// order: origin, shape and content, cookie bucket, address bucket, daily budget, then the model,
// then the output guards. Message content is never logged.
import { NextResponse } from 'next/server'
import { bot } from '@/content/bot'
import { identity } from '@/content/profile'
import { fetchKeyUsage, shouldRest } from '@/lib/bot/budget'
import { parseBucket, serializeBucket, sign, takeFromBucket } from '@/lib/bot/bucket'
import { checkOrigin, LIMITS, validateMessages } from '@/lib/bot/inputGuards'
import { hashIp, takeIp } from '@/lib/bot/ipBucket'
import { buildSections, renderKnowledge } from '@/lib/bot/knowledge'
import { loadKnowledgeFiles } from '@/lib/bot/knowledgeFiles'
import { askModel, UpstreamError } from '@/lib/bot/openrouter'
import { ensureEmail, guardAnswer } from '@/lib/bot/outputGuards'
import { buildSystemPrompt, REMINDER, RULES } from '@/lib/bot/prompt'
import { SITE_URL } from '@/lib/site'

export const runtime = 'nodejs'
export const maxDuration = 30

const sections = buildSections(loadKnowledgeFiles())
const system = buildSystemPrompt(sections)
const knowledgeText = renderKnowledge(sections)
const titles = sections.map((s) => s.title)

const SITE = SITE_URL
const LOCAL = ['http://localhost:3000', 'http://localhost:3777', 'http://localhost:3778', 'http://localhost:3779', 'http://127.0.0.1:3777']
const ALLOWED = process.env.NODE_ENV === 'production' ? [SITE] : [SITE, ...LOCAL]

// The page's own origin: the allowlist, or the request's own host, so a custom domain or a preview
// deployment works without a config change.
function originOk(req: Request): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return false
  if (checkOrigin(origin, ALLOWED)) return true
  try {
    return new URL(origin).host === req.headers.get('host')
  } catch {
    return false
  }
}
const COOKIE = 'dbot'
const RESTING = new Set([401, 402, 429])

const err = (status: number, error: string, headers?: HeadersInit) => NextResponse.json({ error }, { status, headers })

function readCookie(header: string | null, name: string): string | undefined {
  return header
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1)
}

function cookieHeader(value: string): string {
  const secure = SITE.startsWith('https') ? '; Secure' : ''
  return `${COOKIE}=${value}; Path=/api/ask; Max-Age=2592000; HttpOnly; SameSite=Lax${secure}`
}

export async function POST(req: Request): Promise<Response> {
  const t0 = Date.now()
  if (!originOk(req) || req.headers.get('x-dhruvbot') !== '1') return err(403, bot.lines.origin)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err(400, bot.lines.invalid)
  }
  const secret = process.env.BOT_COOKIE_SECRET ?? ''
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!secret || !apiKey) return err(503, bot.lines.resting)
  // Earlier answers are accepted back only with the signature this route issued for them.
  const v = validateMessages(body, (content, sig) => typeof sig === 'string' && sig === sign(content, secret))
  if (!v.ok) return err(400, bot.lines.invalid)

  const now = Date.now()
  const take = takeFromBucket(parseBucket(readCookie(req.headers.get('cookie'), COOKIE), secret), now)
  const setCookie = { 'Set-Cookie': cookieHeader(serializeBucket(take.bucket, secret)) }
  if (!take.allowed) return err(429, take.reason === 'gap' ? bot.lines.tooFast : bot.lines.quota, setCookie)

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
  if (!takeIp(hashIp(ip, secret), now)) return err(429, bot.lines.quota, setCookie)

  const budget = Number(process.env.BOT_DAILY_BUDGET_USD ?? '0.5')
  if (shouldRest(await fetchKeyUsage(apiKey, now), budget)) {
    console.log(`ask rest budget ${Date.now() - t0}ms`)
    return err(503, bot.lines.resting, setCookie)
  }

  const turns = v.turns.map((t, i, all) => (v.flagged && i === all.length - 1 ? { ...t, content: t.content + REMINDER } : t))
  let raw: string
  try {
    raw = await askModel({ apiKey, system, turns, site: SITE })
  } catch (e) {
    const status = e instanceof UpstreamError ? e.status : 502
    console.log(`ask upstream ${status} ${Date.now() - t0}ms`)
    return RESTING.has(status) ? err(503, bot.lines.resting, setCookie) : err(502, bot.lines.failed, setCookie)
  }

  const userText = v.turns.filter((t) => t.role === 'user').map((t) => t.content).join('\n')
  const g = guardAnswer(raw, { rules: RULES, titles, known: `${knowledgeText}\n${userText}`, lines: bot.lines })
  const answer = ensureEmail(g.answer, identity.email)
  console.log(`ask ok ${Date.now() - t0}ms flags=${g.flags.join(',') || 'none'}`)
  return NextResponse.json({ answer, sources: g.sources, sig: sign(answer.slice(0, LIMITS.maxAssistantChars), secret) }, { headers: { ...setCookie, 'Cache-Control': 'no-store' } })
}
