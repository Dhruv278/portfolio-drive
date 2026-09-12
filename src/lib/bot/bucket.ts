// Per-browser allowance, carried in a signed cookie so the function needs no storage. A tampered
// cookie is treated as missing, which only ever gives the visitor a fresh, smaller allowance.
import { createHmac, timingSafeEqual } from 'node:crypto'

export type Bucket = { start: number; count: number; total: number; last: number }
export const BUCKET = { perHour: 20, lifetime: 60, minGapMs: 2000, windowMs: 3_600_000 } as const

export function sign(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url')
}

export function serializeBucket(b: Bucket, secret: string): string {
  const value = `${b.start}.${b.count}.${b.total}.${b.last}`
  return `${value}.${sign(value, secret)}`
}

export function parseBucket(cookie: string | undefined, secret: string): Bucket | null {
  if (!cookie) return null
  const parts = cookie.split('.')
  if (parts.length !== 5) return null
  const value = parts.slice(0, 4).join('.')
  const mac = Buffer.from(parts[4])
  const expected = Buffer.from(sign(value, secret))
  if (mac.length !== expected.length || !timingSafeEqual(mac, expected)) return null
  const [start, count, total, last] = parts.slice(0, 4).map(Number)
  if ([start, count, total, last].some((n) => !Number.isFinite(n) || n < 0)) return null
  return { start, count, total, last }
}

export type Take = { allowed: true; bucket: Bucket } | { allowed: false; reason: 'hour' | 'lifetime' | 'gap'; bucket: Bucket }

export function takeFromBucket(prev: Bucket | null, now: number): Take {
  let b: Bucket = prev ?? { start: now, count: 0, total: 0, last: 0 }
  if (now - b.start >= BUCKET.windowMs) b = { ...b, start: now, count: 0 }
  if (b.total >= BUCKET.lifetime) return { allowed: false, reason: 'lifetime', bucket: b }
  if (b.count >= BUCKET.perHour) return { allowed: false, reason: 'hour', bucket: b }
  if (b.last && now - b.last < BUCKET.minGapMs) return { allowed: false, reason: 'gap', bucket: b }
  return { allowed: true, bucket: { ...b, count: b.count + 1, total: b.total + 1, last: now } }
}
