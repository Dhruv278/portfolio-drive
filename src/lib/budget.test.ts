import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Everything the scene downloads before it fades in. The design spec caps this at 10 MB.
const DIRS = ['public/models', 'public/textures', 'public/hdri']
const BUDGET = 10 * 1024 * 1024

function sizeOf(dir: string): number {
  let total = 0
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    total += st.isDirectory() ? sizeOf(p) : st.size
  }
  return total
}

describe('asset budget', () => {
  it('keeps first-paint assets under 10 MB', () => {
    const total = DIRS.reduce((sum, d) => sum + sizeOf(d), 0)
    expect(total).toBeGreaterThan(0)
    expect(total).toBeLessThan(BUDGET)
  })
})
