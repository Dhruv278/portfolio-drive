// Pure geometry for the 2D track, shared by the page road on desktop and the route bar on phones and
// tablets. No DOM here, so every rule is unit tested.

// Below this width the road becomes a fixed horizontal bar under the header.
export const NARROW_QUERY = '(max-width: 1023px)'

// Track length for a scroll position: piecewise linear between the scroll positions at which each
// card sits in the middle of the window (cpScroll) and the track lengths of their checkpoints (cpLen).
// The car waits at the first checkpoint before the page moves and stops at the last one after it.
export function lengthForScroll(y: number, cpScroll: number[], cpLen: number[]): number {
  if (!cpLen.length) return 0
  let len = cpLen[0]
  for (let i = 1; i < cpScroll.length && i < cpLen.length; i++) {
    const a = cpScroll[i - 1]
    const b = cpScroll[i]
    if (y >= b) {
      len = cpLen[i]
      continue
    }
    if (y > a) len = cpLen[i - 1] + (cpLen[i] - cpLen[i - 1]) * ((y - a) / Math.max(1, b - a))
    break
  }
  return len
}

// Which checkpoint a track length has reached. The flip happens `lead` units early so the card is
// awake by the time the car stops on the dot.
export function checkpointAt(len: number, cpLen: number[], lead = 60): number {
  let idx = 0
  cpLen.forEach((cl, i) => {
    if (len >= cl - lead) idx = i
  })
  return idx
}

// Checkpoint lengths along the route bar: evenly spaced between a margin at each end.
export function barCheckpointLengths(total: number, count: number, margin = 0.04): number[] {
  if (count <= 0) return []
  const a = total * margin
  if (count === 1) return [a]
  const b = total * (1 - margin)
  return Array.from({ length: count }, (_, i) => a + ((b - a) * i) / (count - 1))
}

// The route bar's road: one soft S-bend from the left inset to the right inset, centred vertically.
export function barPath(width: number, height: number, inset = 22): string {
  const y = height / 2
  const amp = Math.min(9, height * 0.16)
  const x0 = inset
  const x1 = width - inset
  const c1 = x0 + (x1 - x0) / 3
  const c2 = x0 + ((x1 - x0) * 2) / 3
  const f = (n: number) => Number(n.toFixed(1))
  return `M${f(x0)},${f(y)} C${f(c1)},${f(y - amp)} ${f(c2)},${f(y + amp)} ${f(x1)},${f(y)}`
}

// Hero approach: the road enters from a horizon and widens to full size at the Start checkpoint.
// 0 at the horizon, 1 from Start onward. The power makes it grow faster near the viewer, like a
// road seen from above and behind.
export function perspective(len: number, heroLen: number): number {
  if (heroLen <= 0 || len >= heroLen) return 1
  return Math.pow(Math.max(0, len / heroLen), 1.7)
}

export function roadWidthAt(len: number, heroLen: number, minW: number, maxW: number): number {
  return minW + (maxW - minW) * perspective(len, heroLen)
}

const fmt = (n: number) => n.toFixed(1)

export type Sample = { x: number; y: number; l: number }

// Offsets a sampled centre line to a left and a right edge (as "x,y" strings) and returns the
// closed polygon that runs down the left edge and back up the right. halfWidthAt gets the length
// along the road so the hero approach can taper.
export function outlinePath(samples: Sample[], halfWidthAt: (l: number) => number): { left: string[]; right: string[]; d: string } {
  const left: string[] = []
  const right: string[] = []
  const n = samples.length
  for (let i = 0; i < n; i++) {
    const a = samples[Math.max(0, i - 1)]
    const b = samples[Math.min(n - 1, i + 1)]
    let tx = b.x - a.x
    let ty = b.y - a.y
    const m = Math.hypot(tx, ty) || 1
    tx /= m
    ty /= m
    const w = halfWidthAt(samples[i].l)
    left.push(`${fmt(samples[i].x - ty * w)},${fmt(samples[i].y + tx * w)}`)
    right.push(`${fmt(samples[i].x + ty * w)},${fmt(samples[i].y - tx * w)}`)
  }
  const d = n ? `M${left.join('L')}L${[...right].reverse().join('L')}Z` : ''
  return { left, right, d }
}

export function polylinePath(points: string[]): string {
  return points.length ? `M${points.join('L')}` : ''
}
