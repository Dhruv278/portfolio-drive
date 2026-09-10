# Session A: painter, camera modes, garage intro, MedChron set piece. Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The car starts inside a garage with the owner's name on the door, drives out in a short intro, and the MedChron stop shows records becoming a cited chronology, with a counter board that counts up on arrival.

**Architecture:** Set pieces are React components under `src/components/scene/pieces/`, built from textured primitives and Canvas-painted textures, positioned with the road helpers. A module-level intro state in `useDriveFrame.ts` drives the car and the door for 3.5 s after the warm-up; the chase camera gains `intro` and `arrival` poses blended in its frame loop. Content and layout numbers live in `profile.ts` and `route.ts` so the existing content and route tests cover them.

**Tech Stack:** Next.js 16 App Router, React 19, @react-three/fiber 9.7, @react-three/drei 10.7, three 0.185, zustand 5, vitest 5, Playwright 1.63. Windows, PowerShell or Git Bash. Dev server for manual checks: `npx next dev -p 3778` (already running on this machine). Screenshot tool: `node C:/Users/Dhruvgopani/AppData/Local/Temp/claude/C--/b35624e8-932f-4077-846b-8409fdc8ceab/scratchpad/shot.mjs <name> <url> <stopId|start> [w] [h]` writes PNGs to `.../scratchpad/shots/` and prints fps (needs the debug Chrome on port 9222).

**Spec:** `docs/superpowers/specs/2026-09-10-world-tells-the-story-design.md` (and its parent `2026-09-07-realistic-world-design.md` for budgets).

## Global Constraints

- Frame rate while driving on Intel Iris Xe at dpr 1.25: 30 fps or better. Idle: zero frames (rendering stays on demand, animation only while the idle loop is awake).
- First-paint assets under 10 MB (`src/lib/budget.test.ts` enforces). New textures ship as 1k or 512 WebP.
- No material recompiles mid-drive: every material and light exists at mount. No real lights added (light count change recompiles everything). Glow is additive geometry.
- Heavy GPU set-up only inside the warm-up in `Scene.tsx` `CompileWhenLoaded`.
- Content rules (`bannedPatterns` in `profile.ts`, enforced by test): no em or en dashes, no semicolons, no "leverage/seamless/robust/..." words, US spelling. All painted text comes from `profile.ts`.
- Reduced motion (`readRoadT().reduced`): no intro, no arrival cut, nothing moves. Final states still visible.
- React Compiler lint (`react-hooks/immutability`): mutate refs and module-level objects only inside `useFrame` or effects, never hook-returned values during render. No synchronous `setState` in effects.
- Mobile layout is `isMobileSize(width, height)` from `src/lib/layout.ts`; the scene reads it through `useIsMobile()`.
- Commit after every task with a message that states the problem and the change, ending with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Run `npx tsc --noEmit`, `npx eslint src e2e --max-warnings 0` and `npx vitest run` before each commit.

---

### Task 1: Content for the set pieces

**Files:**
- Modify: `src/content/profile.ts` (add `setPieces`, change the contact `wheel` line)
- Modify: `src/content/profile.test.ts` (collect `setPieces` into the banned-word scan)

**Interfaces:**
- Produces: `export const setPieces` with `garage.door: string`, `medchron.building: string`, `medchron.sample: string`, `medchron.arch: string`, `medchron.chronology: ChronologyCard[]` (six), `medchron.last: string`, `medchron.counters: Counter[]` (three). `export type ChronologyCard = { date: string; provider: string; finding: string; page: string }`, `export type Counter = { label: string; from: number; to: number; suffix: string }`.

- [ ] **Step 1: Write the failing tests**

Add to `src/content/profile.test.ts`, inside `describe('profile content', ...)`, and change the `collectStrings` call to include `setPieces`:

```ts
import { bannedPatterns, identity, milestones, resume, setPieces, stops } from './profile'
// ...
const all = collectStrings({ identity, milestones, stops, resume, setPieces })
// ...
it('gives the MedChron set piece six chronology cards with page citations and three counters', () => {
  expect(setPieces.medchron.chronology).toHaveLength(6)
  for (const c of setPieces.medchron.chronology) expect(c.page).toMatch(/^p\. \d+$/)
  expect(setPieces.medchron.counters.map((c) => c.to)).toEqual([26, 28, 3])
  expect(setPieces.garage.door).toBe('DHRUV GOPANI')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/content/profile.test.ts`
Expected: FAIL, `setPieces` is not exported.

- [ ] **Step 3: Add the content**

In `src/content/profile.ts`, after `skillGroups`:

```ts
export type ChronologyCard = { date: string; provider: string; finding: string; page: string }
export type Counter = { label: string; from: number; to: number; suffix: string }

// Words painted onto the 3D set pieces. Sample data is fictional and labelled as such on the board.
export const setPieces = {
  garage: { door: 'DHRUV GOPANI' },
  medchron: {
    building: 'Medical Records',
    sample: 'Sample record, not a real patient',
    arch: 'Extract and cite',
    chronology: [
      { date: '2024-03-02', provider: 'Riverside ER', finding: 'Rear-end collision, neck and low back pain', page: 'p. 14' },
      { date: '2024-03-09', provider: 'Dr. Patel, Orthopedics', finding: 'Cervical strain, referred to physical therapy', page: 'p. 41' },
      { date: '2024-03-20', provider: 'Northside Physical Therapy', finding: 'Visit 1 of 12, range of motion limited', page: 'p. 77' },
      { date: '2024-05-14', provider: 'Open MRI Center', finding: 'C5 to C6 disc protrusion', page: 'p. 132' },
      { date: '2024-06-03', provider: 'Dr. Patel, Orthopedics', finding: 'Epidural steroid injection', page: 'p. 168' },
      { date: '2024-08-19', provider: 'Northside Physical Therapy', finding: 'Discharged, goals met', page: 'p. 214' },
    ] as ChronologyCard[],
    last: 'Cited chronology',
    counters: [
      { label: 'Medication rows without a start date', from: 53, to: 26, suffix: '%' },
      { label: 'Defects worked through for Chi', from: 0, to: 28, suffix: '' },
      { label: 'QA rounds', from: 0, to: 3, suffix: '' },
    ] as Counter[],
  },
} as const
```

Change the contact stop's `wheel` line (the playground promise is gone from the plan):

```ts
    wheel: 'The road ends here. The inbox does not.',
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/content/profile.test.ts`
Expected: PASS (all five plus the new one). If the banned-word test fails, the offending string is printed: fix the wording in `setPieces`.

- [ ] **Step 5: Commit**

```bash
git add src/content/profile.ts src/content/profile.test.ts
git commit -m "Content for the garage and MedChron set pieces" -m "Set pieces paint words onto the scene, so the words live in profile.ts where the banned-word test covers them. Sample chronology is fictional and labelled." -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Pure math for pieces, intro and parking

**Files:**
- Create: `src/lib/pieceMath.ts`
- Create: `src/lib/pieceMath.test.ts`
- Modify: `src/lib/scroll.ts` (add `parkedStop`)
- Modify: `src/lib/scroll.test.ts`

**Interfaces:**
- Produces: `easeInOut(x: number): number`, `smoothstep(a: number, b: number, x: number): number`, `introPhase(elapsed: number): { door: number; car: number; camera: number; done: boolean }`, `INTRO_DURATION = 3.5`, `conveyorU(i: number, count: number, time: number, speed: number): number`, `counterValue(from: number, to: number, k: number): number`, `wrapText(text: string, maxChars: number): string[]`, and in `scroll.ts` `parkedStop(s: number, zones: Zone[]): number` (index or -1).

- [ ] **Step 1: Write the failing tests**

`src/lib/pieceMath.test.ts`:

```ts
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
    expect(conveyorU(3, 4, 5, 0.1)).toBeCloseTo(0.25, 6) // 0.75 + 0.5 wraps to 0.25
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
```

Add to `src/lib/scroll.test.ts` (import `parkedStop` from `./scroll`):

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/pieceMath.test.ts src/lib/scroll.test.ts`
Expected: FAIL, module `./pieceMath` not found and `parkedStop` not exported.

- [ ] **Step 3: Implement**

`src/lib/pieceMath.ts`:

```ts
// Pure timing and layout helpers for the set pieces, the intro and painted text. No three, no DOM.

export const INTRO_DURATION = 3.5 // seconds
// Door rolls up first, the car rolls out while the door is still finishing, the camera swings last.
const DOOR = [0, 1.2] as const
const CAR = [1.0, 3.3] as const
const CAMERA = [1.4, 3.5] as const

export function easeInOut(x: number): number {
  const t = Math.min(1, Math.max(0, x))
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export function introPhase(elapsed: number): { door: number; car: number; camera: number; done: boolean } {
  return {
    door: smoothstep(DOOR[0], DOOR[1], elapsed),
    car: easeInOut((elapsed - CAR[0]) / (CAR[1] - CAR[0])),
    camera: smoothstep(CAMERA[0], CAMERA[1], elapsed),
    done: elapsed >= INTRO_DURATION,
  }
}

// Position of item i of count along a looping conveyor, 0 at the start, wrapping at 1.
export function conveyorU(i: number, count: number, time: number, speed: number): number {
  const u = (i / count + time * speed) % 1
  return u < 0 ? u + 1 : u
}

export function counterValue(from: number, to: number, k: number): number {
  return Math.round(from + (to - from) * easeInOut(k))
}

// Greedy word wrap by character count. A word longer than the limit stands on its own line.
export function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (!line) line = word
    else if (line.length + 1 + word.length <= maxChars) line += ' ' + word
    else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines
}
```

