import { describe, expect, it } from 'vitest'
import { ARRIVE, currentStop, measureZones, parkedStop, roadT, SPACER_VH, STICKY_TOP_VH, type Zone } from './scroll'

const T_STOPS = [0.035, 0.21, 0.39, 0.57, 0.75, 0.955]
const T_END = 0.972

// six sections of equal height stacked from 0, like the page on an 800 px tall window
const VH = 800
const H = 1340
const rects = Array.from({ length: 6 }, (_, i) => ({ top: i * H, height: H }))
const maxScroll = 6 * H - VH * 0.35

describe('measureZones', () => {
  it('returns one zone per section, ordered and non-overlapping', () => {
    const zones = measureZones(rects, maxScroll, VH)
    expect(zones).toHaveLength(6)
    for (let i = 0; i < zones.length; i++) {
      expect(zones[i].a).toBeLessThan(zones[i].b)
      if (i > 0) expect(zones[i].a).toBeGreaterThan(zones[i - 1].b)
    }
    expect(zones[0].a).toBeGreaterThanOrEqual(0)
    expect(zones[5].b).toBeLessThanOrEqual(1)
  })

  it('keeps the car parked longer when a section grows to hold a tall panel', () => {
    const tall = [{ top: 0, height: H }, { top: H, height: H + 600 }, { top: 2 * H + 600, height: H }]
    const base = measureZones(rects.slice(0, 3), maxScroll, VH)
    const grown = measureZones(tall, maxScroll, VH)
    // arrival does not move: it is measured from the section top, not its height
    expect(grown[1].a).toBeCloseTo(base[1].a, 9)
    // departure moves down by exactly the extra height
    expect((grown[1].b - base[1].b) * maxScroll).toBeCloseTo(600, 6)
    // the car parks 0.36 viewports in and leaves with 0.88 viewports of the section left
    expect(grown[1].a * maxScroll).toBeCloseTo(H + 0.36 * VH, 6)
    expect(grown[1].b * maxScroll).toBeCloseTo(H + (H + 600) - 0.88 * VH, 6)
  })

  it('parks the car while a tall panel is still pinned', () => {
    // A panel taller than the window stays pinned for (spacer - sticky top) viewports after the
    // section top passes. Arrival must fall inside that window or the heading is already sliding.
    expect(ARRIVE).toBeLessThanOrEqual(SPACER_VH - STICKY_TOP_VH)
  })

  it('gives a short section a minimum plateau', () => {
    const [z] = measureZones([{ top: 0, height: 0.5 * VH }], maxScroll, VH)
    expect(z.b).toBeGreaterThan(z.a)
    expect((z.b - z.a) * maxScroll).toBeCloseTo(0.2 * VH, 6)
  })
})

describe('roadT', () => {
  const zones = measureZones(rects, maxScroll, VH)

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
  const zones: Zone[] = measureZones(rects, maxScroll, VH)

  it('is 0 at the top and 5 at the bottom', () => {
    expect(currentStop(0, zones)).toBe(0)
    expect(currentStop(1, zones)).toBe(5)
  })

  it('switches to the next stop a little before its zone begins', () => {
    expect(currentStop(zones[2].a - 0.02, zones)).toBe(2)
    expect(currentStop(zones[2].a - 0.05, zones)).toBe(1)
  })
})

describe('parkedStop', () => {
  const zones = measureZones(rects, maxScroll, VH)
  it('names the stop whose plateau contains the scroll fraction, else -1', () => {
    expect(parkedStop((zones[1].a + zones[1].b) / 2, zones)).toBe(1)
    expect(parkedStop(zones[1].a, zones)).toBe(1)
    expect(parkedStop(zones[1].b, zones)).toBe(1)
    expect(parkedStop((zones[1].b + zones[2].a) / 2, zones)).toBe(-1)
    expect(parkedStop(0, zones)).toBe(zones[0].a === 0 ? 0 : -1)
  })
})
