import { describe, expect, it } from 'vitest'
import { isRedOrOrange, recolorRedCells } from './recolor'

function rgba(...px: number[][]): Uint8ClampedArray {
  return new Uint8ClampedArray(px.flatMap(([r, g, b]) => [r, g, b, 255]))
}

describe('isRedOrOrange', () => {
  it('accepts the kit reds and oranges and rejects greys, blues, greens and skin tones', () => {
    expect(isRedOrOrange(220, 60, 50)).toBe(true)
    expect(isRedOrOrange(235, 120, 40)).toBe(true)
    expect(isRedOrOrange(120, 120, 120)).toBe(false)
    expect(isRedOrOrange(47, 91, 234)).toBe(false)
    expect(isRedOrOrange(80, 170, 90)).toBe(false)
    expect(isRedOrOrange(230, 200, 180)).toBe(false)
  })
})

describe('recolorRedCells', () => {
  it('replaces only the red and orange pixels, preserving relative lightness', () => {
    const src = rgba([220, 60, 50], [120, 120, 120], [47, 91, 234], [235, 120, 40])
    const out = recolorRedCells(src, [47, 91, 234])
    expect(out).not.toBe(src)
    // grey and blue untouched
    expect(Array.from(out.slice(4, 8))).toEqual([120, 120, 120, 255])
    expect(Array.from(out.slice(8, 12))).toEqual([47, 91, 234, 255])
    // red became a blue, orange became a lighter blue
    const [r1, g1, b1] = out.slice(0, 3)
    const [r2, g2, b2] = out.slice(12, 15)
    expect(b1).toBeGreaterThan(r1)
    expect(b1).toBeGreaterThan(g1)
    expect(b2).toBeGreaterThan(r2)
    expect(b2).toBeGreaterThan(g2)
    expect(b2).toBeGreaterThanOrEqual(b1)
    // alpha preserved
    expect(out[3]).toBe(255)
  })
})