Append to `src/lib/scroll.ts`:

```ts
// Index of the stop whose plateau contains the scroll fraction, or -1 while driving between stops.
export function parkedStop(s: number, zones: Zone[]): number {
  for (let i = 0; i < zones.length; i++) if (s >= zones[i].a && s <= zones[i].b) return i
  return -1
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/lib/pieceMath.test.ts src/lib/scroll.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pieceMath.ts src/lib/pieceMath.test.ts src/lib/scroll.ts src/lib/scroll.test.ts
git commit -m "Pure timing, conveyor, counter and wrap helpers for the set pieces" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Route layout for the garage, the MedChron piece and the arrival camera

**Files:**
- Modify: `src/content/route.ts`
- Modify: `src/content/route.test.ts`
- Modify: `scripts/used-models.json` (regenerated)
- Modify: `src/components/scene/roadCurve.ts` (add `frameAt`)

**Interfaces:**
- Produces in `route.ts`: `export type CameraPose = { back: number; side: number; up: number; lookSide: number; lookAhead: number; lookY: number }`, `export const ARRIVAL_POSES: CameraPose[]` (six, desktop), `export const ARRIVAL_POSE_PHONE: CameraPose`, `export const GARAGE = { width: 7.6, depth: 12, height: 4.4, centerZ: 1, doorZ: 7, doorHeight: 3.6 }`, `export const MEDCHRON = { lateral: 15, buildingT: 0.19, buildingLen: 18, conveyorLateral: 9, conveyorStart: 0.183, archT: 0.205, conveyorEnd: 0.225, signLateral: 8.5, signTs: [0.208, 0.214, 0.22, 0.226, 0.232, 0.238], boardT: 0.19 }`, `export const INTRO_CAMERA: CameraPose`.
- Produces in `roadCurve.ts`: `frameAt(t: number, out?: Frame): Frame` where `Frame = { position: Vector3; quaternion: Quaternion; tangent: Vector3; right: Vector3 }` and the quaternion turns local +z onto the road tangent (so local +z is forward, local +x is the camera side).

- [ ] **Step 1: Write the failing tests**

Add to `src/content/route.test.ts` (extend the import from `./route` with `ARRIVAL_POSES, GARAGE, MEDCHRON`):

```ts
it('has one arrival pose per stop that sits higher and wider than the chase', () => {
  expect(ARRIVAL_POSES).toHaveLength(T_STOPS.length)
  for (const p of ARRIVAL_POSES) {
    expect(p.up).toBeGreaterThan(8.6)
    expect(p.back).toBeGreaterThan(15.5)
  }
})

it('keeps the MedChron piece clear of the tarmac and in order along the road', () => {
  expect(MEDCHRON.conveyorLateral).toBeGreaterThan(ROAD_HALF_WIDTH + KERB_WIDTH + 1)
  expect(MEDCHRON.signLateral).toBeGreaterThan(ROAD_HALF_WIDTH + KERB_WIDTH + 1)
  expect(MEDCHRON.conveyorStart).toBeLessThan(MEDCHRON.archT)
  expect(MEDCHRON.archT).toBeLessThan(MEDCHRON.conveyorEnd)
  expect(MEDCHRON.signTs).toHaveLength(6)
  for (let i = 1; i < MEDCHRON.signTs.length; i++) expect(MEDCHRON.signTs[i]).toBeGreaterThan(MEDCHRON.signTs[i - 1])
  expect(MEDCHRON.signTs[0]).toBeGreaterThan(MEDCHRON.archT)
  expect(MEDCHRON.signTs[5]).toBeLessThan(T_STOPS[1] + 0.035)
})

it('no longer ships the two Kenney buildings the records building replaces', () => {
  expect(usedModels()).not.toContain('commercial/building-e')
  expect(usedModels()).not.toContain('commercial/building-skyscraper-a')
})

it('starts the garage door ahead of the car and the car inside the garage', () => {
  expect(GARAGE.doorZ).toBeGreaterThan(CAR_LENGTH / 2)
  expect(GARAGE.centerZ - GARAGE.depth / 2).toBeLessThan(-CAR_LENGTH / 2)
})
```

Also import `CAR_LENGTH` from `./route` in the test.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/content/route.test.ts`
Expected: FAIL on the new exports.

- [ ] **Step 3: Add the layout to `route.ts`**

Remove these two lines from `buildPlacements()` under `// stop 2: town`:

```ts
  p.push({ t: 0.215, lateral: 16, model: 'commercial/building-e', fit: { len: 12 } })
  p.push({ t: 0.235, lateral: 13, model: 'commercial/building-skyscraper-a', fit: { h: 22 } })
```

Append after `CAR_LENGTH`:

```ts
// Camera poses. back and side are metres from the car along and across the road (negative side is
// the camera's usual side), up is height, look* offsets the aim point the same way.
export type CameraPose = { back: number; side: number; up: number; lookSide: number; lookAhead: number; lookY: number }

// Parked at a stop the camera rises and pulls back to frame the set piece on the +lateral side.
export const ARRIVAL_POSES: CameraPose[] = [
  { back: 17, side: -8, up: 9.5, lookSide: 3, lookAhead: 10, lookY: 1.8 }, // start
  { back: 19, side: -9, up: 11, lookSide: 6, lookAhead: 6, lookY: 2.4 }, // medchron: building, conveyor, signs
  { back: 18, side: -9, up: 10.5, lookSide: 5, lookAhead: 6, lookY: 2.2 }, // products
  { back: 20, side: -8, up: 12, lookSide: 4, lookAhead: 8, lookY: 2.6 }, // platforms
  { back: 18, side: -9, up: 10.5, lookSide: 5, lookAhead: 6, lookY: 2.2 }, // skills
  { back: 17, side: -7, up: 10, lookSide: 2, lookAhead: 12, lookY: 2.0 }, // contact
]
export const ARRIVAL_POSE_PHONE: CameraPose = { back: 13, side: -1.6, up: 14, lookSide: 0.3, lookAhead: 2, lookY: -4 }

// The garage the car starts in, in the road frame at t = 0: local +z is forward along the road.
export const GARAGE = { width: 7.6, depth: 12, height: 4.4, centerZ: 1, doorZ: 7, doorHeight: 3.6 }
// Intro camera: in front of the door, low, looking at the door. Blends into the chase pose.
export const INTRO_CAMERA: CameraPose = { back: -16, side: 2.5, up: 1.8, lookSide: 0, lookAhead: 7, lookY: 1.9 }

// MedChron set piece, all on the camera side. Conveyor runs from the dock past the arch, then the
// six chronology signposts stand along the road up to the stop.
export const MEDCHRON = {
  lateral: 15,
  buildingT: 0.19,
  buildingLen: 18,
  conveyorLateral: 9,
  conveyorStart: 0.183,
  archT: 0.205,
  conveyorEnd: 0.225,
  signLateral: 8.5,
  signTs: [0.208, 0.214, 0.22, 0.226, 0.232, 0.238],
  boardT: 0.19,
} as const
```

Add `frameAt` to `src/components/scene/roadCurve.ts`:

```ts
const FORWARD = new Vector3(0, 0, 1)
export type Frame = { position: Vector3; quaternion: Quaternion; tangent: Vector3; right: Vector3 }

// A frame on the road centre at t: local +z points along the road, local +x to the camera side.
export function frameAt(t: number, out?: Frame): Frame {
  const curve = roadCurve()
  const o = out ?? { position: new Vector3(), quaternion: new Quaternion(), tangent: new Vector3(), right: new Vector3() }
  curve.getPointAt(t, o.position)
  curve.getTangentAt(t, o.tangent).setY(0).normalize()
  o.right.crossVectors(UP, o.tangent).normalize()
  o.quaternion.setFromUnitVectors(FORWARD, o.tangent)
  return o
}
```

Regenerate the allowlist and re-copy models:

```bash
npx tsx scripts/gen-used-models.mts
npm run copy:models
```

(If `npx tsx` is not installed it will prompt to download; accept. `copy:models` removes nothing, it copies the current list; the two dropped GLBs may stay on disk, which is fine, the budget test still counts them: delete `public/models/commercial/building-e.glb` and `public/models/commercial/building-skyscraper-a.glb` by hand.)

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/content/route.test.ts src/lib/budget.test.ts`
Expected: PASS, including "matches the copy script allowlist".

- [ ] **Step 5: Commit**

```bash
git add src/content/route.ts src/content/route.test.ts scripts/used-models.json src/components/scene/roadCurve.ts public/models
git commit -m "Route layout for the garage, MedChron piece and arrival camera poses" -m "Two Kenney buildings at the MedChron stop make way for the records building." -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Textures for the pieces

