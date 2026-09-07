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

## Addendum: owner review round two

Reported: laggy drive, road needs stripes, marks vanish on scroll, must work in all browsers, improve loading.

- Measured first. Dev tab ran at 33 fps and production at 32 fps on Intel Iris Xe. A renderer counter readout (`?stats=1`) showed only 55 thousand triangles and about 250 draw calls, so geometry was not the cost. A performance trace showed a 2 second synchronous shader compile from drei's `Preload` right after load, and the GPU process at 93 percent because the scene rendered continuously while idle.
- Fixes: on-demand rendering driven by the eased drive clock (nothing renders when nothing moves), asynchronous shader compilation gated behind the fade-in, Lambert materials for all kit models, shadow map halved and small props no longer cast, headlight spotlights replaced by additive beam cones (real lights changed the light count at dusk and recompiled every material, a 1.2 second stall), resolution capped at 1.5 desktop and 1.25 phone.
- Result on the same machine: renderer 45 to 58 fps while driving, zero frames while idle, shader programs down from 17 to 9.
- Road: solid white edge lines and wider, brighter centre dashes. The dash instanced mesh recomputes its bounding sphere after placement and skips frustum culling. It had been culled once the camera left the origin, which is why the marks vanished.
- Browsers: WebGL 2 is required (Three.js r163 and later), otherwise the plain fallback renders. Playwright now runs Firefox and WebKit projects alongside Chromium, phone and no-WebGL. All pass.
- Loading: every model preloads as soon as the scene bundle arrives, the odometer shows a percentage, the canvas fades in when compilation is complete, and models carry immutable cache headers.

## Addendum: content and animation round

The owner asked for more data, project skills, new animation, and pointed at his Vercel address. That address is the earlier freelancer portfolio, which stays as it is. Its data file was the content source.

- Tech chips on MedChron, on both own products and on all six delivered platforms. The food-surplus marketplace joins the platforms from the old site. Testimonials and Upwork figures stay out under the no-freelance rule, the Cloudflare generator stays out because that repository is not his, and the CasePro MCP layer stays out because the git history shows one commit.
- Stop five is a skills board: ten groups, chips for each, one how-I-work line. The same words as the resume with a few additions the code on disk supports (React Three Fiber, Vitest, tRPC, Payload CMS, Razorpay, Twilio, Zoho, Mapbox).
- Reveal: a small client component marks the current and previously seen stops active. CSS slides the panel in and staggers bullets, chips, cards and skill groups. Sections without the attribute stay fully visible, so no JavaScript means no hidden content. Reduced motion disables all of it.
- Living world: exhaust puffs while moving, windmill sails turn, water ripples, seven clouds drift, five birds circle above the car. An idle loop requests frames at 24 per second while the tab is visible and the visitor has interacted in the last 25 seconds, then sleeps.
- End-to-end suite: 30 passed across five engines, including two new tests for chips and the reveal.

## Addendum: clipped panel heading

Reported with a screenshot: the MedChron heading was cut off at the top of its panel.

- Cause: the previous round capped panels at 82 percent of the window and let them scroll inside. A mouse wheel over a panel then scrolled the panel's inside before the page, so the heading slid out of the box while the car stayed put. Inner scrolling on a desktop panel is a mistake, not a tuning problem, and is gone.
- Panels now fit the window where they can: 540 pixels wide, the platforms and skills panels 720 wide with two columns, and the skills board packed with CSS columns so a one-row group leaves no hole beside a three-row neighbour. On a 742 pixel tall window every panel fits under the HUD.
- Panels that still outgrow a small window stay pinned under the HUD, then slide up to show their end while the car is still parked. Each section carries a 70 percent viewport spacer after its panel, so a section grows with a tall panel, and the scroll model now measures in viewport heights: the car parks 0.36 viewports after a section's top passes and leaves with 0.88 viewports of the section remaining. A taller section therefore keeps the car parked longer, which the unit test asserts.
- Phones keep the bottom sheet, which scrolls inside like a maps sheet. It now carries a grab bar so it reads as one, and sits above the odometer instead of under it.
- In windows narrower than 1140 pixels the odometer drops the stop name so the board panels clear it, and the board panels cap their width to the space right of it.
- New end-to-end test walks the scroll through a stop and asserts the panel is fully on screen at least once while the odometer names that stop, and that the tallest panel's end comes on screen before the car leaves.

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
