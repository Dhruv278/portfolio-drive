// The road, the stop positions along it, and the scenery placement table.
// Positions are road parameters t in [0, 1]. Lateral is metres from the road centre:
// positive is the camera side (frame left on desktop), negative is under the panel (frame right).

export const ROAD_POINTS: [number, number, number][] = [
  [0, 0, 0], [0, 0, -40], [10, 0, -80], [30, 0, -110], [34, 0, -150], [20, 0, -190],
  [-4, 0, -220], [-20, 0, -260], [-14, 0, -300], [8, 0, -335], [30, 0, -370], [38, 0, -410], [26, 0, -450], [0, 0, -480],
]
export const ROAD_HALF_WIDTH = 3.2
export const KERB_WIDTH = 0.35
export const ROAD_SEGMENTS = 700
export const DASH_COUNT = 260

export const T_STOPS = [0.035, 0.21, 0.39, 0.57, 0.75, 0.955]
export const T_END = 0.972
export const REVEAL_LEAD = 0.085 // scenery unfolds this far ahead of the car
export const DUSK_START = 0.8
export const DUSK_SPAN = 0.18

export type Fit = { h?: number; w?: number; d?: number; len?: number }
export type Placement = {
  t: number
  lateral: number
  model: string // path under /models without .glb
  fit: Fit
  rot?: number
  dx?: number
  dz?: number
}

const TREES = ['nature/tree_default', 'nature/tree_detailed', 'nature/tree_oak', 'nature/tree_pineDefaultA', 'nature/tree_pineRoundA', 'nature/tree_fat', 'nature/tree_tall', 'nature/tree_simple']

// deterministic pseudo-random so the world is identical on every load
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function treeRun(out: Placement[], rand: () => number, start: number, count: number, step: number, minLat: number, spread: number, minH: number, spreadH: number) {
  for (let i = 0; i < count; i++) {
    out.push({
      t: start + i * step,
      lateral: (i % 2 ? 1 : -1) * (minLat + rand() * spread),
      model: TREES[i % TREES.length],
      fit: { h: minH + rand() * spreadH },
      rot: rand() * Math.PI * 2,
    })
  }
}