**Files:**
- Create: `public/textures/pieces/*.webp`
- Create: `src/components/scene/pieces/textures.ts`
- Modify: `LICENSE-ASSETS.md`
- Scratch: `C:/Users/Dhruvgopani/AppData/Local/Temp/claude/C--/b35624e8-932f-4077-846b-8409fdc8ceab/scratchpad/pieces-textures.mjs`

**Interfaces:**
- Produces: `usePieceTextures(): PieceTextures` where `PieceTextures = { brickDiff, brickNor, concreteDiff, concreteNor, corrugatedDiff, corrugatedNor, metalDiff, metalNor }` (all `Texture`, `RepeatWrapping`, repeat 1 by 1, colour maps in sRGB). Callers set `repeat` on a `clone()` per surface.

- [ ] **Step 1: Download the CC0 sets**

Poly Haven 1k JPGs. Run in Git Bash:

```bash
cd "C:/Users/Dhruvgopani/AppData/Local/Temp/claude/C--/b35624e8-932f-4077-846b-8409fdc8ceab/scratchpad/assets"
for id in brick_wall_02 concrete_wall_008 corrugated_iron_02 metal_plate; do
  for map in diff nor_gl; do
    f="${id}_${map}_1k.jpg"
    curl -sSL --retry 2 -o "$f" "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/${id}/${f}"
    echo "$f $(stat -c %s "$f") $(file -b "$f" | cut -c1-20)"
  done
done
```

Every line must read `JPEG image data`. If one says `HTML` or is under 10 KB the id does not exist: open `https://polyhaven.com/textures/brick` (or `/concrete`, `/metal`) in a browser, pick another asset, note its id from the URL, and repeat for that id. Record the final ids for the licence file.

- [ ] **Step 2: Convert to 512 WebP**

`pieces-textures.mjs` in the scratchpad:

```js
import { createRequire } from 'node:module'
const sharp = createRequire('C:/Projects/portfolio-drive/package.json')('sharp')
import { mkdirSync, statSync } from 'node:fs'
const SRC = 'C:/Users/Dhruvgopani/AppData/Local/Temp/claude/C--/b35624e8-932f-4077-846b-8409fdc8ceab/scratchpad/assets'
const OUT = 'C:/Projects/portfolio-drive/public/textures/pieces'
mkdirSync(OUT, { recursive: true })
const sets = [['brick_wall_02', 'brick'], ['concrete_wall_008', 'concrete'], ['corrugated_iron_02', 'corrugated'], ['metal_plate', 'metal']]
let total = 0
for (const [id, name] of sets) {
  for (const [map, suffix, q] of [['diff', 'diff', 78], ['nor_gl', 'nor', 86]]) {
    const out = `${OUT}/${name}_${suffix}.webp`
    await sharp(`${SRC}/${id}_${map}_1k.jpg`).resize(512, 512).webp({ quality: q }).toFile(out)
    total += statSync(out).size
    console.log(out.split('/').pop(), Math.round(statSync(out).size / 1024), 'KB')
  }
}
console.log('total', Math.round(total / 1024), 'KB')
```

Run: `node pieces-textures.mjs`. Expected: eight files, total under 900 KB. Then `npx vitest run src/lib/budget.test.ts` must still pass.

- [ ] **Step 3: Loader hook**

`src/components/scene/pieces/textures.ts`:

```ts
'use client'

// Wall and metal textures for the set pieces (Poly Haven, CC0, 512 WebP). Loaded once, shared.
import { useTexture } from '@react-three/drei'
import { RepeatWrapping, SRGBColorSpace, type Texture } from 'three'

const FILES = {
  brickDiff: '/textures/pieces/brick_diff.webp',
  brickNor: '/textures/pieces/brick_nor.webp',
  concreteDiff: '/textures/pieces/concrete_diff.webp',
  concreteNor: '/textures/pieces/concrete_nor.webp',
  corrugatedDiff: '/textures/pieces/corrugated_diff.webp',
  corrugatedNor: '/textures/pieces/corrugated_nor.webp',
  metalDiff: '/textures/pieces/metal_diff.webp',
  metalNor: '/textures/pieces/metal_nor.webp',
}
export type PieceTextures = Record<keyof typeof FILES, Texture>
const KEYS = Object.keys(FILES) as (keyof typeof FILES)[]

useTexture.preload(Object.values(FILES))

function configure(input: PieceTextures | Texture[]) {
  const list = Array.isArray(input) ? input : Object.values(input)
  list.forEach((tex, i) => {
    tex.wrapS = RepeatWrapping
    tex.wrapT = RepeatWrapping
    tex.anisotropy = 4
    if (KEYS[i].endsWith('Diff')) tex.colorSpace = SRGBColorSpace
    tex.needsUpdate = true
  })
}

export function usePieceTextures(): PieceTextures {
  return useTexture(FILES, configure)
}

// A copy of a texture tiled so one repeat covers `metres` of surface of the given size.
export function tiled(tex: Texture, width: number, height: number, metres = 2): Texture {
  const t = tex.clone()
  t.repeat.set(width / metres, height / metres)
  t.needsUpdate = true
  return t
}
```

- [ ] **Step 4: Licence rows**

In `LICENSE-ASSETS.md`, under the Poly Haven table, add one row per set with the final ids, for example:

```
| `textures/pieces/brick_*.webp` | https://polyhaven.com/a/brick_wall_02 | 0.2 MB |
| `textures/pieces/concrete_*.webp` | https://polyhaven.com/a/concrete_wall_008 | 0.2 MB |
| `textures/pieces/corrugated_*.webp` | https://polyhaven.com/a/corrugated_iron_02 | 0.2 MB |
| `textures/pieces/metal_*.webp` | https://polyhaven.com/a/metal_plate | 0.2 MB |
```

- [ ] **Step 5: Check and commit**

Run: `npx tsc --noEmit && npx eslint src --max-warnings 0 && npx vitest run`
Expected: all pass.

```bash
git add public/textures/pieces src/components/scene/pieces/textures.ts LICENSE-ASSETS.md
git commit -m "Wall and metal textures for the set pieces, CC0, 512 WebP" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: The painter

**Files:**
- Create: `src/components/scene/paint.ts`

**Interfaces:**
- Produces: `makeTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): CanvasTexture` (sRGB, anisotropy 4, `needsUpdate`), `repaint(tex: CanvasTexture, draw): void`, `PALETTE = { paper: '#F6F1E9', paper2: '#EDE6DA', ink: '#1E2A38', ink2: '#55627A', cobalt: '#2F5BEA', white: '#FFFFFF' }`, `fonts(): { display: string; body: string }` (CSS font family strings read from the `--font-display` and `--font-body` variables on `document.documentElement`, falling back to `sans-serif`), and drawing functions: `drawSign(ctx, w, h, text)`, `drawDoor(ctx, w, h, name)`, `drawCard(ctx, w, h, card: ChronologyCard)`, `drawLastCard(ctx, w, h, text)`, `drawBoard(ctx, w, h, title: string, note: string, rows: { label: string; value: string }[])`, `drawArchLabel(ctx, w, h, text)`.
- Consumes: `wrapText` from `src/lib/pieceMath.ts`, `ChronologyCard` from `profile.ts`.

- [ ] **Step 1: Write the module**

```ts
'use client'

// Canvas 2D painter for signs, cards, boards and the garage door, in the site's own design language.
// Everything drawn here is text from profile.ts. Textures are small (512 wide) and repainted rarely.
import { CanvasTexture, SRGBColorSpace } from 'three'
import type { ChronologyCard } from '@/content/profile'
import { wrapText } from '@/lib/pieceMath'

export const PALETTE = { paper: '#F6F1E9', paper2: '#EDE6DA', ink: '#1E2A38', ink2: '#55627A', cobalt: '#2F5BEA', white: '#FFFFFF' } as const

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void

export function fonts(): { display: string; body: string } {
  const css = getComputedStyle(document.documentElement)
  const display = css.getPropertyValue('--font-display').trim() || 'sans-serif'
  const body = css.getPropertyValue('--font-body').trim() || 'sans-serif'
  return { display, body }
}

export function makeTexture(width: number, height: number, draw: Draw): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 4
  repaint(tex, draw)
  return tex
}

export function repaint(tex: CanvasTexture, draw: Draw): void {
  const c = tex.image as HTMLCanvasElement
  const ctx = c.getContext('2d')
  if (!ctx) return
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, c.width, c.height)
  draw(ctx, c.width, c.height)
  tex.needsUpdate = true
}

function paperPanel(ctx: CanvasRenderingContext2D, w: number, h: number, inset = 0) {
  ctx.fillStyle = PALETTE.paper
  ctx.fillRect(inset, inset, w - inset * 2, h - inset * 2)
  ctx.fillStyle = PALETTE.ink
  ctx.fillRect(inset, h - inset - 6, w - inset * 2, 6) // the site's hard drop shadow
}

