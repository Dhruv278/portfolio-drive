import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BILLBOARDS, buildPlacements, T_END, T_STOPS, usedModels } from './route'

describe('route', () => {
  it('has six stops in increasing order that end before the road does', () => {
    expect(T_STOPS).toHaveLength(6)
    for (let i = 1; i < T_STOPS.length; i++) expect(T_STOPS[i]).toBeGreaterThan(T_STOPS[i - 1])
    expect(T_END).toBeGreaterThan(T_STOPS[5])
    expect(T_END).toBeLessThanOrEqual(1)
  })

  it('places every scenery item on the road and clear of the tarmac', () => {
    for (const p of buildPlacements()) {
      expect(p.t).toBeGreaterThanOrEqual(0)
      expect(p.t).toBeLessThanOrEqual(1)
      expect(Math.abs(p.lateral)).toBeGreaterThan(3.2 + 0.35)
    }
    for (const b of BILLBOARDS) expect(Math.abs(b.lateral)).toBeGreaterThan(3.55)
  })

  it('is deterministic between calls', () => {
    expect(buildPlacements()).toEqual(buildPlacements())
  })

  it('matches the copy script allowlist', () => {
    const list = JSON.parse(readFileSync(join(process.cwd(), 'scripts', 'used-models.json'), 'utf8')) as string[]
    expect(list).toEqual(usedModels())
  })

  it('has every referenced model available in design/assets', () => {
    const missing = usedModels().filter((m) => !existsSync(join(process.cwd(), 'design', 'assets', m + '.glb')))
    expect(missing).toEqual([])
  })
})
