// Per-address allowance inside one function instance. Soft: instances recycle. It stops a single
// script between recycles, which is what it is for.
import { createHmac } from 'node:crypto'

const hits = new Map<string, { start: number; count: number }>()

export function hashIp(ip: string, secret: string): string {
  return createHmac('sha256', secret).update(ip).digest('base64url').slice(0, 16)
}

export function takeIp(key: string, now: number, limit = 60, windowMs = 3_600_000): boolean {
  const h = hits.get(key)
  if (!h || now - h.start >= windowMs) {
    hits.set(key, { start: now, count: 1 })
    return true
  }
  if (h.count >= limit) return false
  h.count++
  return true
}

export function resetIpBuckets(): void {
  hits.clear()
}