// A one-line sign: paper board, ink text, cobalt rule.
export function drawSign(ctx: CanvasRenderingContext2D, w: number, h: number, text: string) {
  paperPanel(ctx, w, h)
  const f = fonts()
  ctx.fillStyle = PALETTE.cobalt
  ctx.fillRect(w * 0.08, h * 0.22, w * 0.84, 6)
  ctx.fillStyle = PALETTE.ink
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  let size = h * 0.42
  ctx.font = `800 ${size}px ${f.display}`
  while (ctx.measureText(text).width > w * 0.84 && size > 20) {
    size -= 4
    ctx.font = `800 ${size}px ${f.display}`
  }
  ctx.fillText(text, w / 2, h * 0.62)
}

// The garage roller door: ribbed cobalt metal with the name across the middle.
export function drawDoor(ctx: CanvasRenderingContext2D, w: number, h: number, name: string) {
  ctx.fillStyle = PALETTE.cobalt
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  for (let y = 0; y < h; y += h / 12) ctx.fillRect(0, y, w, 4)
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  for (let y = 8; y < h; y += h / 12) ctx.fillRect(0, y, w, 3)
  const f = fonts()
  ctx.fillStyle = PALETTE.paper
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  let size = h * 0.2
  ctx.font = `800 ${size}px ${f.display}`
  while (ctx.measureText(name).width > w * 0.86 && size > 20) {
    size -= 4
    ctx.font = `800 ${size}px ${f.display}`
  }
  ctx.fillText(name, w / 2, h * 0.5)
}

// One chronology card: date in cobalt, provider, wrapped finding, page citation bottom right.
export function drawCard(ctx: CanvasRenderingContext2D, w: number, h: number, card: ChronologyCard) {
  paperPanel(ctx, w, h)
  const f = fonts()
  const pad = w * 0.08
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = PALETTE.cobalt
  ctx.font = `600 ${h * 0.09}px ${f.body}`
  ctx.fillText(card.date, pad, h * 0.19)
  ctx.fillStyle = PALETTE.ink
  ctx.font = `800 ${h * 0.11}px ${f.display}`
  ctx.fillText(card.provider, pad, h * 0.34)
  ctx.font = `400 ${h * 0.085}px ${f.body}`
  ctx.fillStyle = PALETTE.ink
  wrapText(card.finding, 26).slice(0, 3).forEach((line, i) => ctx.fillText(line, pad, h * (0.48 + i * 0.11)))
  ctx.textAlign = 'right'
  ctx.fillStyle = PALETTE.ink2
  ctx.font = `600 ${h * 0.09}px ${f.body}`
  ctx.fillText(card.page, w - pad, h * 0.88)
  ctx.fillStyle = PALETTE.cobalt
  ctx.fillRect(pad, h * 0.8, w * 0.18, 5)
}

