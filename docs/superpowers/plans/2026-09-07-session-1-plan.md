# Session 1 plan: scaffold to first deploy

Spec: `docs/superpowers/specs/2026-09-07-the-drive-design.md`. Every task ends with a verifiable check. Tasks run in order unless marked parallel.

## Task 0. Baseline (done in this session before the plan)
- Next.js 16.3.4 scaffold at repo root, TypeScript strict, Tailwind 4, `src/` layout, `@/*` alias.
- Deps: three 0.185, @react-three/fiber 9.7, @react-three/drei 10.7, zustand 5. Dev: vitest 5, @vitejs/plugin-react, jsdom, @testing-library/react and dom, vite-tsconfig-paths, @playwright/test 1.63, @types/three.
- Git initialised on `main`. `.gitignore` extended for asset zips and test output.
- Check: `npm run build` passes on the scaffold.

## Task 1. Project skeleton and tooling
Files: `vitest.config.mts`, `vitest.setup.ts`, `playwright.config.ts`, `package.json` scripts (`test`, `test:e2e`, `typecheck`), `next.config.ts` (React strict mode, image domains none), `README.md` (what this is, how to run, licence note for Kenney assets), `LICENSE-ASSETS.md`.
Check: `npm run typecheck` and `npm test` run with zero tests, `npx playwright test --list` finds the config.

## Task 2. Content file
`src/content/profile.ts`: typed objects for identity, headline, lede, location, links, six stops (eyebrow, heading, body, bullets or cards), milestones, skills lines, resume sections. Ported from the corrected resume and the preview panels. Exported types.
Check: unit test asserts no banned words (leverage, spearheaded, seamless, robust, cutting-edge, passionate, innovative, results-driven, dynamic, landscape), no em dashes, no semicolons, no "freelance", "Upwork", "client", "Tikaj", "Cloudflare", no digit followed by " commits".

## Task 3. Scroll model (pure, tested first)
`src/lib/scroll.ts`: `measureZones(sectionRects, maxScroll)`, `roadT(s, zones, tStops, tEnd)`, `currentStop(s, zones)`.
Tests: plateau values equal `T_STOPS` inside each zone, monotonic non-decreasing across 0 to 1, ends at `tEnd`, `currentStop` boundaries.
Check: `npm test` green.

## Task 4. Road geometry (pure, tested first)
`src/lib/road.ts`: `buildRoadGeometry(curve, width, segments)`, `buildKerbGeometry`, `dashMatrices(curve, count)`.
Tests: vertex and index counts, all y values at the expected heights, dash count.
Check: `npm test` green.

## Task 5. Recolor (pure, tested first)
`src/lib/recolor.ts`: `recolorRedCells(imageData, targetRGB)` returns a new ImageData with red or orange cells replaced, everything else untouched.
Tests: a 4-pixel fixture (red, grey, blue, orange) recolours exactly two pixels.
Check: `npm test` green.

## Task 6. Store and scroll hook
`src/store/drive.ts` (zustand): `scroll`, `stopIndex`, `reducedMotion`, `webglOk`, setters. `src/hooks/useScrollProgress.ts`: rAF-throttled listener that measures zones on resize and writes to the store.
Check: component test mounts a probe and dispatches scroll, store updates.

## Task 7. HTML layer
`src/app/layout.tsx` (fonts Bricolage Grotesque and IBM Plex Sans via next/font, metadata, skip link), `src/app/globals.css` (tokens, panel and HUD styles from the preview), `src/app/page.tsx`, `src/components/hud/*`, `src/components/stops/*` rendering from `profile.ts`. `public/Dhruv_Gopani_Resume.pdf` copied from the Resume folder. Real links for Resume and PDF.
Check: `npm run build`, then Playwright: six `section.stop` elements, odometer text changes after scrolling, PDF link returns 200.

## Task 8. Models into public
Copy only the 35 used models and four colormaps from `design/assets` into `public/models/<kit>/`. Script `scripts/copy-models.mjs` with the allowlist so it is repeatable.
Check: `du` under 3 MB, every path referenced in `route.ts` exists (unit test reads the allowlist and the placement table).

## Task 9. Scene: canvas, lights, road, car, camera
`src/components/scene/Scene.tsx` (Canvas, dpr caps, shadows off on phones, fog, dusk lerp), `Road.tsx`, `Car.tsx` (useGLTF sedan, wheel nodes by name, steer, roll, pitch, exhaust, lamps and spotlights, recolor via `lib/recolor`), `ChaseCamera.tsx`, `Fallback.tsx`. Client boundary `SceneMount.tsx` with `next/dynamic` and `ssr: false`, WebGL probe before mounting.
Check: dev server, manual scroll shows the car driving and idling at stops on desktop and phone emulation. Playwright: with WebGL disabled (`--disable-gpu --disable-webgl` launch args) the fallback text is visible and all six stops still render.

## Task 10. Scenery, water, hills, pier, billboards
`src/content/route.ts` placement table ported from the preview (t, lateral, model, fit, rotation). `Scenery.tsx` with per-model `useGLTF`, bounding-box fit, unfold animation. `Water.tsx`, `Hills.tsx`, `Pier.tsx`, `Billboard.tsx`.
Check: screenshots at s = 0, 0.23, 0.42, 0.585, 0.75, 0.935 on desktop and phone, no console errors.

## Task 11. Resume route
`src/app/resume/page.tsx` from `profile.ts`, print stylesheet, download link.
Check: Playwright loads `/resume`, headings present, `@media print` hides HUD.

## Task 12. Quality gate and deploy
Lint, typecheck, unit, e2e all green. Lighthouse on `next start` (desktop and mobile). Create GitHub repo `Dhruv278/portfolio-drive` (public), push `main`. Vercel: `npx vercel link` and `npx vercel --prod`, or connect the repo in the Vercel dashboard if CLI login is interactive.
Check: production URL loads, scroll drives the car, `/resume` works, PDF downloads.

## Definition of done for session 1
- All checks above pass and are recorded in the session report.
- Production URL shared with the owner.
- Known gaps listed: scenery detail still tuning, playground not started, sound absent.
