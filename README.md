# The Drive

Dhruv Gopani's portfolio. A scroll-driven road trip: a cobalt sedan drives through six stops, one per chapter of the work, while the content stays real HTML underneath.

Design spec: `docs/superpowers/specs/2026-09-07-the-drive-design.md`. Plans: `docs/superpowers/plans/`.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, React Three Fiber, drei, Three.js, zustand. Tests with Vitest and Playwright. Hosted on Vercel.

## Run

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck
npm test             # unit and component tests (watch mode)
npm run test:run     # unit and component tests, once
npm run build && npm run test:e2e   # Playwright against a production build
```

## Layout

- `src/content/profile.ts` is the single source of truth for every word on the site and the resume page.
- `src/content/route.ts` holds the road, the stop positions and the scenery placement table.
- `src/lib/` holds pure, unit-tested logic (scroll mapping, road geometry, texture recolor).
- `src/components/scene/` is the 3D layer. `src/components/stops/` and `src/components/hud/` are the HTML layer.
- `public/models/` holds only the models the scene uses. See `LICENSE-ASSETS.md`.
- `design/` holds the standalone preview that the design was approved on. It is not part of the build.

## Content rules

The site inherits the rules from the resume work: problem-first bullets, no commit counts, no freelance or client wording, US spelling, no em dashes or semicolons. A unit test enforces the banned-word list against the content file.
