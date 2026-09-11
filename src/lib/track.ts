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