// The closing card: one big line and a check mark.
export function drawLastCard(ctx: CanvasRenderingContext2D, w: number, h: number, text: string) {
  paperPanel(ctx, w, h)
  const f = fonts()
  ctx.fillStyle = PALETTE.cobalt
  ctx.beginPath()
  ctx.arc(w / 2, h * 0.36, h * 0.13, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = PALETTE.paper
  ctx.lineWidth = h * 0.03
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(w / 2 - h * 0.06, h * 0.36)
  ctx.lineTo(w / 2 - h * 0.01, h * 0.42)
  ctx.lineTo(w / 2 + h * 0.07, h * 0.29)
  ctx.stroke()
  ctx.fillStyle = PALETTE.ink
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `800 ${h * 0.12}px ${f.display}`
  wrapText(text, 14).forEach((line, i) => ctx.fillText(line, w / 2, h * (0.64 + i * 0.14)))
}

// The counter board: title, note, and rows of label plus value.
export function drawBoard(ctx: CanvasRenderingContext2D, w: number, h: number, title: string, note: string, rows: { label: string; value: string }[]) {
  paperPanel(ctx, w, h)
  const f = fonts()
  const pad = w * 0.06
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = PALETTE.ink
  ctx.font = `800 ${h * 0.13}px ${f.display}`
  ctx.fillText(title, pad, h * 0.18)
  ctx.fillStyle = PALETTE.ink2
  ctx.font = `400 ${h * 0.06}px ${f.body}`
  ctx.fillText(note, pad, h * 0.27)
  rows.forEach((r, i) => {
    const y = h * (0.45 + i * 0.18)
    ctx.fillStyle = PALETTE.paper2
    ctx.fillRect(pad, y - h * 0.11, w - pad * 2, h * 0.15)
    ctx.fillStyle = PALETTE.ink
    ctx.textAlign = 'left'
    ctx.font = `500 ${h * 0.065}px ${f.body}`
    wrapText(r.label, 30).slice(0, 1).forEach((line) => ctx.fillText(line, pad * 1.5, y))
    ctx.textAlign = 'right'
    ctx.fillStyle = PALETTE.cobalt
    ctx.font = `800 ${h * 0.11}px ${f.display}`
    ctx.fillText(r.value, w - pad * 1.5, y + h * 0.01)
  })
}

// A short label for the scanner arch: ink on cobalt.
export function drawArchLabel(ctx: CanvasRenderingContext2D, w: number, h: number, text: string) {
  ctx.fillStyle = PALETTE.cobalt
  ctx.fillRect(0, 0, w, h)
  const f = fonts()
  ctx.fillStyle = PALETTE.paper
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `800 ${h * 0.5}px ${f.display}`
  ctx.fillText(text, w / 2, h / 2)
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src --max-warnings 0`
Expected: clean. (The painter is exercised by screenshots in Task 9; jsdom has no 2D canvas, so no unit test.)

- [ ] **Step 3: Commit**

```bash
git add src/components/scene/paint.ts
git commit -m "Canvas painter for signs, cards, boards and the garage door" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Piece toolkit: masses, signs, screens, glow

**Files:**
- Create: `src/components/scene/pieces/toolkit.tsx`

**Interfaces:**
- Produces:
  - `Mass({ w, h, d, x = 0, y = 0, z = 0, diff, nor, metres = 2, color = '#ffffff', roughness = 0.9 })`: a textured box standing on y (base at `y`), casts and receives shadows, repeat tiled per face size.
  - `Post({ h, r = 0.08, x = 0, z = 0, color = PALETTE.ink })`: a cylinder standing on the ground.
  - `Sign({ texture, w, h, x = 0, y, z = 0, postHeight })`: a plane showing a `CanvasTexture` on one or two posts (two when `w > 1.2`), plane centre at height `y`.
  - `Screen({ texture, w, h, x, y, z, rotationY = 0 })`: a plane with the texture and a thin ink frame, no posts.
  - `Glow({ w, h, d, x, y, z, color = PALETTE.cobalt, opacity = 0.35 })`: additive, unlit, `depthWrite=false`, `toneMapped=false`, `fog=false` box for light-like glows without real lights.
- Consumes: `PALETTE` from `paint.ts`, `tiled` from `pieces/textures.ts`.

- [ ] **Step 1: Write the toolkit**

```tsx
'use client'

// Building blocks for set pieces: textured masses, posts, signs, screens and additive glow.
import { useMemo } from 'react'
import { AdditiveBlending, DoubleSide, type CanvasTexture, type Texture } from 'three'
import { PALETTE } from '../paint'
import { tiled } from './textures'

type MassProps = { w: number; h: number; d: number; x?: number; y?: number; z?: number; diff: Texture; nor?: Texture; metres?: number; color?: string; roughness?: number }

// A box standing on y with a texture tiled so one repeat covers `metres` on every face.
export function Mass({ w, h, d, x = 0, y = 0, z = 0, diff, nor, metres = 2, color = '#ffffff', roughness = 0.9 }: MassProps) {
  const maps = useMemo(() => ({ map: tiled(diff, Math.max(w, d), h, metres), normalMap: nor ? tiled(nor, Math.max(w, d), h, metres) : undefined }), [diff, nor, w, d, h, metres])
  return (
    <mesh position={[x, y + h / 2, z]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial map={maps.map} normalMap={maps.normalMap} color={color} roughness={roughness} metalness={0} />
    </mesh>
  )
}

export function Post({ h, r = 0.08, x = 0, z = 0, color = PALETTE.ink }: { h: number; r?: number; x?: number; z?: number; color?: string }) {
  return (
    <mesh position={[x, h / 2, z]} castShadow>
      <cylinderGeometry args={[r, r, h, 8]} />
      <meshStandardMaterial color={color} roughness={0.6} metalness={0.3} />
    </mesh>
  )
}

type SignProps = { texture: CanvasTexture; w: number; h: number; x?: number; y: number; z?: number; postHeight: number }

// A painted board at height y on one post (narrow) or two (wide). Faces local -z, so a group
// oriented with poseAt() shows it to the road.
export function Sign({ texture, w, h, x = 0, y, z = 0, postHeight }: SignProps) {
  const two = w > 1.2
  return (
    <group position={[x, 0, z]}>
      {two ? (
        <>
          <Post h={postHeight} x={-w * 0.4} />
          <Post h={postHeight} x={w * 0.4} />
        </>
      ) : (
        <Post h={postHeight} />
      )}
      <mesh position={[0, y, -0.06]} rotation={[0, Math.PI, 0]} castShadow>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={texture} roughness={0.85} metalness={0} side={DoubleSide} />
      </mesh>
    </group>
  )
}

type ScreenProps = { texture: CanvasTexture; w: number; h: number; x?: number; y: number; z?: number; rotationY?: number }

// A painted panel with a thin ink frame, mounted on a wall or a post by the caller.
export function Screen({ texture, w, h, x = 0, y, z = 0, rotationY = 0 }: ScreenProps) {
  return (
    <group position={[x, y, z]} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[w + 0.12, h + 0.12, 0.06]} />
        <meshStandardMaterial color={PALETTE.ink} roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={texture} roughness={0.7} metalness={0} />
      </mesh>
    </group>
  )
}

type GlowProps = { w: number; h: number; d: number; x?: number; y?: number; z?: number; color?: string; opacity?: number }

// Light without a light: an additive translucent box. Real lights would recompile every material.
export function Glow({ w, h, d, x = 0, y = 0, z = 0, color = PALETTE.cobalt, opacity = 0.35 }: GlowProps) {
  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[w, h, d]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} blending={AdditiveBlending} toneMapped={false} fog={false} />
    </mesh>
  )
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src --max-warnings 0`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/scene/pieces/toolkit.tsx
git commit -m "Set-piece toolkit: textured masses, posts, signs, screens, additive glow" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Intro state, camera modes, store flag

**Files:**
- Modify: `src/components/scene/useDriveFrame.ts`
- Modify: `src/components/scene/ChaseCamera.tsx`
- Modify: `src/store/drive.ts`
- Modify: `src/lib/flags.ts` (add `intro`)
- Modify: `src/components/scene/Scene.tsx` (start the intro after the warm-up, expose `data-intro`)
- Modify: `src/components/scene/Car.tsx` (headlights on during the intro)

**Interfaces:**
- Produces in `useDriveFrame.ts`: `startIntro(now: number): void`, `cancelIntro(): void`, `readIntro(): { active: boolean; door: number; car: number; camera: number }`. `stepDrive` returns `false` (keep rendering) while the intro is active and sets `drive.t = T_STOPS[0] * introPhase(elapsed).car`.
- Produces in `drive.ts`: `intro: 'idle' | 'playing' | 'done' | 'skipped'`, `setIntro(v)`.
- Produces in `flags.ts`: `intro: boolean` (`?intro=0` disables).
- Consumes: `introPhase`, `INTRO_DURATION`, `smoothstep` from `pieceMath.ts`; `parkedStop` from `scroll.ts`; `ARRIVAL_POSES`, `ARRIVAL_POSE_PHONE`, `INTRO_CAMERA`, `GARAGE` from `route.ts`; `frameAt` from `roadCurve.ts`.

- [ ] **Step 1: Store and flag**

`src/store/drive.ts`: add to `DriveState`:

```ts
  intro: 'idle' | 'playing' | 'done' | 'skipped'
  setIntro: (v: DriveState['intro']) => void
```

and to the store body:

```ts
  intro: 'idle',
  setIntro: (intro) => set((s) => (s.intro === intro ? s : { intro })),
```

`src/lib/flags.ts`: add `intro: params?.get('intro') !== '0',` to `flags`.

- [ ] **Step 2: Intro state in `useDriveFrame.ts`**

Add imports:

```ts
import { INTRO_DURATION, introPhase } from '@/lib/pieceMath'
```

Add after the `drive` object:

```ts
// The first-load intro: door, car roll-out, camera swing. Module state read by the camera, the car
// and the garage door inside their frame loops. Ends by time, or at once when the visitor scrolls.
const intro = { active: false, start: 0, door: 0, car: 0, camera: 0 }

export function startIntro(now: number) {
  intro.active = true
  intro.start = now
}

export function cancelIntro() {
  if (!intro.active) return
  intro.active = false
  intro.door = intro.car = intro.camera = 1
  useDrive.getState().setIntro('skipped')
}

export function readIntro(): { active: boolean; door: number; car: number; camera: number } {
  return intro
}
```

Change `stepDrive` so the intro drives the road parameter:

```ts
export function stepDrive(delta: number, now = performance.now()): boolean {
  const { scroll, zones, reducedMotion } = useDrive.getState()
  drive.targetS = scroll
  drive.targetT = zones.length ? roadT(scroll, zones, T_STOPS, T_END) : 0
  drive.reduced = reducedMotion
  if (intro.active) {
    const ph = introPhase((now - intro.start) / 1000)
    intro.door = ph.door
    intro.car = ph.car
    intro.camera = ph.camera
    drive.s = drive.targetS
    drive.t = T_STOPS[0] * ph.car
    drive.primed = true
    if (ph.done) {
      intro.active = false
      useDrive.getState().setIntro('done')
    }
    return false
  }
  if (!drive.primed || reducedMotion) {
    // ... unchanged
```

In `DriveClock`, cancel the intro when the visitor scrolls, and pass the timestamp:

```ts
export function DriveClock() {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(
    () =>
      useDrive.subscribe((s, prev) => {
        if (s.scroll !== prev.scroll && s.scroll > 0.002) cancelIntro()
        invalidate()
      }),
    [invalidate],
  )
  useFrame((_, delta) => {
    const settled = stepDrive(delta, performance.now())
    if (!settled) invalidate()
  }, -10)
  return null
}
```

- [ ] **Step 3: Camera modes in `ChaseCamera.tsx`**

Replace the file:

```tsx
'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Vector3 } from 'three'
import { ARRIVAL_POSE_PHONE, ARRIVAL_POSES, INTRO_CAMERA, type CameraPose } from '@/content/route'
import { parkedStop } from '@/lib/scroll'
import { useDrive } from '@/store/drive'
import { frameAt, roadCurve, UP, type Frame } from './roadCurve'
import { readIntro, readRoadT, useIsMobile } from './useDriveFrame'

// Chase poses. Look target raised so the horizon sits about 15 percent down from the top of the
// frame: enough sky for clouds and birds, while the car and road keep the lower two thirds.
const DESKTOP: CameraPose = { back: 15.5, side: -6.5, up: 8.6, lookSide: 1.5, lookAhead: 14, lookY: 2.2 }
const PHONE: CameraPose = { back: 12.5, side: -1.6, up: 12.5, lookSide: 0.3, lookAhead: 1.5, lookY: -4.5 }
const PHONE_HERO: CameraPose = { back: 14, side: -1.6, up: 8.5, lookSide: 0.3, lookAhead: 9, lookY: 0.4 }
// Parked at a stop the camera eases toward the arrival pose; this is how fast.
const ARRIVAL_RATE = 0.045

const scratch: CameraPose = { back: 0, side: 0, up: 0, lookSide: 0, lookAhead: 0, lookY: 0 }
function mixPose(a: CameraPose, b: CameraPose, k: number): CameraPose {
  scratch.back = a.back + (b.back - a.back) * k
  scratch.side = a.side + (b.side - a.side) * k
  scratch.up = a.up + (b.up - a.up) * k
  scratch.lookSide = a.lookSide + (b.lookSide - a.lookSide) * k
  scratch.lookAhead = a.lookAhead + (b.lookAhead - a.lookAhead) * k
  scratch.lookY = a.lookY + (b.lookY - a.lookY) * k
  return scratch
}

export function ChaseCamera() {
  const mobile = useIsMobile()
  const first = useRef(true)
  const arrival = useRef(0) // 0 chase, 1 arrival pose
  const v = useMemo(
    () => ({ pos: new Vector3(), tan: new Vector3(), right: new Vector3(), desired: new Vector3(), look: new Vector3(), camPos: new Vector3(), camLook: new Vector3(), lift: new Vector3(), introPos: new Vector3(), introLook: new Vector3() }),
    [],
  )
  const origin = useMemo<Frame>(() => frameAt(0), [])

  useFrame(({ camera }) => {
    const { s, t, reduced } = readRoadT()
    const zones = useDrive.getState().zones
    const heroCam = mobile && zones.length > 1 && s < zones[1].a * 0.6
    const chase = heroCam ? PHONE_HERO : mobile ? PHONE : DESKTOP

    // Arrival blend: toward 1 while parked at a stop, back to 0 while driving.
    const parked = parkedStop(s, zones)
    const target = parked >= 0 ? 1 : 0
    arrival.current = reduced ? target : arrival.current + (target - arrival.current) * ARRIVAL_RATE
    const arrivalPose = mobile ? ARRIVAL_POSE_PHONE : ARRIVAL_POSES[Math.max(0, parked >= 0 ? parked : useDrive.getState().stopIndex)]
    const c = mixPose(chase, arrivalPose, arrival.current)

    const curve = roadCurve()
    curve.getPointAt(t, v.pos)
    curve.getTangentAt(t, v.tan).setY(0).normalize()
    v.right.crossVectors(UP, v.tan).normalize()
    v.desired.copy(v.pos).addScaledVector(v.tan, -c.back).addScaledVector(v.right, c.side).add(v.lift.set(0, c.up, 0))
    v.look.copy(v.pos).addScaledVector(v.tan, c.lookAhead).addScaledVector(v.right, c.lookSide).add(v.lift.set(0, c.lookY, 0))

    // Intro: start in front of the garage door, swing into the chase pose.
    const intro = readIntro()
    if (intro.active) {
      const ic = INTRO_CAMERA
      v.introPos.copy(origin.position).addScaledVector(origin.tangent, -ic.back).addScaledVector(origin.right, ic.side).add(v.lift.set(0, ic.up, 0))
      v.introLook.copy(origin.position).addScaledVector(origin.tangent, ic.lookAhead).addScaledVector(origin.right, ic.lookSide).add(v.lift.set(0, ic.lookY, 0))
      v.camPos.copy(v.introPos).lerp(v.desired, intro.camera)
      v.camLook.copy(v.introLook).lerp(v.look, intro.camera)
      first.current = false
    } else if (first.current || reduced) {
      v.camPos.copy(v.desired)
      v.camLook.copy(v.look)
      first.current = false
    } else {
      v.camPos.lerp(v.desired, 0.07)
      v.camLook.lerp(v.look, 0.09)
    }
    camera.position.copy(v.camPos)
    camera.lookAt(v.camLook)
  })
  return null
}
```

Note `INTRO_CAMERA.back` is negative, so `-ic.back` places the camera ahead of the origin, in front of the door.

- [ ] **Step 4: Start the intro after the warm-up in `Scene.tsx`**

Import `startIntro` from `./useDriveFrame` and `useDrive` from `@/store/drive`. In `CompileWhenLoaded`, change `finish`:

```ts
    const finish = () => {
      if (done) return
      done = true
      const { invalidate } = get()
      const store = useDrive.getState()
      // Play the intro once, only if the visitor has not scrolled yet and does not prefer reduced motion.
      if (flags.intro && !store.reducedMotion && store.scroll <= 0.002) {
        startIntro(performance.now())
        store.setIntro('playing')
      } else {
        store.setIntro('skipped')
      }
      invalidate()
      onReady()
    }
```

In `Scene()`, read `const intro = useDrive((s) => s.intro)` and add `data-intro={intro}` to the `.scene-root` div.

- [ ] **Step 5: Headlights during the intro in `Car.tsx`**

Import `readIntro` from `./useDriveFrame`. In the frame loop, replace the beam and lamp lines:

```ts
    const intro = readIntro()
    const lit = Math.max(dusk, intro.active ? Math.min(1, intro.door * 1.5) : 0)
    const beam = Math.max(0, lit - 0.2) * BEAM_MAX_OPACITY
    if (beamL.current) beamL.current.opacity = beam
    if (beamR.current) beamR.current.opacity = beam
    if (lampMat.current) lampMat.current.emissiveIntensity = 0.5 + lit * 1.8
    if (tailMat.current) tailMat.current.emissiveIntensity = 0.6 + lit * 1.2
```

- [ ] **Step 6: Check**

Run: `npx tsc --noEmit && npx eslint src --max-warnings 0 && npx vitest run`
Expected: clean and green. Open `http://localhost:3778/?stats=1` in a browser: the camera should start low at the road origin looking back along the road, then swing into the chase over 3.5 s while the car rolls to stop 1; scrolling during the intro snaps to the normal drive. `document.querySelector('[data-testid=scene]').dataset.intro` reads `done` afterwards.

- [ ] **Step 7: Commit**

```bash
git add src/store/drive.ts src/lib/flags.ts src/components/scene/useDriveFrame.ts src/components/scene/ChaseCamera.tsx src/components/scene/Scene.tsx src/components/scene/Car.tsx
git commit -m "Intro state and camera modes: intro swing, arrival pose while parked" -m "The intro drives the road parameter for 3.5 s after the warm-up and ends at once on scroll. Parked at a stop the camera eases to a higher, wider pose that frames the set piece." -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: The garage

**Files:**
- Create: `src/components/scene/pieces/Garage.tsx`
- Modify: `src/components/scene/Scene.tsx` (mount inside the Suspense with Road)

**Interfaces:**
- Produces: `Garage()` component. Object name `piece-garage` on its root group (the e2e test looks it up).
- Consumes: `GARAGE`, `setPieces.garage.door`, `frameAt`, `readIntro`, `Mass`, `Glow`, `usePieceTextures`, `makeTexture`, `drawDoor`.

- [ ] **Step 1: Write the component**

```tsx
'use client'

// The garage the car starts in. Open toward the road ahead; the roller door carries the name and
// rolls up during the intro (readIntro().door), or stands open under reduced motion.
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Mesh } from 'three'
import { setPieces } from '@/content/profile'
import { GARAGE } from '@/content/route'
import { drawDoor, makeTexture, PALETTE } from '../paint'
import { frameAt } from '../roadCurve'
import { readIntro, readRoadT } from '../useDriveFrame'
import { usePieceTextures } from './textures'
import { Glow, Mass } from './toolkit'

const WALL = 0.3

export function Garage() {
  const tex = usePieceTextures()
  const frame = useMemo(() => frameAt(0), [])
  const door = useRef<Mesh>(null)
  const doorTex = useMemo(() => makeTexture(1024, 512, (ctx, w, h) => drawDoor(ctx, w, h, setPieces.garage.door)), [])
  const { width: W, depth: D, height: H, centerZ, doorZ, doorHeight } = GARAGE

  useFrame(() => {
    const d = door.current
    if (!d) return
    const { reduced } = readRoadT()
    const open = reduced ? 1 : readIntro().active ? readIntro().door : 1
    // The door hangs from the lintel: shrink it upward, leaving a rolled band at the top.
    d.scale.y = Math.max(0.08, 1 - open * 0.92)
  })

  return (
    <group name="piece-garage" position={frame.position} quaternion={frame.quaternion}>
      {/* floor slab either side of the road, and behind the road start */}
      <Mass w={W} h={0.08} d={D} z={centerZ} diff={tex.concreteDiff} nor={tex.concreteNor} metres={3} color="#c9c6bf" />
      {/* side walls, back wall, roof */}
      <Mass w={WALL} h={H} d={D} x={-W / 2 + WALL / 2} z={centerZ} diff={tex.brickDiff} nor={tex.brickNor} metres={2.5} />
      <Mass w={WALL} h={H} d={D} x={W / 2 - WALL / 2} z={centerZ} diff={tex.brickDiff} nor={tex.brickNor} metres={2.5} />
      <Mass w={W} h={H} d={WALL} z={centerZ - D / 2 + WALL / 2} diff={tex.brickDiff} nor={tex.brickNor} metres={2.5} />
      <Mass w={W + 0.4} h={0.25} d={D + 0.4} y={H} z={centerZ} diff={tex.corrugatedDiff} nor={tex.corrugatedNor} metres={1.5} color="#8e949c" />
      {/* lintel above the door, then the door itself hanging from it */}
      <Mass w={W} h={H - doorHeight} d={WALL} y={doorHeight} z={doorZ} diff={tex.brickDiff} nor={tex.brickNor} metres={2.5} />
      <group position={[0, doorHeight, doorZ]}>
        <mesh ref={door} position={[0, 0, 0]} castShadow>
          {/* geometry hangs below the group origin so scaling y rolls the door up */}
          <planeGeometry args={[W - WALL * 2, doorHeight]} />
          <meshStandardMaterial map={doorTex} roughness={0.55} metalness={0.35} />
        </mesh>
      </group>
      {/* a workbench at the back and a warm glow inside */}
      <Mass w={2.6} h={0.9} d={0.8} x={-W / 2 + 1.7} z={centerZ - D / 2 + 1} diff={tex.metalDiff} nor={tex.metalNor} metres={1} color="#a9a9a9" />
      <Glow w={W - 1} h={0.4} d={D - 2} y={H - 0.5} z={centerZ} color="#ffd9a8" opacity={0.18} />
      <mesh position={[0, H - 0.3, centerZ]}>
        <boxGeometry args={[1.2, 0.08, 0.3]} />
        <meshStandardMaterial color={PALETTE.paper} emissive="#ffe2b8" emissiveIntensity={1.4} />
      </mesh>
    </group>
  )
}
```

The door plane's geometry is centred on the group origin, so before the first frame it would straddle the lintel. Fix that inside the `useMemo` that builds the door: instead of `planeGeometry` JSX, translate the geometry once:

```tsx
  const doorGeo = useMemo(() => {
    const g = new PlaneGeometry(W - WALL * 2, doorHeight)
    g.translate(0, -doorHeight / 2, 0) // hang from the top edge
    return g
  }, [W, doorHeight])
```

and use `<mesh ref={door} geometry={doorGeo} castShadow>` (import `PlaneGeometry` from three; drop the `<planeGeometry>` child).

- [ ] **Step 2: Mount it**

In `Scene.tsx` `World`, inside the `<Suspense>` after `<Road />`: `<Garage />` (import from `./pieces/Garage`).

- [ ] **Step 3: Check and screenshot**

Run: `npx tsc --noEmit && npx eslint src --max-warnings 0`. Then:

```bash
node C:/Users/Dhruvgopani/AppData/Local/Temp/claude/C--/b35624e8-932f-4077-846b-8409fdc8ceab/scratchpad/shot.mjs garage "http://localhost:3778/?stats=1&intro=0" start
```

Open the PNG. Expected: the car sits inside a brick garage at the road's origin with the door open, name legible when looking back. Then load `http://localhost:3778/?stats=1` in the debug Chrome and watch the intro once: the door rolls up, headlights on, car rolls out, camera swings. Adjust `INTRO_CAMERA` in `route.ts` if the door is not framed.

- [ ] **Step 4: Commit**

```bash
git add src/components/scene/pieces/Garage.tsx src/components/scene/Scene.tsx src/content/route.ts
git commit -m "The garage: brick shed at the road origin with the name on a roller door" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: The MedChron set piece

**Files:**
- Create: `src/components/scene/pieces/MedChron.tsx`
- Modify: `src/components/scene/Scene.tsx` (mount)

**Interfaces:**
- Produces: `MedChron()` component, root group named `piece-medchron`. Counters start when `parkedStop(s, zones) === 1` and repaint at most 24 times a second; the sheets move only while frames are being requested (idle loop) and not under reduced motion.
- Consumes: `MEDCHRON`, `T_STOPS`, `setPieces.medchron`, `poseAt`, `readRoadT`, `parkedStop`, `conveyorU`, `counterValue`, painter functions, toolkit, `usePieceTextures`.

- [ ] **Step 1: Write the component**

```tsx
'use client'

// MedChron: records in, cited chronology out. A records building with a loading dock, a conveyor of
// paper sheets that pass through a scanner arch and continue as cards, six chronology signposts,
// and a board that counts up the resume's numbers when the car parks.
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, InstancedMesh, Matrix4, Quaternion, Vector3, type CanvasTexture } from 'three'
import { setPieces } from '@/content/profile'
import { MEDCHRON } from '@/content/route'
import { conveyorU, counterValue } from '@/lib/pieceMath'
import { parkedStop } from '@/lib/scroll'
import { useDrive } from '@/store/drive'
import { drawArchLabel, drawBoard, drawCard, drawLastCard, drawSign, makeTexture, PALETTE, repaint } from '../paint'
import { poseAt } from '../roadCurve'
import { readRoadT } from '../useDriveFrame'
import { usePieceTextures } from './textures'
import { Glow, Mass, Post, Screen, Sign } from './toolkit'

