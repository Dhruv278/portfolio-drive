# Round 2 Driving UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the approved round-2 review into the app: an illustrated car, hero landscape, neon edges and landmark checkpoints on the 2D track, and a night-tuned 3D drive with a clearcoat car, glowing lamps, lit road edges and a closer chase camera.

**Architecture:** The 2D track keeps its single page-tall SVG driven by `TrackScene.tsx`; the road becomes a filled outline built from sampled centre-line points (pure helpers in `lib/track.ts`), a second SVG behind it carries the hero art (pure markup builder in `lib/heroArt.ts`), and the car is a shared `CarGlyph` used by both the page road and the phone hero road. The 3D scene keeps its structure; changes are material, lamp, geometry and camera tuning in the existing components, plus one new pure geometry builder in `lib/road.ts`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind 4 (global CSS), React Three Fiber, drei, three 0.185, zustand, Vitest, Playwright.

**Spec:** `design/v2-ux-report.html` (sections 2D, 3D, Samples, Plan) with the working references `design/v2-sample-2d-track.html` and `design/v2-sample-3d-car.html`.

## Global Constraints

- Content rules from `src/content/profile.ts` `bannedPatterns`: no em dashes, no semicolons, US spelling, in any string under `src/content/`.
- Keep the test ids `track-road`, `track-car`, `track-odometer`, `track-caption`, `odometer`, `exit-drive`.
- Keep a `.tp-cp` circle centred on the road at every checkpoint: `e2e/drive.spec.ts` reads its `cx` as the road centre.
- Native scroll is the only clock after load. The one exception is the arrival intro on the 2D hero, which runs once on load and collapses under `prefers-reduced-motion`.
- No new binary assets. The 3D car stays the Kenney sedan this round; only materials, lamps and lighting change.
- Desktop e2e viewport is 1400 × 900, phone is Pixel 7. Both must pass.
- Commit after each task with a message that ends in `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

---

### Task 1: Pure 2D geometry helpers

**Files:**
- Modify: `src/lib/track.ts`
- Test: `src/lib/track.test.ts`

**Interfaces:**
- Produces: `perspective(len: number, heroLen: number): number` (0 at the horizon, 1 from the Start checkpoint on), `roadWidthAt(len: number, heroLen: number, minW: number, maxW: number): number`, `outlinePath(samples: {x:number;y:number;l:number}[], halfWidthAt: (l:number)=>number): { left: string[]; right: string[]; d: string }`, `polylinePath(points: string[]): string`.

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/track.test.ts`:

```ts
import { outlinePath, perspective, polylinePath, roadWidthAt } from './track'

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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/track.test.ts`
Expected: FAIL, `perspective` is not exported.

- [ ] **Step 3: Implement the helpers**

Append to `src/lib/track.ts`:

```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/track.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/track.ts src/lib/track.test.ts
git commit -m "2D track: pure helpers for the perspective road outline" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Hero art markup builder

**Files:**
- Create: `src/lib/heroArt.ts`
- Test: `src/lib/heroArt.test.ts`

**Interfaces:**
- Produces: `heroArtMarkup(W: number, heroTop: number, heroH: number, horizonY: number): string` returning SVG inner markup (defs, sky, sun, water, ridges, cliffs, haze) in page coordinates.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { heroArtMarkup } from './heroArt'

describe('heroArtMarkup', () => {
  const svg = heroArtMarkup(1440, 0, 900, 150)
  it('is deterministic, so screenshots are stable', () => {
    expect(heroArtMarkup(1440, 0, 900, 150)).toBe(svg)
  })
  it('draws the sky down to the horizon and the water below it', () => {
    expect(svg).toContain('height="150.0" fill="url(#tp-sky)"')
    expect(svg).toContain('fill="url(#tp-water)"')
  })
  it('places the sun near the horizon on the right', () => {
    expect(svg).toMatch(/<circle cx="1238\.4" cy="144\.0" r="34"/)
  })
  it('uses unique ids so it can live beside the track defs', () => {
    for (const id of ['tp-sky', 'tp-sunGlow', 'tp-water', 'tp-sunPath', 'tp-haze']) expect(svg).toContain(`id="${id}"`)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/heroArt.test.ts`
Expected: FAIL, cannot find module './heroArt'.

- [ ] **Step 3: Implement**

`src/lib/heroArt.ts`:

```ts
// The landscape behind the hero road on desktop: a navy sky warming at the horizon, a low sun with
// its path on the water, two ridge lines and two foreground cliffs. Pure string building in page
// coordinates, seeded so every load draws the same picture. Masked and coloured by the stylesheet.

const f = (n: number) => n.toFixed(1)

function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export function heroArtMarkup(W: number, heroTop: number, heroH: number, horizonY: number): string {
  const bottom = heroTop + heroH
  const rnd = seeded(7)
  const ridge = (x0: number, x1: number, base: number, amp: number, step: number, color: string) => {
    let d = `M${f(x0)},${f(bottom)} L${f(x0)},${f(base - amp * 0.3)}`
    let x = x0
    while (x < x1) {
      const nx = Math.min(x1, x + step * (0.6 + rnd() * 0.8))
      const ny = base - amp * (0.15 + rnd() * 0.85)
      d += ` Q${f((x + nx) / 2)},${f(ny - amp * 0.3 * rnd())} ${f(nx)},${f(ny)}`
      x = nx
    }
    d += ` L${f(x1)},${f(bottom)} Z`
    return `<path d="${d}" fill="${color}"/>`
  }
  const sunX = W * 0.86
  const sunY = horizonY - 6
  const stars = Array.from({ length: 46 }, () => `<circle cx="${f(W * 0.3 + rnd() * W * 0.72)}" cy="${f(rnd() * Math.max(1, horizonY - 60))}" r="${f(0.6 + rnd() * 1.1)}" fill="#e6efe9" opacity="${f(0.25 + rnd() * 0.5)}"/>`).join('')
  const shimmer = Array.from({ length: 14 }, (_, i) => {
    const y = horizonY + 10 + i * 13 * (1 + i * 0.06)
    const w = 20 + rnd() * 90 * (1 + i * 0.12)
    const x = sunX - w / 2 + (rnd() - 0.5) * 70 * (1 + i * 0.1)
    return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="1.5" fill="#f0c57a" opacity="${f(0.34 - i * 0.02)}"/>`
  }).join('')
  return (
    `<defs>` +
    `<linearGradient id="tp-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0f12"/><stop offset=".5" stop-color="#15222a"/><stop offset=".84" stop-color="#2a3f46"/><stop offset="1" stop-color="#6b5a3e"/></linearGradient>` +
    `<radialGradient id="tp-sunGlow"><stop offset="0" stop-color="#f0c57a" stop-opacity=".6"/><stop offset=".3" stop-color="#e2a95e" stop-opacity=".2"/><stop offset="1" stop-color="#e2a95e" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="tp-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f4850"/><stop offset=".45" stop-color="#17272c"/><stop offset="1" stop-color="#0d1417"/></linearGradient>` +
    `<linearGradient id="tp-sunPath" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0c57a" stop-opacity=".45"/><stop offset="1" stop-color="#f0c57a" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="tp-haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6ed83" stop-opacity="0"/><stop offset="1" stop-color="#d6ed83" stop-opacity=".07"/></linearGradient>` +
    `</defs>` +
    `<rect x="0" y="${f(heroTop)}" width="${f(W)}" height="${f(horizonY - heroTop)}" fill="url(#tp-sky)"/>` +
    stars +
    `<circle cx="${f(sunX)}" cy="${f(sunY)}" r="${f(W * 0.2)}" fill="url(#tp-sunGlow)"/>` +
    `<circle cx="${f(sunX)}" cy="${f(sunY)}" r="34" fill="#f3cf8a"/>` +
    `<rect x="${f(W * 0.5)}" y="${f(horizonY)}" width="${f(W * 0.52)}" height="${f(heroH * 0.5)}" fill="url(#tp-water)"/>` +
    `<rect x="${f(sunX - 36)}" y="${f(horizonY)}" width="72" height="${f(heroH * 0.3)}" fill="url(#tp-sunPath)"/>` +
    shimmer +
    ridge(W * 0.28, W * 1.02, horizonY + 2, 120, 130, '#1b2a30') +
    ridge(W * 0.22, W * 0.92, horizonY + 4, 72, 95, '#111b1f') +
    `<path d="M${f(W * 0.3)},${f(bottom)} C${f(W * 0.36)},${f(horizonY + 130)} ${f(W * 0.5)},${f(horizonY + 100)} ${f(W * 0.56)},${f(horizonY + 190)} C${f(W * 0.6)},${f(horizonY + 260)} ${f(W * 0.56)},${f(bottom)} ${f(W * 0.46)},${f(bottom)} Z" fill="#0f1719"/>` +
    `<path d="M${f(W * 1.02)},${f(horizonY + 70)} C${f(W * 0.96)},${f(horizonY + 130)} ${f(W * 0.92)},${f(horizonY + 240)} ${f(W * 0.95)},${f(bottom)} L${f(W * 1.02)},${f(bottom)} Z" fill="#0e1517"/>` +
    `<rect x="0" y="${f(horizonY - 40)}" width="${f(W)}" height="${f(bottom - horizonY + 40)}" fill="url(#tp-haze)"/>`
  )
}
```

Note for the sun test: `W * 0.86` at 1440 is 1238.4 and `horizonY - 6` at 150 is 144. The sky rect height is `horizonY - heroTop`, which is 150 for the test's `heroTop` of 0.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/heroArt.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/heroArt.ts src/lib/heroArt.test.ts
git commit -m "2D track: seeded hero landscape markup" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: The illustrated car glyph, used by the page road and the phone hero road

**Files:**
- Create: `src/components/track/CarGlyph.tsx`
- Modify: `src/components/track/HeroRoad.tsx`
- Modify: `src/app/globals.css` (the `.tp-car` rules)

**Interfaces:**
- Produces: `CarGlyph({ id }: { id: string })`, a server-safe SVG fragment: a `<defs>` with gradients prefixed by `id` and a `<g className="tp-car-body">` drawn facing up (negative y), 44 units wide and 96 long, origin at the car's centre. Callers wrap it in their own `<g className="tp-car" transform=...>`.

- [ ] **Step 1: Create the glyph**

`src/components/track/CarGlyph.tsx`:

```tsx
// The car as an illustration: paint with side highlights, tinted glass with a reflection streak,
// roof panel, door seams, mirrors, headlight wedges and tail lights with glow, a blurred shadow.
// Faces up (negative y), 44 units wide, 96 long, origin at its centre. Server rendered SVG; the
// gradient ids take a prefix so two glyphs can share one document.
export function CarGlyph({ id }: { id: string }) {
  const body = 'M-15,-48 C-20,-48 -22,-44 -22,-39 L-22,39 C-22,44 -19,48 -14,48 L14,48 C19,48 22,44 22,39 L22,-39 C22,-44 20,-48 15,-48 Z'
  return (
    <>
      <defs>
        <filter id={`${id}-glow`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${id}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <linearGradient id={`${id}-paint`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7f9188" />
          <stop offset=".16" stopColor="#e9efe3" />
          <stop offset=".5" stopColor="#c3cfc3" />
          <stop offset=".84" stopColor="#f1f5ec" />
          <stop offset="1" stopColor="#7b8c83" />
        </linearGradient>
        <linearGradient id={`${id}-paintV`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".38" />
          <stop offset=".45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".22" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d5964" />
          <stop offset="1" stopColor="#0b1519" />
        </linearGradient>
        <linearGradient id={`${id}-glassHi`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".3" />
          <stop offset=".65" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-roof`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a3b3a9" />
          <stop offset=".5" stopColor="#d6dfd3" />
          <stop offset="1" stopColor="#9dada3" />
        </linearGradient>
      </defs>
      <g className="tp-car-body">
        <ellipse cx="-3" cy="6" rx="25" ry="50" fill="#000" opacity=".55" filter={`url(#${id}-shadow)`} />
        <rect className="tyre" x="-24.5" y="-36" width="7" height="16" rx="2.5" />
        <rect className="tyre" x="17.5" y="-36" width="7" height="16" rx="2.5" />
        <rect className="tyre" x="-24.5" y="20" width="7" height="16" rx="2.5" />
        <rect className="tyre" x="17.5" y="20" width="7" height="16" rx="2.5" />
        <path d={body} fill={`url(#${id}-paint)`} stroke="#f7f9f1" strokeWidth=".7" strokeOpacity=".7" />
        <path d={body} fill={`url(#${id}-paintV)`} />
        <path d="M-9,-42 L-8,-17 M9,-42 L8,-17" stroke="#8a9a90" strokeWidth=".8" fill="none" opacity=".85" />
        <path d="M-17,-16 L17,-16 L14,-3 L-14,-3 Z" fill={`url(#${id}-glass)`} />
        <path d="M-16,-15 L4,-15 L-6,-4 L-13,-4 Z" fill={`url(#${id}-glassHi)`} />
        <rect x="-15" y="-3" width="30" height="24" rx="3" fill={`url(#${id}-roof)`} />
        <path d="M-15,-3 H15" stroke="#eef3e8" strokeWidth=".6" opacity=".6" />
        <path d="M-15,21 L15,21 L12,31 L-12,31 Z" fill={`url(#${id}-glass)`} />
        <path d="M-14,22 L0,22 L-7,30 L-11,30 Z" fill={`url(#${id}-glassHi)`} />
        <path d="M-13,38 H13" stroke="#8a9a90" strokeWidth=".8" opacity=".85" />
        <path d="M-22,-4 V16 M22,-4 V16" stroke="#75857c" strokeWidth=".9" opacity=".8" />
        <rect x="-27.5" y="-10" width="6" height="4" rx="1.5" fill="#c1cdc2" stroke="#33413c" strokeWidth=".5" />
        <rect x="21.5" y="-10" width="6" height="4" rx="1.5" fill="#c1cdc2" stroke="#33413c" strokeWidth=".5" />
        <path className="lamp" d="M-19,-46 L-8,-45 L-8,-42 L-18,-42 Z" filter={`url(#${id}-glow)`} />
        <path className="lamp" d="M19,-46 L8,-45 L8,-42 L18,-42 Z" filter={`url(#${id}-glow)`} />
        <rect x="-7" y="-46" width="14" height="3" rx="1" fill="#141c20" />
        <rect className="tail" x="-20" y="43" width="12" height="3.5" rx="1" filter={`url(#${id}-glow)`} />
        <rect className="tail" x="8" y="43" width="12" height="3.5" rx="1" filter={`url(#${id}-glow)`} />
        <rect x="-5" y="43.5" width="10" height="3" rx=".5" fill="#e9eee6" opacity=".85" />
      </g>
    </>
  )
}
```

- [ ] **Step 2: Use it in the phone hero road**

In `src/components/track/HeroRoad.tsx`, add `import { CarGlyph } from './CarGlyph'` and replace the whole `<g className="tp-car" transform="translate(48,57.5) rotate(90) scale(0.62)"> ... </g>` block with:

```tsx
      <g className="tp-car" transform="translate(48,57.5) rotate(90) scale(0.3)">
        <CarGlyph id="tp-hero-car" />
      </g>
```

The old car was 26 wide at scale 0.62 (16 units). The new one is 44 wide, so 0.3 keeps it about the same size on the bar. The `<defs>` from the glyph land inside this `<g>`, which SVG allows.

- [ ] **Step 3: Replace the `.tp-car` rules in `globals.css`**

Find the block from `.tp-car { will-change: transform; }` through `.tp-car .tyre { fill: #0b1012; }` and replace it with:

```css
.tp-car { will-change: transform; }
.tp-car .beam { fill: url(#tp-beam); opacity: 0.9; }
.tp-car .tyre { fill: #090c0e; }
.tp-car .lamp { fill: #f7fbe6; }
.tp-car .tail { fill: #ff6a52; }
.tp-streaks { opacity: 0; }
.tp-streaks rect { fill: url(#tp-streak); }
```

The phone rule `.tp-heroroad .tp-car .lamp { animation: tp-lamp 2.4s ease-in-out infinite; }` keeps working because the glyph's headlights carry the `lamp` class.

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/track/CarGlyph.tsx src/components/track/HeroRoad.tsx src/app/globals.css
git commit -m "2D track: illustrated car glyph, first used on the phone hero road" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: The page road: outline geometry, hero approach, art layer, landmarks, streaks, arrival intro

**Files:**
- Modify: `src/components/track/TrackScene.tsx`
- Modify: `src/app/globals.css` (track rules)

**Interfaces:**
- Consumes: `perspective`, `roadWidthAt`, `outlinePath`, `polylinePath` from `@/lib/track`; `heroArtMarkup` from `@/lib/heroArt`; `CarGlyph`.
- Keeps: test ids `track-road` (the track SVG), `track-car` (the car group), `track-odometer`, `track-caption`; `.tp-cp` circles at the road centre, one per stop, in DOM order.

- [ ] **Step 1: Replace the SVG markup in `TrackScene.tsx`**

Replace the returned JSX's first `<svg ... className="tp-track" ...> ... </svg>` with two SVGs. The art SVG goes first (behind), then the track:

```tsx
      <svg ref={art} className="tp-art" aria-hidden="true" />
      <svg ref={svg} className="tp-track" aria-hidden="true" data-testid="track-road">
        <defs>
          <radialGradient id="tp-pool">
            <stop offset="0" stopColor="#d6ed83" stopOpacity="0.2" />
            <stop offset="1" stopColor="#d6ed83" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="tp-beam" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#f3f8d9" stopOpacity="0.55" />
            <stop offset="1" stopColor="#f3f8d9" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="tp-streak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ff6a52" stopOpacity="0.95" />
            <stop offset="1" stopColor="#ff6a52" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="tp-num" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#d6ed83" stopOpacity="0.95" />
            <stop offset="1" stopColor="#a2c9d3" stopOpacity="0.85" />
          </linearGradient>
          <pattern id="tp-grain" width="7" height="7" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="2" r=".7" fill="#2c3a3e" />
            <circle cx="5" cy="5.5" r=".6" fill="#0d1416" />
          </pattern>
          <filter id="tp-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="tp-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>
        <path ref={centre} fill="none" stroke="none" />
        <g ref={bigs} />
        <path ref={kerb} className="tp-kerb" d="" />
        <path ref={road} className="tp-road" d="" />
        <path ref={grain} className="tp-grain" d="" />
        <path ref={dash} className="tp-dash" d="" />
        <path ref={edgeL} className="tp-edge l" d="" />
        <path ref={edgeR} className="tp-edge r" d="" />
        <path ref={litL} className="tp-lit l" d="" />
        <path ref={litR} className="tp-lit r" d="" />
        <g ref={cps} />
        <circle ref={pool} className="tp-pool" r="150" />
        <g ref={car} className="tp-car" data-testid="track-car">
          <g className="tp-beams">
            <polygon className="beam" points="-18,-44 -8,-44 6,-210 -56,-210" filter="url(#tp-soft)" />
            <polygon className="beam" points="8,-44 18,-44 56,-210 -6,-210" filter="url(#tp-soft)" />
          </g>
          <g ref={streaks} className="tp-streaks">
            <rect x="-19.5" y="44" width="11" height="60" />
            <rect x="8.5" y="44" width="11" height="60" />
          </g>
          <CarGlyph id="tp-track-car" />
        </g>
      </svg>
```

Add the refs at the top of the component: `art` (SVGSVGElement), `centre`, `grain`, `edgeL`, `edgeR`, `litL`, `litR` (SVGPathElement), `streaks` (SVGGElement). Remove the old `lit` ref. Keep `road`, `kerb`, `dash`, `cps`, `bigs`, `car`, `pool` and the HTML refs. Import `CarGlyph` from `./CarGlyph`, `heroArtMarkup` from `@/lib/heroArt`, and add `outlinePath, perspective, polylinePath, roadWidthAt` to the `@/lib/track` import.

- [ ] **Step 2: Rewrite `layoutPage`**

Replace the body of `layoutPage` with:

```ts
    // Desktop: the road enters from a horizon in the hero art, widens to full size at Start, then
    // winds down the page through every card's empty side.
    const layoutPage = () => {
      const W = innerWidth
      const H = document.documentElement.scrollHeight
      const s = svg.current!
      s.setAttribute('width', String(W))
      s.setAttribute('height', String(H))
      s.setAttribute('viewBox', `0 0 ${W} ${H}`)
      const heroRect = stops[0].getBoundingClientRect()
      const heroTop = heroRect.top + scrollY
      const heroH = heroRect.height
      const horizonY = heroTop + 150
      const points = stops.map((st, i) => {
        const r = cardOf(st).getBoundingClientRect()
        const y = r.top + scrollY + (i === 0 ? r.height * 0.6 : Math.min(r.height * 0.45, 260))
        const x = st.classList.contains('hero') || st.classList.contains('left') ? W * 0.78 : W * 0.22
        return { x, y }
      })
      const start = points[0]
      const last = points[points.length - 1]
      const pts = [{ x: W * 0.58, y: horizonY }, { x: W * 0.7, y: horizonY + (start.y - horizonY) * 0.55 }, ...points, { x: last.x, y: last.y + 260 }]
      let d = `M${pts[0].x},${pts[0].y}`
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1]
        const b = pts[i]
        const k = (b.y - a.y) * 0.5
        d += ` C${a.x},${a.y + k} ${b.x},${b.y - k} ${b.x},${b.y}`
      }
      centre.current!.setAttribute('d', d)
      L = centre.current!.getTotalLength()
      const N = 1400
      const samples: Sample[] = []
      for (let i = 0; i <= N; i++) {
        const p = centre.current!.getPointAtLength((i / N) * L)
        samples.push({ x: p.x, y: p.y, l: (i / N) * L })
      }
      cpLen = points.map((p) => {
        let best = 0
        let bd = Infinity
        samples.forEach((sm, i) => {
          const dd = (sm.x - p.x) ** 2 + (sm.y - p.y) ** 2
          if (dd < bd) {
            bd = dd
            best = i
          }
        })
        return samples[best].l
      })
      heroLen = Math.max(1, cpLen[0])
      const roadOut = outlinePath(samples, (l) => roadWidthAt(l, heroLen, 6, 62) / 2)
      const kerbOut = outlinePath(samples, (l) => roadWidthAt(l, heroLen, 6, 62) / 2 + 5 * perspective(l, heroLen))
      kerb.current!.setAttribute('d', kerbOut.d)
      road.current!.setAttribute('d', roadOut.d)
      grain.current!.setAttribute('d', roadOut.d)
      const dL = polylinePath(roadOut.left)
      const dR = polylinePath(roadOut.right)
      edgeL.current!.setAttribute('d', dL)
      litL.current!.setAttribute('d', dL)
      edgeR.current!.setAttribute('d', dR)
      litR.current!.setAttribute('d', dR)
      const i0 = Math.max(0, samples.findIndex((sm) => sm.l >= heroLen * 0.4))
      dash.current!.setAttribute('d', polylinePath(samples.slice(i0).map((sm) => `${sm.x.toFixed(1)},${sm.y.toFixed(1)}`)))
      // A dot on the road at every checkpoint (the tablet test reads its cx as the road centre),
      // plus the landmark beside the road: a node on the outer edge, a connector, a numeral, a label.
      cps.current!.innerHTML = points
        .map((p, i) => {
          const dir = p.x > W / 2 ? 1 : -1
          const nx = p.x + dir * (roadWidthAt(cpLen[i], heroLen, 6, 62) / 2 + 12)
          return `<circle class="tp-cp" data-i="${i}" cx="${p.x}" cy="${p.y}" r="7" /><line class="tp-link" data-i="${i}" x1="${nx.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${(p.x + dir * 66).toFixed(1)}" y2="${p.y.toFixed(1)}" /><circle class="tp-node" data-i="${i}" cx="${nx.toFixed(1)}" cy="${p.y.toFixed(1)}" r="6" />`
        })
        .join('')
      bigs.current!.innerHTML = points
        .map((p, i) => {
          const name = stops[i].dataset.name ?? ''
          const right = p.x > W / 2
          const dir = right ? 1 : -1
          const x = p.x + dir * 66
          const anchor = right ? 'start' : 'end'
          return `<text class="tp-big" data-i="${i}" x="${x.toFixed(1)}" y="${(p.y + 46).toFixed(1)}" text-anchor="${anchor}">${String(i + 1).padStart(2, '0')}</text><text class="tp-bigname" data-i="${i}" x="${(x + dir * 6).toFixed(1)}" y="${(p.y + 82).toFixed(1)}" text-anchor="${anchor}">${name}</text>`
        })
        .join('')
      const a = art.current!
      a.setAttribute('width', String(W))
      a.setAttribute('height', String(heroTop + heroH))
      a.setAttribute('viewBox', `0 0 ${W} ${heroTop + heroH}`)
      a.innerHTML = heroArtMarkup(W, heroTop, heroH, horizonY)
    }
```

Add `let heroLen = 1` beside the other layout variables and import the `Sample` type from `@/lib/track`.

- [ ] **Step 3: Rewrite `layoutBar` to use the same outline helpers**

```ts
    // Phones and tablets: the road is a fixed horizontal bar, checkpoints evenly spaced along it.
    const layoutBar = () => {
      const W = innerWidth
      const s = svg.current!
      s.setAttribute('width', String(W))
      s.setAttribute('height', String(BAR_HEIGHT))
      s.setAttribute('viewBox', `0 0 ${W} ${BAR_HEIGHT}`)
      centre.current!.setAttribute('d', barPath(W, BAR_HEIGHT, 22))
      L = centre.current!.getTotalLength()
      heroLen = 0
      const N = 200
      const samples: Sample[] = []
      for (let i = 0; i <= N; i++) {
        const p = centre.current!.getPointAtLength((i / N) * L)
        samples.push({ x: p.x, y: p.y, l: (i / N) * L })
      }
      const roadOut = outlinePath(samples, () => 7)
      const kerbOut = outlinePath(samples, () => 8.5)
      kerb.current!.setAttribute('d', kerbOut.d)
      road.current!.setAttribute('d', roadOut.d)
      grain.current!.setAttribute('d', '')
      const dL = polylinePath(roadOut.left)
      const dR = polylinePath(roadOut.right)
      edgeL.current!.setAttribute('d', dL)
      litL.current!.setAttribute('d', dL)
      edgeR.current!.setAttribute('d', dR)
      litR.current!.setAttribute('d', dR)
      dash.current!.setAttribute('d', polylinePath(samples.map((sm) => `${sm.x.toFixed(1)},${sm.y.toFixed(1)}`)))
      cpLen = barCheckpointLengths(L, stops.length, 0.03)
      cps.current!.innerHTML = cpLen
        .map((l, i) => {
          const p = centre.current!.getPointAtLength(l)
          return `<circle class="tp-cp" data-i="${i}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5" />`
        })
        .join('')
      bigs.current!.innerHTML = ''
      art.current!.innerHTML = ''
    }
```

- [ ] **Step 4: Update `layout`, `setState`, `place`, `tick`, `onScroll` and the intro**

In `layout()`, replace `lit.current!.style.strokeDasharray = \`${L}\`` with:

```ts
      for (const p of [litL.current!, litR.current!]) {
        const len = p.getTotalLength()
        p.dataset.len = String(len)
        p.style.strokeDasharray = `${len}`
      }
```

and, at the end of `layout()` before `place(current)`, add the arrival rule:

```ts
      // On desktop the car arrives from the horizon once, on load. Reduced motion, and the bar
      // layout, start parked at Start.
      if (narrow || reduced || arrived) current = Math.max(current, cpLen[0])
```

Add `let arrived = false` beside the other state. The initial `current` stays `0`, which is the horizon on desktop.

In `setState`, replace the `cps.current!.querySelectorAll('.tp-cp')...` line with:

```ts
        svg.current!.querySelectorAll<SVGElement>('[data-i]').forEach((c) => c.classList.toggle('on', Number(c.dataset.i) <= idx))
```

and change the distance and bar lines to measure from Start:

```ts
      if (odoDist.current) odoDist.current.textContent = `${Math.round(Math.max(0, len - heroLen) / 4).toLocaleString('en-US')} m`
      if (bar.current) bar.current.style.width = `${(Math.max(0, len - heroLen) / Math.max(1, L - heroLen)) * 100}%`
```

Replace `place` with:

```ts
    const place = (len: number) => {
      const r = centre.current!
      const p = r.getPointAtLength(len)
      const q = r.getPointAtLength(Math.min(L, len + 2))
      const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI + 90
      const base = narrow ? (innerWidth < 640 ? 0.19 : 0.26) : 0.92
      const scale = base * (narrow ? 1 : 0.16 + 0.84 * perspective(len, heroLen))
      car.current!.setAttribute('transform', `translate(${p.x.toFixed(1)},${p.y.toFixed(1)}) rotate(${ang.toFixed(1)}) scale(${scale.toFixed(3)})`)
      pool.current!.setAttribute('cx', p.x.toFixed(1))
      pool.current!.setAttribute('cy', p.y.toFixed(1))
      pool.current!.setAttribute('r', (150 * scale).toFixed(1))
      const frac = len / Math.max(1, L)
      for (const e of [litL.current!, litR.current!]) {
        const el = Number(e.dataset.len || 0)
        e.style.strokeDashoffset = `${el - frac * el}`
      }
    }
```

The old car was 26 units wide at scale 1.25 (33 px). The new one is 44 units at 0.92 (40 px). On phones 0.36 and 0.5 become 0.19 and 0.26 for the same on-screen size.

Replace `tick` with:

```ts
    let prevLen = 0
    const tick = (now: number) => {
      raf = 0
      if (!live || !svg.current) return
      const dt = lastTick ? Math.min(0.1, (now - lastTick) / 1000) : 1 / 60
      lastTick = now
      // Time-based easing: the same feel at any frame rate, and a big catch-up after a paused tab.
      // The arrival from the horizon is slower than the scroll response.
      const k = reduced ? 1 : 1 - Math.exp(-dt * (arrived ? 8 : 2.4))
      current += (target - current) * k
      if (Math.abs(target - current) < 0.5) {
        current = target
        arrived = true
      }
      const speed = Math.abs(current - prevLen) / dt
      prevLen = current
      place(current)
      // Tail lights streak with speed, a cheap sense of motion.
      const sl = reduced || narrow ? 0 : Math.min(1, speed / 1500)
      streaks.current!.setAttribute('opacity', (sl * 0.9).toFixed(2))
      streaks.current!.setAttribute('transform', `translate(0,44) scale(1,${(0.25 + sl * 1.5).toFixed(2)}) translate(0,-44)`)
      if (current !== target) raf = requestAnimationFrame(tick)
      else lastTick = 0
    }
```

In `onScroll`, after `hint.current?.classList.toggle('gone', y > 40)`, add:

```ts
      odo.current?.classList.toggle('shown', y > 40)
```

and add a ref `odo` (HTMLDivElement) on the `.tp-odo` div: `<div ref={odo} className="tp-odo" data-testid="track-odometer">`.

- [ ] **Step 5: Styles**

In `globals.css`, replace the block from `.tp-road { fill: none; ...` through `.tp-pool { fill: url(#tp-pool); }` with:

```css
.tp-art {
  position: absolute;
  inset: 0 auto auto 0;
  pointer-events: none;
  z-index: 0;
  -webkit-mask-image: linear-gradient(to right, transparent 26%, #000 54%), linear-gradient(to bottom, #000 60%, transparent 100%);
  -webkit-mask-composite: source-in;
  mask-image: linear-gradient(to right, transparent 26%, #000 54%), linear-gradient(to bottom, #000 60%, transparent 100%);
  mask-composite: intersect;
}
.tp-kerb { fill: #0d1518; }
.tp-road { fill: #1a262a; }
.tp-grain { fill: url(#tp-grain); }
.tp-dash { fill: none; stroke: #8ea0a3; stroke-width: 2.4; stroke-dasharray: 16 20; stroke-linecap: round; animation: tp-flow 1.8s linear infinite; }
@keyframes tp-flow { to { stroke-dashoffset: -36; } }
.tp-edge { fill: none; stroke-width: 2; stroke-linecap: round; opacity: 0.32; }
.tp-edge.l { stroke: var(--tp-amber); }
.tp-edge.r { stroke: var(--tp-cobalt); }
.tp-lit { fill: none; stroke-width: 3; stroke-linecap: round; filter: url(#tp-glow); }
.tp-lit.l { stroke: var(--tp-amber); }
.tp-lit.r { stroke: var(--tp-cobalt); }
.tp-cp { fill: var(--tp-navy); stroke: #577077; stroke-width: 2.5; }
.tp-cp.on { fill: var(--tp-amber); stroke: var(--tp-amber); filter: drop-shadow(0 0 10px rgba(214, 237, 131, 0.7)); }
.tp-node { fill: var(--tp-navy); stroke: #577077; stroke-width: 2.5; }
.tp-node.on { fill: var(--tp-amber); stroke: var(--tp-amber); filter: url(#tp-glow); }
.tp-link { stroke: #577077; stroke-width: 1.5; opacity: 0.7; }
.tp-link.on { stroke: var(--tp-amber); }
.tp-pool { fill: url(#tp-pool); }
```

Replace the `.tp-big` and `.tp-bigname` rules with:

```css
.tp-big { font: 800 clamp(96px, 10.5vw, 150px) var(--font-display); letter-spacing: -0.04em; fill: none; stroke: rgba(165, 179, 181, 0.3); stroke-width: 1.5; paint-order: stroke; }
.tp-big.on { fill: url(#tp-num); stroke: none; filter: url(#tp-glow); }
.tp-bigname { font: 600 13px var(--font-mono); letter-spacing: 0.3em; text-transform: uppercase; fill: rgba(165, 179, 181, 0.5); }
.tp-bigname.on { fill: var(--tp-amber); }
```

Add to `.tp-odo`: `opacity: 0; transform: translateY(8px); transition: opacity 0.4s, transform 0.4s;` and a new rule `.tp-odo.shown { opacity: 1; transform: none; }`.

Update the phone block: replace the six `.tp-track.bar .tp-*` stroke overrides with:

```css
  .tp-track.bar .tp-dash { stroke-width: 1.5; stroke-dasharray: 6 8; }
  .tp-track.bar .tp-edge { stroke-width: 1.2; }
  .tp-track.bar .tp-lit { stroke-width: 1.8; filter: none; }
  .tp-track.bar .tp-cp { stroke-width: 2; }
  .tp-track.bar .tp-cp.on { filter: drop-shadow(0 0 6px rgba(214, 237, 131, 0.8)); }
  .tp-track.bar .tp-pool { r: 40; }
  .tp-art { display: none; }
```

In the phone hero road block, keep the `.tp-heroroad .tp-road`, `.tp-kerb`, `.tp-dash`, `.tp-cp` rules but note `HeroRoad.tsx` still draws its road as strokes, so add back stroke styling scoped to it:

```css
  .tp-heroroad .tp-road { fill: none; stroke: #19262a; stroke-width: 22; stroke-linecap: round; }
  .tp-heroroad .tp-kerb { fill: none; stroke: #577077; stroke-width: 26; stroke-linecap: round; opacity: 0.55; }
```

Also the loader on the 3D page reuses `.tp-road`, `.tp-kerb`, `.tp-dash` as strokes (`.loader-road .tp-road` around line 987). Check those rules set `fill: none` and a stroke; if they only set stroke-width, add `fill: none; stroke: #19262a;` to `.loader-road .tp-road` and `fill: none; stroke: #577077;` to `.loader-road .tp-kerb`.

- [ ] **Step 6: Typecheck, lint, unit tests**

Run: `npm run typecheck && npm run lint && npm run test:run`
Expected: all pass.

- [ ] **Step 7: Check in the browser**

Start `npm run dev`, open `http://localhost:3000/` at 1440 wide. Expect: landscape behind the right half of the hero, the car driving in from the horizon on load and stopping at "01 START", the odometer fading in after the first scroll, neon edges lit behind the car, numerals turning citron as each checkpoint is reached, streaks on fast scroll. At 390 wide: the hero road shows the illustrated car, the route bar still appears after the hero.

- [ ] **Step 8: Commit**

```bash
git add src/components/track/TrackScene.tsx src/app/globals.css
git commit -m "2D track: hero landscape, perspective approach, neon edges, landmark checkpoints, arrival intro" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Hero tiles with icons and accent bars, button glyphs

**Files:**
- Create: `src/components/track/TileIcon.tsx`
- Modify: `src/content/track.ts` (hero tiles)
- Modify: `src/app/page.tsx` (tiles, two hero buttons)
- Modify: `src/app/globals.css` (`.tp-tiles`)
- Test: `src/content/profile.test.ts` already walks `track`; the icon keys are plain words and pass the banned-word rules.

**Interfaces:**
- Produces: `TileIcon({ name }: { name: 'target' | 'sparkles' | 'cube' })`; `track.hero.tiles[i].icon` of the same union type.

- [ ] **Step 1: Add the icon key to the content**

In `src/content/track.ts`, change the tiles to:

```ts
    tiles: [
      { icon: 'target', title: 'Product lead', body: 'Roadmap, specifications and priorities for MedChron at Omnis AI, and the core features behind them.' },
      { icon: 'sparkles', title: 'AI you can cite', body: 'Every extracted fact carries the page it came from, or it is dropped. Evaluations before a prompt ships.' },
      { icon: 'cube', title: 'Ships end to end', body: 'TypeScript from NestJS to Next.js, PostgreSQL and MongoDB, AWS and Kubernetes, tests included.' },
    ] as const,
```

- [ ] **Step 2: Create the icons**

`src/components/track/TileIcon.tsx`:

```tsx
export type TileIconName = 'target' | 'sparkles' | 'cube'

const PATHS: Record<TileIconName, string> = {
  target: 'M12 12m-8.5 0a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0M12 12m-4.2 0a4.2 4.2 0 1 0 8.4 0a4.2 4.2 0 1 0 -8.4 0M12 12l6.5-6.5M16 3.5v4h4',
  sparkles: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8zM5 15.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4L3 17.5l1.4-.6z',
  cube: 'M12 2.8l8 4.4v9.6l-8 4.4-8-4.4V7.2zM4 7.2l8 4.4 8-4.4M12 11.6v9.6',
}

// The hero tile marks: target for the product lead, sparkles for AI you can cite, cube for ships
// end to end. Stroke icons in the current colour, so the stylesheet tints them per tile.
export function TileIcon({ name }: { name: TileIconName }) {
  return (
    <span className="tp-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={PATHS[name]} />
      </svg>
    </span>
  )
}
```

- [ ] **Step 3: Render icons and button glyphs in `page.tsx`**

Import `TileIcon`. Replace the tiles list with:

```tsx
            <ul className="tp-tiles">
              {t.hero.tiles.map((x) => (
                <li key={x.title}>
                  <TileIcon name={x.icon} />
                  <b>{x.title}</b>
                  <span>{x.body}</span>
                </li>
              ))}
            </ul>
```

Replace the two hero buttons with:

```tsx
              <a className="tp-btn primary" href="#why">
                See what I&apos;ve built
                <svg className="tp-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14m-6-6l6 6-6 6" />
                </svg>
              </a>
              <a className="tp-btn" href={identity.resumePdf} download>
                <svg className="tp-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v3h16v-3" />
                </svg>
                Download my resume
              </a>
```

- [ ] **Step 4: Styles**

Replace the `.tp-tiles` rules with:

```css
.tp-tiles { list-style: none; margin: 30px 0 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; max-width: 760px; }
.tp-tiles li { position: relative; border: 1px solid var(--tp-line); border-radius: var(--tp-r-card); padding: 16px 18px 24px; background: rgba(27, 35, 38, 0.7); backdrop-filter: blur(6px); overflow: hidden; }
.tp-tiles li::after { content: ""; position: absolute; left: 18px; bottom: 12px; width: 38px; height: 3px; border-radius: 2px; background: var(--tp-bar, var(--tp-amber)); }
.tp-tiles li:nth-child(2) { --tp-bar: var(--tp-cobalt); }
.tp-tiles li:nth-child(3) { --tp-bar: #dfe6d9; }
.tp-icon { display: grid; place-items: center; width: 40px; height: 40px; margin-bottom: 12px; border-radius: 11px; background: rgba(214, 237, 131, 0.12); border: 1px solid rgba(214, 237, 131, 0.28); color: var(--tp-amber); box-shadow: inset 0 0 18px rgba(214, 237, 131, 0.08); }
.tp-tiles li:nth-child(2) .tp-icon { background: rgba(162, 201, 211, 0.12); border-color: rgba(162, 201, 211, 0.3); color: var(--tp-cobalt); }
.tp-tiles li:nth-child(3) .tp-icon { background: rgba(223, 230, 217, 0.1); border-color: rgba(223, 230, 217, 0.28); color: #e6ecdf; }
.tp-icon svg { width: 21px; height: 21px; }
.tp-tiles b { display: block; font-family: var(--font-display); font-weight: 800; font-size: clamp(20px, 1.8vw, 26px); line-height: 1.1; letter-spacing: -0.02em; color: var(--tp-text); }
.tp-tiles span { display: block; font-size: 13px; color: var(--tp-muted); margin-top: 8px; line-height: 1.4; }
.tp-glyph { width: 16px; height: 16px; flex: none; }
.tp-btn { gap: 8px; }
```

Keep the existing `.tp-btn` rule and only add `gap: 8px` to it rather than a second rule if you prefer one declaration.

- [ ] **Step 5: Typecheck, lint, unit tests**

Run: `npm run typecheck && npm run lint && npm run test:run`
Expected: pass. The content test walks `track` and the new `icon` strings contain no banned words.

- [ ] **Step 6: Commit**

```bash
git add src/components/track/TileIcon.tsx src/content/track.ts src/app/page.tsx src/app/globals.css
git commit -m "2D track: icon tiles with accent bars, glyphs on the hero buttons" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: 3D road: lit neon edges and a wetter surface

**Files:**
- Modify: `src/lib/road.ts`
- Test: `src/lib/road.test.ts`
- Modify: `src/components/scene/Road.tsx`

**Interfaces:**
- Produces: `buildEdgeGeometry(curve, halfWidth, inset, width, side, segments?, y?)` in `lib/road.ts`, a ribbon with an extra float attribute `progress` (0 at the road start, 1 at the end) per vertex.

- [ ] **Step 1: Write the failing test**

Append to `src/lib/road.test.ts` (import `buildEdgeGeometry` from `./road` and `CatmullRomCurve3, Vector3` from `three` if not already imported):

```ts
describe('buildEdgeGeometry', () => {
  const curve = new CatmullRomCurve3([new Vector3(0, 0, 0), new Vector3(0, 0, -50), new Vector3(0, 0, -100)])
  it('is a ribbon with a progress attribute running 0 to 1', () => {
    const g = buildEdgeGeometry(curve, 3.2, 0.5, 0.12, 1, 10, 0.05)
    expect(g.attributes.position.count).toBe(22)
    const prog = g.attributes.progress
    expect(prog.itemSize).toBe(1)
    expect(prog.getX(0)).toBe(0)
    expect(prog.getX(21)).toBe(1)
  })
  it('sits inside the kerb at the given inset', () => {
    const g = buildEdgeGeometry(curve, 3.2, 0.5, 0.12, 1, 10, 0.05)
    const x0 = g.attributes.position.getX(0)
    const x1 = g.attributes.position.getX(1)
    expect(Math.min(x0, x1)).toBeCloseTo(3.2 - 0.5 - 0.12, 5)
    expect(Math.max(x0, x1)).toBeCloseTo(3.2 - 0.5, 5)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/road.test.ts`
Expected: FAIL, `buildEdgeGeometry` is not exported.

- [ ] **Step 3: Implement**

In `src/lib/road.ts`, extend `ribbon` to write a `progress` attribute (add `const prog: number[] = []`, push `t, t` per sample, and `geo.setAttribute('progress', new Float32BufferAttribute(prog, 1))`), then add:

```ts
// A thin strip just inside the kerb, for the lit edge. `progress` lets a shader light the part the
// car has travelled.
export function buildEdgeGeometry(curve: Curve<Vector3>, halfWidth: number, inset: number, width: number, side: 1 | -1, segments = 700, y = 0.045): BufferGeometry {
  return ribbon(
    curve,
    segments,
    y,
    (right, p) => p.clone().addScaledVector(right, side * (halfWidth - inset - width)),
    (right, p) => p.clone().addScaledVector(right, side * (halfWidth - inset)),
  )
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/road.test.ts`
Expected: PASS.

- [ ] **Step 5: Render the edges in `Road.tsx`**

Add imports: `useFrame` from `@react-three/fiber`, `useRef` from `react`, `AdditiveBlending, Color, ShaderMaterial` from `three`, `buildEdgeGeometry` from `@/lib/road`, `readRoadT` from `./useDriveFrame`, `NIGHT` from `./Night`. Add after the kerb memos:

```tsx
  const edgeL = useMemo(() => buildEdgeGeometry(curve, ROAD_HALF_WIDTH, 0.45, 0.12, 1, ROAD_SEGMENTS), [curve])
  const edgeR = useMemo(() => buildEdgeGeometry(curve, ROAD_HALF_WIDTH, 0.45, 0.12, -1, ROAD_SEGMENTS), [curve])
  const edgeMatL = useMemo(() => edgeMaterial(NIGHT.amber), [])
  const edgeMatR = useMemo(() => edgeMaterial('#a2c9d3'), [])
  useFrame(() => {
    const { t } = readRoadT()
    edgeMatL.uniforms.progress.value = t
    edgeMatR.uniforms.progress.value = t
  })
```

and the material factory above the component:

```ts
// The lit edge: faint ahead of the car, bright behind it. Values above one so bloom picks it up.
function edgeMaterial(hex: string): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    uniforms: { progress: { value: 0 }, color: { value: new Color(hex) } },
    vertexShader: 'attribute float progress; varying float vP; void main(){ vP = progress; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float progress; uniform vec3 color; varying float vP; void main(){ float lit = 1.0 - smoothstep(progress - 0.003, progress + 0.003, vP); gl_FragColor = vec4(color * mix(0.3, 1.7, lit), 1.0); }',
  })
}
```

Add the two meshes inside the returned group after the kerbs:

```tsx
      <mesh geometry={edgeL} material={edgeMatL} />
      <mesh geometry={edgeR} material={edgeMatR} />
```

Change the asphalt material's `roughness={1}` to `roughness={0.6}` so the HDR sky and lamps reflect a little on the wet surface. Note the warm-up in `Scene.tsx` groups programs by `programKey`, which reads `mat.type`; `ShaderMaterial` gets its own group and compiles like any other.

- [ ] **Step 6: Typecheck, lint, unit tests, and look at it**

Run: `npm run typecheck && npm run lint && npm run test:run`, then open `/drive` and scroll. Expect a citron edge on the left and a teal edge on the right, brighter behind the car.

- [ ] **Step 7: Commit**

```bash
git add src/lib/road.ts src/lib/road.test.ts src/components/scene/Road.tsx
git commit -m "3D drive: lit neon road edges and a wetter asphalt" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: 3D car: clearcoat paint, glowing lamps, pools that stay on the road

**Files:**
- Modify: `src/components/scene/Car.tsx`
- Modify: `src/components/scene/Effects.tsx`

- [ ] **Step 1: Paint**

In `Car.tsx`, import `MeshPhysicalMaterial` from `three`. Change `BODY_PAINT` to slate, `[79, 95, 99]`. In `recolorMaterial`, return a physical material:

```ts
  return new MeshPhysicalMaterial({ map: tex, color: mat.color, roughness: 0.38, metalness: 0.55, clearcoat: 1, clearcoatRoughness: 0.14 })
```

The function's return type stays `Material`.

- [ ] **Step 2: Lamps that bloom**

Change the headlight material to `emissiveIntensity={3}` with `toneMapped={false}`, and the tail lamp to `emissiveIntensity={2.4}` with `toneMapped={false}`. Both are `meshStandardMaterial`; the emissive colours stay.

- [ ] **Step 3: Pools out of the pitching chassis**

The two `planeGeometry args={[2.6, 7.5]}` pool meshes live inside the `[1, -1].map(...)` under `<group ref={chassis}>`. Move them to a sibling group of the chassis so pitch and roll cannot tilt them under the asphalt:

```tsx
        <group ref={chassis}>
          <primitive object={model} />
          {[1, -1].map((sx) => (
            <group key={sx}>
              {/* headlight and tail lamp meshes stay here */}
            </group>
          ))}
        </group>
        {/* Light pools hang off the road-following group: a pitch under acceleration used to dip them below the road and switch the beams off mid-scroll. */}
        {[1, -1].map((sx) => (
          <mesh key={sx} position={[sx * (halfW - 0.45), 0.025, front + 3.2]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[2.6, 7.5]} />
            <meshBasicMaterial map={pool} color="#edf4dc" transparent opacity={0.24} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
          </mesh>
        ))}
```

- [ ] **Step 4: Bloom**

In `Effects.tsx`, set `intensity={0.45}` and keep `luminanceThreshold={1}`.

- [ ] **Step 5: Typecheck, lint, and look at it**

Run: `npm run typecheck && npm run lint`. Open `/drive`: the car is a dark slate with soft highlights, its lamps glow, and while scrolling the pools ahead of the car never vanish.

- [ ] **Step 6: Commit**

```bash
git add src/components/scene/Car.tsx src/components/scene/Effects.tsx
git commit -m "3D drive: clearcoat slate paint, glowing lamps, light pools that stay on the road" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: 3D night mood and camera

**Files:**
- Modify: `src/components/scene/Scenery.tsx` (tints)
- Modify: `src/components/scene/Night.tsx` (afterglow)
- Modify: `src/components/scene/ChaseCamera.tsx` (desktop pose)

- [ ] **Step 1: Darker scenery tints**

In `Scenery.tsx`, change `NATURE_TINT` to `'#5f6a45'` and `KIT_TINT` to `'#7d8a86'`. Trees read as dark silhouettes, buildings as cooled shapes with only their painted windows standing out.

- [ ] **Step 2: A warm afterglow ahead**

In `Night.tsx`, add a component and mount it in `Night()` after `<Stars />`:

```tsx
// The last of the sunset, low on the horizon in the road's general direction. An additive plane
// that follows the camera with the dome.
function Afterglow() {
  const mesh = useRef<Mesh>(null)
  const tex = useMemo(
    () =>
      makeTexture(256, 128, (ctx, w, h) => {
        const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
        g.addColorStop(0, 'rgba(240,197,122,0.55)')
        g.addColorStop(0.5, 'rgba(226,169,94,0.18)')
        g.addColorStop(1, 'rgba(226,169,94,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      }),
    [],
  )
  useEffect(() => () => tex.dispose(), [tex])
  useFrame(({ camera }) => {
    mesh.current?.position.set(camera.position.x + 40, camera.position.y + 6, camera.position.z - 330)
  })
  return (
    <mesh ref={mesh} frustumCulled={false} renderOrder={-1}>
      <planeGeometry args={[520, 240]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} blending={AdditiveBlending} fog={false} toneMapped={false} />
    </mesh>
  )
}
```

The plane faces +z by default and the camera looks roughly toward -z, so it faces the viewer.

- [ ] **Step 3: Closer chase**

In `ChaseCamera.tsx`, change `DESKTOP` to `{ back: 13, side: -5.6, up: 6.6, lookSide: 1.3, lookAhead: 13, lookY: 2 }`. The car grows in frame while the road still runs under the right-hand panels.

- [ ] **Step 4: Typecheck, lint, and look at it**

Run: `npm run typecheck && npm run lint`. Open `/drive` at 1440 wide and at stop 2 and stop 4: the car must not sit under the content panel, and the afterglow must sit at the horizon, not in the sky.

- [ ] **Step 5: Commit**

```bash
git add src/components/scene/Scenery.tsx src/components/scene/Night.tsx src/components/scene/ChaseCamera.tsx
git commit -m "3D drive: night silhouettes, horizon afterglow, closer chase camera" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Build, end-to-end tests, docs, push

**Files:**
- Modify: `README.md` (one line under Layout for `src/lib/heroArt.ts`)

- [ ] **Step 1: Stop the dev server, build**

Run: `npm run build`
Expected: success. The postbuild IndexNow step may print "indexnow skipped"; that is fine.

- [ ] **Step 2: End-to-end, desktop and phone first**

Run: `npx playwright test --project=desktop --project=phone`
Expected: all pass. If `home on tablets` fails on the `.tp-cp` centre check, the on-road `.tp-cp` circle has moved off the centre line; it must keep `cx = p.x`.

- [ ] **Step 3: Full suite**

Run: `npm run test:e2e`
Expected: pass across desktop, phone, firefox, webkit, no-webgl.

- [ ] **Step 4: README**

Under Layout, after the `src/lib/` line, add: `- \`src/lib/heroArt.ts\` draws the hero landscape behind the 2D road; \`src/components/track/CarGlyph.tsx\` is the car both 2D roads share.`

- [ ] **Step 5: Commit and push**

```bash
git add README.md docs/superpowers/plans/2026-09-17-round2-driving-ux.md
git commit -m "Docs: round 2 driving UX plan and layout note" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push origin main
```

---

## Self-review notes

- Spec coverage: 2D changes 1 to 6 map to Tasks 3, 4, 5. 3D changes 1 (materials only this round), 2, 3, 4, 5, 6 map to Tasks 6, 7, 8. Change 7 (budget) is unchanged by this round. The report's sourcing of a real sedan (3D change 1, option B) is explicitly out of scope: no new binary assets.
- Type consistency: `Sample`, `outlinePath`, `polylinePath`, `perspective`, `roadWidthAt` are defined in Task 1 and consumed in Task 4 with the same signatures. `buildEdgeGeometry` is defined in Task 6 Step 3 and consumed in Step 5 with seven arguments in the same order. `CarGlyph({ id })` is defined in Task 3 and used in Tasks 3 and 4. `TileIcon({ name })` and the `icon` key are defined in Task 5.
- Placeholder scan: none.
