// Pure scroll model. Maps the page scroll fraction (0 to 1) to a position along the road (0 to 1)
// with an idle plateau at every stop, and picks the stop index for the odometer.

export type Zone = { a: number; b: number }
export type SectionRect = { top: number; height: number }

// Layout constants the model depends on. They must match globals.css: the sticky offset of a
// desktop panel (top: 9vh) and the spacer after it (section.stop::after, 70vh). A panel stays
// pinned for (spacer - sticky top) viewports, so the car must arrive within that window.
export const STICKY_TOP_VH = 0.09
export const SPACER_VH = 0.7
// The car has parked this many viewport heights after a section's top reaches the top of the
// window. By then the section's panel is pinned under the HUD and revealed.
export const ARRIVE = 0.36
// The car leaves when this much of the viewport is left of the section. A panel taller than the
// window slides up out of its sticky position over the last part of its section, so a section that
// grows with a tall panel keeps the car parked until that panel's end has been on screen.
export const LEAVE = 0.88
// A section shorter than ARRIVE + LEAVE viewports still gets a plateau this long.
const MIN_PLATEAU = 0.2
// The odometer flips to the next stop slightly before its zone starts.
const STOP_LEAD = 0.03

export function measureZones(sections: SectionRect[], maxScroll: number, viewportHeight: number): Zone[] {
  const max = Math.max(1, maxScroll)
  const vh = Math.max(1, viewportHeight)
  return sections.map((s) => {
    const a = s.top + ARRIVE * vh
    const b = s.top + Math.max(s.height - LEAVE * vh, (ARRIVE + MIN_PLATEAU) * vh)
    return { a: Math.min(1, Math.max(0, a / max)), b: Math.min(1, Math.max(0, b / max)) }
  })
}

export function roadT(s: number, zones: Zone[], tStops: number[], tEnd: number): number {
  let prevB = 0
  let prevT = 0
  for (let i = 0; i < zones.length; i++) {
    const { a, b } = zones[i]
    // The page top is the first stop: the car waits there (the garage behind it) until the drive begins.
    if (i === 0 && s < a) return tStops[0]
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

// Index of the stop whose plateau contains the scroll fraction, or -1 while driving between stops.
export function parkedStop(s: number, zones: Zone[]): number {
  for (let i = 0; i < zones.length; i++) if (s >= zones[i].a && s <= zones[i].b) return i
  return -1
}
