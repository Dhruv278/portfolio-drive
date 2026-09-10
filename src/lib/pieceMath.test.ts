import { describe, expect, it } from 'vitest'
import { conveyorU, counterValue, easeInOut, INTRO_DURATION, introPhase, smoothstep, wrapText } from './pieceMath'

describe('pieceMath', () => {
  it('eases from 0 to 1 and is symmetric', () => {
    expect(easeInOut(0)).toBe(0)
    expect(easeInOut(1)).toBe(1)
    expect(easeInOut(0.5)).toBeCloseTo(0.5, 6)
    expect(easeInOut(0.25)).toBeCloseTo(1 - easeInOut(0.75), 6)
  })

  it('smoothstep clamps outside the range', () => {
    expect(smoothstep(1, 2, 0)).toBe(0)
    expect(smoothstep(1, 2, 3)).toBe(1)
    expect(smoothstep(1, 2, 1.5)).toBeCloseTo(0.5, 6)
  })

  it('runs the intro in order: door, then car, then camera, done at the end', () => {
    expect(introPhase(0)).toEqual({ door: 0, car: 0, camera: 0, done: false })
    const mid = introPhase(1.2)
    expect(mid.door).toBe(1)
    expect(mid.car).toBeGreaterThan(0)
    expect(mid.car).toBeLessThan(0.2)
    expect(mid.camera).toBe(0)
    const late = introPhase(3.0)
    expect(late.car).toBeGreaterThan(0.9)
    expect(late.camera).toBeGreaterThan(0.5)
    expect(late.done).toBe(false)
    expect(introPhase(INTRO_DURATION)).toEqual({ door: 1, car: 1, camera: 1, done: true })
    expect(introPhase(99).done).toBe(true)
  })

  it('spreads conveyor items evenly and wraps them', () => {
    const us = Array.from({ length: 4 }, (_, i) => conveyorU(i, 4, 0, 0.1))
    expect(us).toEqual([0, 0.25, 0.5, 0.75])
    expect(conveyorU(3, 4, 5, 0.1)).toBeCloseTo(0.25, 6)
    for (let t = 0; t < 50; t += 0.7) {
      const u = conveyorU(1, 4, t, 0.13)
      expect(u).toBeGreaterThanOrEqual(0)
      expect(u).toBeLessThan(1)
    }
  })

  it('counts from the start value to the target and rounds', () => {
    expect(counterValue(53, 26, 0)).toBe(53)
    expect(counterValue(53, 26, 1)).toBe(26)
    expect(counterValue(0, 28, 0.5)).toBe(14)
    expect(Number.isInteger(counterValue(0, 28, 0.333))).toBe(true)
  })

  it('wraps words without splitting them and never returns an empty line', () => {
    expect(wrapText('Rear-end collision, neck and low back pain', 20)).toEqual(['Rear-end collision,', 'neck and low back', 'pain'])
    expect(wrapText('Short', 20)).toEqual(['Short'])
    expect(wrapText('Supercalifragilistic word', 8)).toEqual(['Supercalifragilistic', 'word'])
  })
})
