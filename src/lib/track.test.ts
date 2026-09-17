import { describe, expect, it } from 'vitest'
import { barCheckpointLengths, barPath, checkpointAt, lengthForScroll, NARROW_QUERY, outlinePath, perspective, polylinePath, roadWidthAt } from './track'

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

describe('perspective', () => {
  it('is zero at the horizon and one from the Start checkpoint onward', () => {
    expect(perspective(0, 400)).toBe(0)
    expect(perspective(400, 400)).toBe(1)
    expect(perspective(900, 400)).toBe(1)
  })
  it('grows faster near the start than a straight line, like a road coming toward the camera', () => {
    expect(perspective(200, 400)).toBeLessThan(0.5)
    expect(perspective(200, 400)).toBeGreaterThan(0)
  })
  it('treats a missing hero segment as full size', () => {
    expect(perspective(10, 0)).toBe(1)
  })
})

describe('roadWidthAt', () => {
  it('interpolates between the horizon width and the full width', () => {
    expect(roadWidthAt(0, 400, 6, 62)).toBe(6)
    expect(roadWidthAt(400, 400, 6, 62)).toBe(62)
    expect(roadWidthAt(2000, 400, 6, 62)).toBe(62)
  })
})

describe('outlinePath', () => {
  const samples = [
    { x: 0, y: 0, l: 0 },
    { x: 0, y: 10, l: 10 },
    { x: 0, y: 20, l: 20 },
  ]
  it('offsets a vertical centre line to a left and a right edge', () => {
    const o = outlinePath(samples, () => 5)
    expect(o.left).toEqual(['-5.0,0.0', '-5.0,10.0', '-5.0,20.0'])
    expect(o.right).toEqual(['5.0,0.0', '5.0,10.0', '5.0,20.0'])
  })
  it('closes the polygon down the left edge and back up the right', () => {
    const o = outlinePath(samples, () => 5)
    expect(o.d).toBe('M-5.0,0.0L-5.0,10.0L-5.0,20.0L5.0,20.0L5.0,10.0L5.0,0.0Z')
  })
  it('uses the width function at each sample', () => {
    const o = outlinePath(samples, (l) => (l >= 20 ? 10 : 5))
    expect(o.left[2]).toBe('-10.0,20.0')
  })
})

describe('polylinePath', () => {
  it('joins points with line commands', () => {
    expect(polylinePath(['1.0,2.0', '3.0,4.0'])).toBe('M1.0,2.0L3.0,4.0')
    expect(polylinePath([])).toBe('')
  })
})