export function buildPlacements(): Placement[] {
  const rand = rng(20260907)
  const p: Placement[] = []

  // stop 1: start
  p.push({ t: 0.03, lateral: -12, model: 'suburban/building-type-a', fit: { len: 8 } })
  p.push({ t: 0.065, lateral: -14, model: 'suburban/building-type-c', fit: { len: 7 } })
  p.push({ t: 0.02, lateral: 7.5, model: 'nature/sign', fit: { h: 2.4 }, rot: Math.PI * 0.1 })
  p.push({ t: 0.045, lateral: 9, model: 'nature/tree_default', fit: { h: 5.5 } })
  p.push({ t: 0.05, lateral: 12, model: 'nature/tree_oak', fit: { h: 6.5 } })
  p.push({ t: 0.035, lateral: 14, model: 'nature/tree_pineDefaultA', fit: { h: 5 } })
  for (let i = 0; i < 5; i++) p.push({ t: 0.005 + i * 0.008, lateral: -7.6, model: 'nature/fence_simple', fit: { w: 2.6 } })
  // milestone signposts
  p.push({ t: 0.115, lateral: 8, model: 'nature/sign', fit: { h: 2.8 } })
  p.push({ t: 0.15, lateral: -8, model: 'nature/sign', fit: { h: 2.8 } })
  treeRun(p, rand, 0.06, 14, 0.011, 8, 6, 4.5, 2.5)

  // stop 2: town
  p.push({ t: 0.215, lateral: 16, model: 'commercial/building-e', fit: { len: 12 } })
  p.push({ t: 0.232, lateral: -12, model: 'commercial/building-c', fit: { len: 8 } })
  p.push({ t: 0.235, lateral: 13, model: 'commercial/building-skyscraper-a', fit: { h: 22 } })
  p.push({ t: 0.252, lateral: 18, model: 'commercial/building-b', fit: { len: 10 } })
  p.push({ t: 0.255, lateral: -14, model: 'suburban/building-type-e', fit: { len: 7 } })
  p.push({ t: 0.245, lateral: -9, model: 'nature/tree_detailed', fit: { h: 5 } })
  p.push({ t: 0.2, lateral: 10, model: 'nature/tree_tall', fit: { h: 6 } })
  p.push({ t: 0.265, lateral: -10, model: 'nature/tree_fat', fit: { h: 5.5 } })
  p.push({ t: 0.225, lateral: 9, model: 'nature/tree_pineRoundA', fit: { h: 5 } })

  // stop 3: workshop
  p.push({ t: 0.395, lateral: 16, model: 'industrial/building-a', fit: { len: 14 } })
  p.push({ t: 0.405, lateral: -11, model: 'industrial/shipping-container-a', fit: { len: 6 } })
  p.push({ t: 0.412, lateral: -11.5, model: 'industrial/shipping-container-b', fit: { len: 6 }, dx: 1.2 })
  p.push({ t: 0.41, lateral: 21, model: 'industrial/detail-tank', fit: { h: 7 } })
  treeRun(p, rand, 0.28, 10, 0.012, 8, 5, 4.5, 2.5)

  // stop 4: harbour
  p.push({ t: 0.56, lateral: 18, model: 'industrial/building-c', fit: { len: 16 } })
  p.push({ t: 0.585, lateral: -12, model: 'industrial/shipping-container-c', fit: { len: 6 } })
  p.push({ t: 0.593, lateral: -13, model: 'industrial/detail-tank-large', fit: { h: 6 } })
  p.push({ t: 0.575, lateral: 14, model: 'industrial/water-tower', fit: { h: 14 } })
  p.push({ t: 0.6, lateral: -13, model: 'commercial/building-skyscraper-c', fit: { h: 20 } })
  p.push({ t: 0.61, lateral: 15, model: 'commercial/building-skyscraper-b', fit: { h: 24 } })
  p.push({ t: 0.565, lateral: 23, model: 'industrial/chimney-large', fit: { h: 16 } })

  // stop 5: hills
  p.push({ t: 0.7, lateral: 18, model: 'industrial/windmill', fit: { h: 16 } })
  p.push({ t: 0.735, lateral: 24, model: 'industrial/windmill', fit: { h: 14 } })
  p.push({ t: 0.77, lateral: 19, model: 'industrial/windmill', fit: { h: 15 } })
  p.push({ t: 0.75, lateral: 12, model: 'industrial/solar-panel-landscape-group', fit: { w: 8 } })
  treeRun(p, rand, 0.66, 16, 0.014, 7, 8, 4, 3)

  // stop 6: coast
  p.push({ t: 0.957, lateral: 11, model: 'suburban/building-type-b', fit: { len: 7 } })
  p.push({ t: 0.948, lateral: 15, model: 'nature/tree_palmDetailedTall', fit: { h: 8 } })
  p.push({ t: 0.968, lateral: 14, model: 'nature/tree_palm', fit: { h: 7 } })
  p.push({ t: 0.972, lateral: -9, model: 'nature/tree_simple', fit: { h: 5 } })
  p.push({ t: 0.978, lateral: -8, model: 'nature/rock_largeA', fit: { len: 4 } })

  return p
}

export const BILLBOARDS: { t: number; lateral: number }[] = [
  { t: 0.405, lateral: 12 },
  { t: 0.715, lateral: 11.5 },
  { t: 0.739, lateral: 14.5 },
  { t: 0.763, lateral: 11.5 },
]

export const PIER_POSTS: { t: number; lateral: number }[] = Array.from({ length: 6 }, (_, i) => ({ t: 0.52 + i * 0.02, lateral: -7.5 }))

export const WATER = [
  { x: -64, z: -296, w: 90, d: 70 },
  { x: 0, z: -560, w: 260, d: 140 },
]

// Hills are placed relative to the road so they can never sit on it. route.test.ts checks the
// clearance against the sampled curve, since the road bends toward and away from them.
export const HILLS: { t: number; lateral: number; r: number; h: number; dark: boolean }[] = [
  { t: 0.66, lateral: 56, r: 24, h: 8, dark: false },
  { t: 0.7, lateral: -50, r: 22, h: 9, dark: false },
  { t: 0.745, lateral: 64, r: 30, h: 12, dark: true },
  { t: 0.78, lateral: -54, r: 26, h: 10, dark: true },
  { t: 0.82, lateral: 50, r: 20, h: 7, dark: false },
]
export const HILL_CLEARANCE = 4 // metres between a hill's edge and the kerb, at minimum

export const CAR_MODEL = 'car/sedan'
export const CAR_LENGTH = 4.4

// every model path the scene can request, used by the copy script and a test
export function usedModels(): string[] {
  const set = new Set<string>([CAR_MODEL, ...buildPlacements().map((p) => p.model)])
  return [...set].sort()
}
