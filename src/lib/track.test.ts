import { describe, expect, it } from 'vitest'
import { barCheckpointLengths, barPath, checkpointAt, lengthForScroll, NARROW_QUERY } from './track'

describe('lengthForScroll', () => {
  const cpScroll = [0, 1000, 2000, 3500]
  const cpLen = [50, 400, 700, 1300]

  it('parks the car at the first checkpoint until the page starts scrolling', () => {
    expect(lengthForScroll(0, cpScroll, cpLen)).toBe(50)
    expect(lengthForScroll(-20, cpScroll, cpLen)).toBe(50)
  })

  it('lands exactly on a checkpoint when its card is centred', () => {
    expect(lengthForScroll(1000, cpScroll, cpLen)).toBe(400)
    expect(lengthForScroll(2000, cpScroll, cpLen)).toBe(700)
  })

  it('moves linearly between two checkpoints', () => {
    expect(lengthForScroll(500, cpScroll, cpLen)).toBe(225)
    expect(lengthForScroll(2750, cpScroll, cpLen)).toBe(1000)
  })

  it('stops at the last checkpoint instead of running off the road', () => {
    expect(lengthForScroll(9000, cpScroll, cpLen)).toBe(1300)
  })

  it('never divides by zero when two cards share a scroll position', () => {
    const v = lengthForScroll(1000, [0, 1000, 1000], [0, 100, 200])
    expect(Number.isFinite(v)).toBe(true)
  })

  it('returns zero with no checkpoints', () => {
    expect(lengthForScroll(100, [], [])).toBe(0)
  })
})

describe('checkpointAt', () => {
  const cpLen = [50, 400, 700]

  it('is the first checkpoint before the car has reached the second', () => {
    expect(checkpointAt(0, cpLen)).toBe(0)
    expect(checkpointAt(300, cpLen)).toBe(0)
  })

  it('flips a little before the car arrives, so the card is awake when it stops', () => {
    expect(checkpointAt(340, cpLen, 60)).toBe(1)
    expect(checkpointAt(339, cpLen, 60)).toBe(0)
  })

  it('holds the last checkpoint past the end', () => {
    expect(checkpointAt(5000, cpLen)).toBe(2)
  })
})

describe('barCheckpointLengths', () => {
  it('spaces checkpoints evenly between the margins', () => {
    const l = barCheckpointLengths(1000, 5, 0.1)
    expect(l).toEqual([100, 300, 500, 700, 900])
  })

  it('handles a single checkpoint and none', () => {
    expect(barCheckpointLengths(1000, 1, 0.1)).toEqual([100])
    expect(barCheckpointLengths(1000, 0)).toEqual([])
  })
})

describe('barPath', () => {
  it('runs from the left inset to the right inset inside the bar height', () => {
    const d = barPath(400, 56, 22)
    expect(d.startsWith('M22,')).toBe(true)
    const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number)
    const xs = nums.filter((_, i) => i % 2 === 0)
    const ys = nums.filter((_, i) => i % 2 === 1)
    expect(Math.max(...xs)).toBe(378)
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...ys)).toBeLessThanOrEqual(56)
  })
})

it('treats everything below 1024 pixels as narrow', () => {
  expect(NARROW_QUERY).toBe('(max-width: 1023px)')
})