const SHEETS = 36
const SHEET_SPEED = 0.05 // conveyor lengths per second
const ARCH_U = 0.52 // where along the conveyor the arch stands
const BELT_Y = 1.05
const COUNT_SECONDS = 1.8
const REPAINT_EVERY = 1 / 24

const m4 = new Matrix4()
const q = new Quaternion()
const scale = new Vector3()
const pos = new Vector3()
const white = new Color(PALETTE.white)
const paper = new Color(PALETTE.paper)

export function MedChron() {
  const tex = usePieceTextures()
  const invalidate = useThree((s) => s.invalidate)
  const md = setPieces.medchron
  const L = MEDCHRON

  // Conveyor line in world space, and the arch pose on it.
  const belt = useMemo(() => {
    const a = poseAt(L.conveyorStart, L.conveyorLateral).position.clone()
    const b = poseAt(L.conveyorEnd, L.conveyorLateral).position.clone()
    const dir = b.clone().sub(a)
    const length = dir.length()
    dir.normalize()
    const mid = a.clone().addScaledVector(dir, length / 2)
    const yaw = Math.atan2(dir.x, dir.z)
    const arch = a.clone().addScaledVector(dir, length * ARCH_U)
    return { a, dir, length, mid, yaw, arch }
  }, [L])

  const building = useMemo(() => poseAt(L.buildingT, L.lateral), [L])
  const signs = useMemo(() => L.signTs.map((t) => poseAt(t, L.signLateral)), [L])

  // Painted textures. Cards are painted once; the board is repainted while counting.
  const signTex = useMemo(() => makeTexture(1024, 256, (c, w, h) => drawSign(c, w, h, md.building)), [md.building])
  const archTex = useMemo(() => makeTexture(1024, 192, (c, w, h) => drawArchLabel(c, w, h, md.arch)), [md.arch])
  const cardTex = useMemo(() => md.chronology.map((card) => makeTexture(512, 512, (c, w, h) => drawCard(c, w, h, card))), [md.chronology])
  const lastTex = useMemo(() => makeTexture(512, 512, (c, w, h) => drawLastCard(c, w, h, md.last)), [md.last])
  const boardTex = useMemo<CanvasTexture>(() => makeTexture(1024, 640, (c, w, h) => drawBoard(c, w, h, 'MedChron', md.sample, md.counters.map((r) => ({ label: r.label, value: `${r.from}${r.suffix}` })))), [md])

  const sheets = useRef<InstancedMesh>(null)
  const count = useRef({ started: -1, k: 0, lastPaint: 0, finished: false })

  useFrame(({ clock }) => {
    const { s, reduced } = readRoadT()
    const now = clock.elapsedTime

    // Sheets ride the belt; past the arch they grow into paper cards.
    const inst = sheets.current
    if (inst) {
      for (let i = 0; i < SHEETS; i++) {
        const u = reduced ? i / SHEETS : conveyorU(i, SHEETS, now, SHEET_SPEED)
        const card = u > ARCH_U
        pos.copy(belt.a).addScaledVector(belt.dir, u * belt.length)
        pos.y = BELT_Y + (card ? 0.1 : 0.02)
        q.setFromAxisAngle(new Vector3(0, 1, 0), belt.yaw + (card ? 0 : Math.sin(i * 7.3) * 0.12))
        scale.set(card ? 0.9 : 0.62, 0.012, card ? 1.15 : 0.86)
        inst.setMatrixAt(i, m4.compose(pos, q, scale))
        inst.setColorAt(i, card ? paper : white)
      }
      inst.instanceMatrix.needsUpdate = true
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true
    }

    // The board counts up once, when the car first parks here.
    const c = count.current
    const parked = parkedStop(s, useDrive.getState().zones) === 1
    if (parked && c.started < 0) c.started = now
    if (c.started >= 0 && !c.finished) {
      c.k = reduced ? 1 : Math.min(1, (now - c.started) / COUNT_SECONDS)
      if (now - c.lastPaint >= REPAINT_EVERY || c.k >= 1) {
        c.lastPaint = now
        const rows = md.counters.map((r) => ({ label: r.label, value: `${counterValue(r.from, r.to, c.k)}${r.suffix}` }))
        repaint(boardTex, (ctx, w, h) => drawBoard(ctx, w, h, 'MedChron', md.sample, rows))
      }
      if (c.k >= 1) c.finished = true
      else invalidate()
    }
  })

  const bw = L.buildingLen
  return (
    <group name="piece-medchron">
      {/* records building: concrete base, brick body, corrugated roof, sign on the road face */}
      <group position={building.position} quaternion={building.quaternion}>
        <Mass w={bw} h={0.6} d={11} diff={tex.concreteDiff} nor={tex.concreteNor} metres={3} color="#b9b6ae" />
        <Mass w={bw - 0.4} h={6.2} d={10.4} y={0.6} diff={tex.brickDiff} nor={tex.brickNor} metres={2.5} color="#d8cfc4" />
        <Mass w={bw + 0.6} h={0.4} d={11.4} y={6.8} diff={tex.corrugatedDiff} nor={tex.corrugatedNor} metres={1.5} color="#8e949c" />
        {/* loading dock toward the road (local -z faces the road in a poseAt frame) */}
        <Mass w={5} h={1.1} d={2.4} x={-bw * 0.28} z={-6.4} diff={tex.concreteDiff} nor={tex.concreteNor} metres={2} color="#b9b6ae" />
        <Glow w={4.6} h={3.2} d={0.3} x={-bw * 0.28} y={2.8} z={-5.3} color="#ffe2b8" opacity={0.12} />
        <Sign texture={signTex} w={6} h={1.5} y={5.3} z={-5.9} postHeight={0.1} />
        <Screen texture={boardTex} w={5.6} h={3.5} x={bw * 0.22} y={3.6} z={-5.35} />
      </group>

      {/* conveyor: two rails and the sheets riding them */}
      <group position={belt.mid} rotation={[0, belt.yaw, 0]}>
        <mesh position={[0, BELT_Y - 0.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.3, 0.1, belt.length]} />
          <meshStandardMaterial map={tex.metalDiff} normalMap={tex.metalNor} color="#6d7278" roughness={0.6} metalness={0.5} />
        </mesh>
        {Array.from({ length: Math.floor(belt.length / 3) + 1 }, (_, i) => (
          <group key={i} position={[0, 0, -belt.length / 2 + i * 3]}>
            <Post h={BELT_Y - 0.1} r={0.06} x={-0.55} />
            <Post h={BELT_Y - 0.1} r={0.06} x={0.55} />
          </group>
        ))}
      </group>
      <instancedMesh ref={sheets} args={[undefined, undefined, SHEETS]} frustumCulled={false} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.9} metalness={0} />
      </instancedMesh>

      {/* scanner arch over the belt: two posts, a lintel with the label, cobalt glow through the gap */}
      <group position={belt.arch} rotation={[0, belt.yaw, 0]}>
        <Post h={2.6} r={0.12} x={-1.1} color="#3a4250" />
        <Post h={2.6} r={0.12} x={1.1} color="#3a4250" />
        <Screen texture={archTex} w={2.6} h={0.5} y={2.75} />
        <Glow w={2.0} h={1.5} d={0.4} y={BELT_Y + 0.8} color={PALETTE.cobalt} opacity={0.32} />
      </group>

      {/* six chronology signposts, then the closing card */}
      {signs.map((pose, i) => (
        <group key={i} position={pose.position} quaternion={pose.quaternion}>
          <Sign texture={i < 5 ? cardTex[i] : lastTex} w={1.7} h={1.7} y={2.35} postHeight={1.5} />
        </group>
      ))}
    </group>
  )
}
```

Note: `q.setFromAxisAngle(new Vector3(0, 1, 0), ...)` allocates per instance per frame. Hoist `const yAxis = new Vector3(0, 1, 0)` to module scope and use it.

There are six `signTs` and six chronology cards, but the closing card replaces the sixth position. Keep the six cards as content and show cards 0 to 4 plus the closing card, as written (`i < 5 ? cardTex[i] : lastTex`). The sixth card remains in `profile.ts` for the resume page of a later session.

- [ ] **Step 2: Mount**

In `Scene.tsx` `World`, inside the `<Suspense>` after `<Garage />`: `<MedChron />` (import from `./pieces/MedChron`).

- [ ] **Step 3: Check, screenshot, measure**

Run: `npx tsc --noEmit && npx eslint src --max-warnings 0 && npx vitest run`.

```bash
node C:/Users/Dhruvgopani/AppData/Local/Temp/claude/C--/b35624e8-932f-4077-846b-8409fdc8ceab/scratchpad/shot.mjs medchron-piece "http://localhost:3778/?stats=1&intro=0" medchron
node C:/Users/Dhruvgopani/AppData/Local/Temp/claude/C--/b35624e8-932f-4077-846b-8409fdc8ceab/scratchpad/shot.mjs medchron-phone "http://localhost:3778/?stats=1&intro=0" medchron 412 915 2
```

Expected in the desktop PNG: records building with sign and board on the camera side, belt with white sheets before the arch and paper cards after it, cobalt arch glow, five card signposts and the check-mark card along the road, car parked, camera in the arrival pose (higher and wider than before). The printed `statsWhileDriving.fps` must be 30 or better; if not, cut `SHEETS` to 24 and drop `castShadow` from the instanced mesh. If a sign is unreadable at chase distance, raise its `w`/`h` by 20 percent and the texture text sizes in `paint.ts`. Iterate `MEDCHRON` values and `ARRIVAL_POSES[1]` until the composition reads.

- [ ] **Step 4: Commit**

```bash
git add src/components/scene/pieces/MedChron.tsx src/components/scene/Scene.tsx src/content/route.ts src/components/scene/paint.ts
git commit -m "MedChron set piece: records building, conveyor through a scanner arch, chronology signposts, counter board" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: End-to-end tests for the intro and the pieces

