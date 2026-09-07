// Pure scroll model. Maps the page scroll fraction (0 to 1) to a position along the road (0 to 1)
// with an idle plateau at every stop, and picks the stop index for the odometer.

export type Zone = { a: number; b: number }
export type SectionRect = { top: number; height: number }

// Fraction of a section's height where the idle zone is centred, and its half-width.
const ZONE_CENTER = 0.34
const ZONE_HALF = 0.13
// The odometer flips to the next stop slightly before its zone starts.
const STOP_LEAD = 0.03

export function measureZones(sections: SectionRect[], maxScroll: number): Zone[] {
  const max = Math.max(1, maxScroll)
  return sections.map((s) => {
    const center = s.top + s.height * ZONE_CENTER
    const half = s.height * ZONE_HALF
    return { a: Math.max(0, (center - half) / max), b: Math.min(1, (center + half) / max) }
  })
}

export function roadT(s: number, zones: Zone[], tStops: number[], tEnd: number): number {
  let prevB = 0
  let prevT = 0
  for (let i = 0; i < zones.length; i++) {
    const { a, b } = zones[i]
    if (s < a) return prevT + (tStops[i] - prevT) * ((s - prevB) / Math.max(1e-6, a - prevB))
    if (s <= b) return tStops[i]
    prevB = b
    prevT = tStops[i]
  }
  return prevT + (tEnd - prevT) * ((s - prevB) / Math.max(1e-6, 1 - prevB))
}

export function currentStop(s: number, zones: Zone[]): number {
  let best = 0
  for (let i = 0; i < zones.length; i++) if (s >= zones[i].a - STOP_LEAD) best = i
  return best
}
