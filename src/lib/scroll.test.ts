import { describe, expect, it } from 'vitest'
import { currentStop, measureZones, roadT, type Zone } from './scroll'

const T_STOPS = [0.035, 0.21, 0.39, 0.57, 0.75, 0.955]
const T_END = 0.972

// six sections of equal height stacked from 0, like the page
const H = 1340
const rects = Array.from({ length: 6 }, (_, i) => ({ top: i * H, height: H }))
const maxScroll = 6 * H - 800 * 0.35

describe('measureZones', () => {
  it('returns one zone per section, ordered and non-overlapping', () => {
    const zones = measureZones(rects, maxScroll)
    expect(zones).toHaveLength(6)
    for (let i = 0; i < zones.length; i++) {
      expect(zones[i].a).toBeLessThan(zones[i].b)
      if (i > 0) expect(zones[i].a).toBeGreaterThan(zones[i - 1].b)
    }
    expect(zones[0].a).toBeGreaterThanOrEqual(0)
    expect(zones[5].b).toBeLessThanOrEqual(1)
  })
})

describe('roadT', () => {
  const zones = measureZones(rects, maxScroll)

  it('holds the car at each stop across the whole idle zone', () => {
    zones.forEach((z, i) => {
      expect(roadT(z.a, zones, T_STOPS, T_END)).toBeCloseTo(T_STOPS[i], 6)
      expect(roadT((z.a + z.b) / 2, zones, T_STOPS, T_END)).toBeCloseTo(T_STOPS[i], 6)
      expect(roadT(z.b, zones, T_STOPS, T_END)).toBeCloseTo(T_STOPS[i], 6)
    })
  })

  it('is monotonic non-decreasing from 0 to 1 and ends at tEnd', () => {
    let prev = -1
    for (let s = 0; s <= 1.00001; s += 0.001) {
      const t = roadT(Math.min(1, s), zones, T_STOPS, T_END)
      expect(t).toBeGreaterThanOrEqual(prev - 1e-9)
      prev = t
    }
    expect(roadT(0, zones, T_STOPS, T_END)).toBeCloseTo(0, 6)
    expect(roadT(1, zones, T_STOPS, T_END)).toBeCloseTo(T_END, 6)
  })

  it('moves between stops', () => {
    const mid = (zones[0].b + zones[1].a) / 2
    const t = roadT(mid, zones, T_STOPS, T_END)
    expect(t).toBeGreaterThan(T_STOPS[0])
    expect(t).toBeLessThan(T_STOPS[1])
  })
})

describe('currentStop', () => {
  const zones: Zone[] = measureZones(rects, maxScroll)

  it('is 0 at the top and 5 at the bottom', () => {
    expect(currentStop(0, zones)).toBe(0)
    expect(currentStop(1, zones)).toBe(5)
  })

  it('switches to the next stop a little before its zone begins', () => {
    expect(currentStop(zones[2].a - 0.02, zones)).toBe(2)
    expect(currentStop(zones[2].a - 0.05, zones)).toBe(1)
  })
})