**Files:**
- Modify: `e2e/drive.spec.ts`

**Interfaces:**
- Consumes: `data-intro` on `[data-testid="scene"]` (`playing`, `done`, `skipped`), `window.__drive.scene` with `?stats=1`, object names `piece-garage` and `piece-medchron`.

- [ ] **Step 1: Write the tests**

Add inside the describe block:

```ts
  test('plays the intro once and ends within five seconds', async ({ page }, testInfo) => {
    test.skip(!['desktop', 'phone'].includes(testInfo.project.name), 'needs a real WebGL scene')
    await page.goto('/?stats=1')
    const scene = page.getByTestId('scene')
    await expect(scene).toHaveAttribute('data-ready', 'true', { timeout: 60_000 })
    await expect(scene).toHaveAttribute('data-intro', /playing|done/)
    await expect(scene).toHaveAttribute('data-intro', 'done', { timeout: 6_000 })
    // the intro left the car at the first stop
    await expect(page.getByTestId('odometer')).toContainText('Stop 1 of 6')
  })

  test('skips the intro when the visitor has already scrolled', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'one engine is enough')
    await page.goto('/?stats=1')
    await page.evaluate(() => window.scrollTo(0, 600))
    await expect(page.getByTestId('scene')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 })
    await expect(page.getByTestId('scene')).toHaveAttribute('data-intro', 'skipped', { timeout: 6_000 })
  })

  test('builds the garage and the MedChron set piece', async ({ page }, testInfo) => {
    test.skip(!['desktop', 'phone'].includes(testInfo.project.name), 'needs a real WebGL scene')
    await page.goto('/?stats=1&intro=0')
    await expect(page.getByTestId('scene')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 })
    const names = await page.evaluate(() => {
      const d = (window as unknown as { __drive?: { scene: { getObjectByName: (n: string) => unknown } } }).__drive
      return ['piece-garage', 'piece-medchron'].map((n) => Boolean(d?.scene.getObjectByName(n)))
    })
    expect(names).toEqual([true, true])
  })
```

