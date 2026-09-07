# Session 1 report, 7 September 2026

Plan: `2026-09-07-session-1-plan.md`. Spec: `../specs/2026-09-07-the-drive-design.md`.

## Completed

| Task | Result |
|---|---|
| 0 Baseline | Next.js 16.3.4, React 19, Tailwind 4, TypeScript strict. R3F 9.7, drei 10.7, three 0.185, zustand 5. Vitest 5 (plus explicit vite 8), Playwright 1.63. |
| 1 Tooling | vitest, playwright and npm scripts in place. README and LICENSE-ASSETS written. |
| 2 Content | `src/content/profile.ts` holds every word for the six stops and the resume page. Banned-word, spelling and consistency tests pass. |
| 3 Scroll model | `lib/scroll.ts` with plateau, monotonicity and stop-index tests. |
| 4 Road geometry | `lib/road.ts` with vertex, index, height and dash tests. |
| 5 Recolor | `lib/recolor.ts` repaints only red and orange palette cells, tested on a fixture. |
| 6 Store and hook | zustand store, rAF-throttled scroll hook writing scroll fraction and stop index. |
| 7 HTML layer | Layout with self-hosted Bricolage Grotesque and IBM Plex Sans, six stop panels, HUD odometer, skip link. |
| 8 Models | 35 Kenney models and 4 palette textures copied by an allowlisted script, 2.29 MB. A test checks the allowlist matches the placement table and every file exists. |
| 9 Scene | Canvas mounted client-side after a WebGL probe, fallback otherwise. Road, kerbs, dashes. Kenney sedan repainted cobalt with steering, roll, pitch, wheel spin, exhaust-free for now, dusk lamps and spotlights. Chase camera with phone variants. |
| 10 Scenery | Placement table ported, unfold-on-approach, water, road-relative hills, pier, pier posts, billboards. |
| 11 Resume route | `/resume` renders the PDF content as HTML with print styles. |
| 12 Gate | Typecheck, lint, 22 unit tests, 12 e2e tests green. Lighthouse on the production build: accessibility 100, best practices 100, SEO 100. Repo pushed to GitHub. |

## Fixes made during the owner's review

- Hills placed in absolute coordinates overlapped the road at stop five. They are now placed relative to the road, and a unit test samples the curve to assert clearance.
- Motion followed raw scroll steps. A `DriveClock` now eases the road parameter each frame, time-based, and every consumer reads the eased value.
- Tailwind's reset removed list bullets in the panels. Restored.

## Environment lessons

- Port 3100 on this machine belongs to another app. Playwright uses 3777 and refuses to reuse a foreign server.
- Next 16 blocks dev resources from origins not in `allowedDevOrigins`. Open the dev server as `localhost`, or use the IP now that it is allowed.
- Headless Chromium renders WebGL in software and starves the page, so the scroll e2e test runs with `?scene=off`.
- The React Compiler lint forbids mutating hook-derived values in frame loops. Refs mutated directly, declarative background and fog, and module-level scratch objects satisfy it.

## Not done, carried to session 2

- Vercel deploy. The CLI needs an interactive login the owner must run.
- Lighthouse performance score. The audit tool covers accessibility, SEO and best practices only. A performance trace is the next check.
- Exhaust puffs, milestone signpost text, tilt-shift blur, textured billboards, the `/resume` print check in e2e, axe accessibility scan in e2e.
- Scenery density and colour balance tuning at stops three and four.

## How to run

```
npm run dev              # then open http://localhost:3000
npm run test:run         # unit tests
npm run build && npm run test:e2e
```
