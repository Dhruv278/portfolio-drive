import { describe, expect, it } from 'vitest'
import { BUCKET, parseBucket, serializeBucket, takeFromBucket } from './bucket'
import { shouldRest } from './budget'
import { hashIp, resetIpBuckets, takeIp } from './ipBucket'

const secret = 'test-secret'

describe('cookie bucket', () => {
  it('starts fresh, counts, and round-trips through the signed cookie', () => {
    const t = takeFromBucket(null, 1_000_000)
    expect(t.allowed).toBe(true)
    const cookie = serializeBucket(t.bucket, secret)
    expect(parseBucket(cookie, secret)).toEqual(t.bucket)
    expect(t.bucket).toMatchObject({ count: 1, total: 1, last: 1_000_000 })
  })
  it('rejects a tampered or foreign cookie by starting over', () => {
    const cookie = serializeBucket({ start: 1, count: 19, total: 19, last: 1 }, secret)
    expect(parseBucket(cookie.replace('19', '18'), secret)).toBeNull()
    expect(parseBucket(cookie, 'other')).toBeNull()
    expect(parseBucket('garbage', secret)).toBeNull()
  })
  it('enforces the gap, the hourly limit and the lifetime limit', () => {
    let b = takeFromBucket(null, 0).bucket
    expect(takeFromBucket(b, BUCKET.minGapMs - 1)).toMatchObject({ allowed: false, reason: 'gap' })
    for (let i = 1; i < BUCKET.perHour; i++) b = takeFromBucket(b, i * 3000).bucket
    expect(takeFromBucket(b, BUCKET.perHour * 3000)).toMatchObject({ allowed: false, reason: 'hour' })
    const later = takeFromBucket(b, BUCKET.windowMs + 1)
    expect(later.allowed).toBe(true)
    expect(later.bucket.count).toBe(1)
    expect(takeFromBucket({ start: 0, count: 0, total: BUCKET.lifetime, last: 0 }, 5000)).toMatchObject({ allowed: false, reason: 'lifetime' })
  })
})

describe('ip bucket', () => {
  it('allows up to the limit per window per hashed address', () => {
    resetIpBuckets()
    const k = hashIp('203.0.113.9', secret)
    expect(k).not.toContain('203.0.113.9')
    for (let i = 0; i < 60; i++) expect(takeIp(k, 1000 + i)).toBe(true)
    expect(takeIp(k, 2000)).toBe(false)
    expect(takeIp(k, 1000 + 3_600_000)).toBe(true)
  })
})

describe('daily budget', () => {
  it('rests when the day is spent or the key is nearly out, and never on missing data', () => {
    expect(shouldRest({ usage_daily: 0.51, limit_remaining: 4 }, 0.5)).toBe(true)
    expect(shouldRest({ usage_daily: 0.1, limit_remaining: 0.2 }, 0.5)).toBe(true)
    expect(shouldRest({ usage_daily: 0.1, limit_remaining: 4 }, 0.5)).toBe(false)
    expect(shouldRest(null, 0.5)).toBe(false)
  })
})