- [ ] **Step 2: Build and run the suite**

```bash
npm run build && npx playwright test
```

Expected: all pass (previous 33 plus the new ones on the chromium projects; skipped elsewhere). The prod server on port 3779 serves a stale build after `npm run build`; restart it if you use it (`npx next start -p 3779`).

- [ ] **Step 3: Commit**

```bash
git add e2e/drive.spec.ts
git commit -m "e2e: intro plays and ends, skips on scroll, set pieces are built" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: Report, memory, push

**Files:**
- Modify: `docs/superpowers/plans/2026-09-07-session-1-report.md` (append an addendum)
- Modify: `C:\Users\Dhruvgopani\.claude\projects\C--\memory\portfolio_drive.md`

- [ ] **Step 1: Report addendum**

Append to the session report:

```markdown
## Addendum: session A of the world tells the story (10 September 2026)

Spec: `../specs/2026-09-10-world-tells-the-story-design.md`. Delivered: the Canvas painter (`scene/paint.ts`), the piece toolkit and CC0 wall textures (`scene/pieces/`), intro state and camera modes (intro swing after the warm-up, arrival pose while parked), the garage with the name on its roller door, and the MedChron set piece: records building, conveyor of instanced sheets through a scanner arch, five chronology signposts and a closing card, and a board that counts 53% to 26%, 28 defects and 3 QA rounds on arrival. Two Kenney buildings at that stop are gone.

Measured (dpr 1, 1280 by 800, no effects): <fill from the shot.mjs output: hero fps, medchron fps, ready ms>. e2e: <count> passed across five engines.

Lessons: <anything that surprised you: sticky camera tuning, readability distances, texture ids that did not exist>.
```

Fill the angle-bracket values from the actual runs (this is the one place the plan asks for measured numbers, not placeholders).

- [ ] **Step 2: Memory**

Append one bullet to the memory file describing what session A shipped, the camera pose conventions (`side` negative is the camera side, set pieces on `+lateral`), and any texture id substitutions.

- [ ] **Step 3: Push**

```bash
git add docs/superpowers/plans/2026-09-07-session-1-report.md
git commit -m "Report: session A of the world tells the story" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push origin main
```

---

## Self-review

- Spec coverage for session A: painter (Task 5), camera modes (Task 7), garage and intro (Tasks 3, 7, 8), MedChron building, conveyor, arch, signposts, counters (Task 9), content in `profile.ts` under the banned-word test (Task 1), Kenney buildings dropped at the stop (Task 3), reduced motion (door open, sheets static, camera snaps, no intro: Tasks 7, 8, 9), idle-loop-only animation (sheets move only when frames are requested; the counter requests its own frames until done: Task 9), phones (arrival pose for phones, screenshot at 412 by 915: Tasks 3, 9), e2e (Task 10), budgets (Task 4 budget test, Task 9 fps check).
- Not in this session by design: workshop, station, pier, six buildings, trees, terrain (sessions B to D).
- Type consistency: `CameraPose` fields match between `route.ts` and `ChaseCamera.tsx`; `readIntro()` returns `{ active, door, car, camera }` used by `ChaseCamera`, `Garage`, `Car`; `parkedStop(s, zones)` used by `ChaseCamera` and `MedChron`; `makeTexture(width, height, draw)` and `repaint(tex, draw)` used by `Garage` and `MedChron`; `Sign` requires `y` and `postHeight`, `Screen` requires `y`; `tiled(tex, width, height, metres)` used by `Mass`.
