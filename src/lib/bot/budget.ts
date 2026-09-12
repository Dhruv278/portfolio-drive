// The daily budget, read from OpenRouter's own usage figures for the key, cached for a minute per
// instance. OpenRouter reports usage_daily and limit_remaining on the key endpoint (verified 12
// September 2026). Missing data never rests the bot: the key's own credit limit is the last line.
export type KeyUsage = { usage_daily?: number; limit_remaining?: number | null }

export function shouldRest(u: KeyUsage | null, dailyBudget: number, floor = 0.25): boolean {
  if (!u) return false
  if (typeof u.usage_daily === 'number' && u.usage_daily >= dailyBudget) return true
  if (typeof u.limit_remaining === 'number' && u.limit_remaining <= floor) return true
  return false
}

let cache: { at: number; usage: KeyUsage | null } = { at: 0, usage: null }

export async function fetchKeyUsage(apiKey: string, now = Date.now(), ttlMs = 60_000): Promise<KeyUsage | null> {
  if (cache.at && now - cache.at < ttlMs) return cache.usage
  try {
    const res = await fetch('https://openrouter.ai/api/v1/auth/key', { headers: { Authorization: `Bearer ${apiKey}` }, cache: 'no-store' })
    const json = res.ok ? ((await res.json()) as { data?: KeyUsage }) : null
    cache = { at: now, usage: json?.data ?? null }
  } catch {
    cache = { at: now, usage: null }
  }
  return cache.usage
}

// Tests only: forget the last reading.
export function resetBudgetCache(): void {
  cache = { at: 0, usage: null }
}
