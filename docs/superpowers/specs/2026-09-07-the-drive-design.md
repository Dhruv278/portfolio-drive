# The Drive: design spec

Date: 2026-09-07. Status: approved in conversation, this document records it.
Owner: Dhruv Gopani. Repo: `Dhruv278/portfolio-drive`. Hosting: Vercel.

## 1. Purpose

A job-application portfolio for Senior Full-Stack Engineer and Product Lead roles at US and EU startups. It has one job: get a recruiter or hiring manager from landing to "this person can build and lead" in under a minute, then to the resume. The 3D experience is the memorable part. The content is the deliverable.

Separate from the freelancer portfolio at `C:\Projects\portfolio`, which stays untouched.

## 2. Concept

A scroll-driven road trip. A cobalt sedan drives along a winding road through six stops. Scrolling is the only clock: the car moves as the visitor scrolls, slows and idles at each stop while that stop's content panel is pinned, then drives on. Scenery unfolds ahead of the car. Day turns to dusk at the last stop, where the road ends at a pier.

At the final stop a "Take the wheel" button unlocks a small free-drive playground (session three).

## 3. Stops and content

Content comes only from the corrected resume (`C:\Projects\Resume\Dhruv_Gopani_Resume.pdf`, September 2026). Rules inherited from that work: no commit counts, no freelance, client or Upwork wording, no Tikaj Security, no Cloudflare project, no unsupported numbers, problem-first bullets, US spelling, no em dashes or semicolons.

| # | Stop | Scenery | Panel content |
|---|---|---|---|
| 1 | Start | Suburban houses, fence, trees, mailbox sign | Name, headline, one-line lede, location line, Download resume, Start the drive |
| 2 | Omnis AI, MedChron | Town: commercial blocks, shop front, tower | Problem statement plus four verified bullets (dedup and extraction rebuild, page-level citations, Chi to release candidate, medications 53% to 26%). Chips for earlier roles |
| 3 | Own products | Industrial workshop, shipping containers, tank, billboard | AgentFlow and the short-video pipeline, one card each, stack chips |
| 4 | Delivered platforms | Harbour: warehouse, water tower, towers, chimney, pier posts | Five one-line entries: wholesale quotation, deposit-return recycling, license lifecycle, incentive engine, exchange backend |
| 5 | How I work | Hills, windmills, solar array, three billboards | Stack, AI, tooling, habits, four short paragraphs |
| 6 | Contact | Coast at dusk, cottage, palms, pier | Email, LinkedIn, GitHub, Resume. Take the wheel |

Milestone signposts between stops 1 and 2 carry "The Coding Studio, 2024 to 2025" and "OTPless, 2023".

A plain `/resume` route mirrors the PDF as HTML, print-friendly, with the download link. This is the URL for applications.

## 4. Visual system

Modelled low-poly assets from Kenney's kits (public domain, CC0): City Kit Suburban, Commercial and Industrial, Nature Kit, Car Kit. Only the models the scene uses ship in `public/models/` (about 2.3 MB total, 35 models plus four palette textures). Paper-craft primitives were the first draft and were replaced at the owner's request for real entities.

Palette: sky `#DCEAF4`, ground `#E3E6D6`, road `#9EA4AC`, kerb `#D8DCE0`, ink `#1E2A38`, panel paper `#F6F2EA`, accent cobalt `#2F5BEA`, dusk sky `#F3D9C4`. The car ships red in the kit and is repainted cobalt at load by recolouring the red cells of its palette texture.

Type: Bricolage Grotesque for display (name, headings), IBM Plex Sans for body. Loaded with `next/font`. Headline words sit on paper strips with a hard 3 px shadow.

Panels are real HTML, right-aligned on desktop (car on the left), bottom sheet on phones (car above). Cobalt eyebrow, display heading, 14.5 px body.

## 5. Motion rules

- Scroll is the only clock. No autoplay, no timers that move the car.
- Scroll fraction maps to a road parameter with an idle plateau at each stop (six plateaus, `T_STOPS = [0.035, 0.21, 0.39, 0.57, 0.75, 0.955]`, car ends at 0.972 so it stops short of the pier).
- Chase camera behind, left and above the car with lerp lag (0.07 position, 0.09 look). Phones use a higher, more centred camera. The hero on phones uses a low forward camera so the car appears below the headline.
- Front wheels steer from the road's curvature ahead. Body rolls with steer times speed and pitches with acceleration. Wheels spin with distance. Exhaust puffs while moving.
- Scenery scales up from the ground as the car approaches (eased, starts 0.085 of road parameter ahead).
- Dusk: sky, fog and sun lerp toward dusk colours from road parameter 0.8 to 0.98. Headlight spotlights and emissive lamps switch on with dusk.
- Reduced motion: camera snaps instead of lerping, scenery appears without the unfold, panels fade instead of slide.

## 6. Architecture

Next.js 16 App Router, TypeScript strict, Tailwind 4. React Three Fiber 9, drei 10, Three 0.185, zustand 5.

```
src/
  app/
    layout.tsx            fonts, metadata, skip link
    page.tsx              server component: HUD + Stops (HTML) + <Scene/> (client, lazy)
    resume/page.tsx       plain HTML resume, print styles
    globals.css           tokens, panel styles, HUD
  content/
    profile.ts            typed content for every stop and the resume (single source of truth)
    route.ts              road control points, T_STOPS, scenery placement table
  lib/
    scroll.ts             pure: measure zones, roadT(s), currentStop(s)   (unit tested)
    road.ts               pure: build road, kerb and dash geometries from a curve (unit tested)
    recolor.ts            pure: repaint palette cells on an ImageData  (unit tested)
  store/
    drive.ts              zustand: scroll fraction, stop index, reduced motion, webgl ok
  components/
    hud/ Wordmark, Actions, Odometer, Hint
    stops/ StopSection, Panel, HeroPanel, and one content component per stop
    scene/
      Scene.tsx           Canvas, lights, fog, dusk, renderer settings, dynamic import boundary
      Road.tsx            uses lib/road
      Car.tsx             useGLTF sedan, wheel nodes, steer, roll, lights, recolor
      Scenery.tsx         reads route.ts placement table, useGLTF per model, unfold
      Water.tsx, Hills.tsx, Pier.tsx, Billboard.tsx
      ChaseCamera.tsx
      Fallback.tsx        message when WebGL unavailable
  hooks/
    useScrollProgress.ts  window scroll to store, rAF throttled
public/
  models/<kit>/*.glb and <kit>/Textures/colormap.png
  Dhruv_Gopani_Resume.pdf
```

Data flow: `useScrollProgress` writes `scroll` to the store on every frame. HTML side reads `stopIndex` for the odometer. Scene side reads `scroll`, computes `roadT`, and drives car, camera, scenery and dusk inside `useFrame`. No React re-renders per frame in the scene: refs and the store's `getState()` only.

The page is complete without the canvas. `Scene` is a client component loaded with `next/dynamic` and `ssr: false` from a client boundary. If WebGL is missing or the loader throws, `Fallback` renders and the HTML is untouched.

## 7. Performance budget

- First paint is the HTML hero. The 3D bundle and models load after hydration.
- 60 fps on an integrated laptop GPU at 1440 by 900. Pixel ratio capped at 1.75 desktop, 1.25 phone. Shadows off on phones.
- Models total under 3 MB. Trees and fence posts instanced where repeated.
- Lighthouse performance 85 or better on desktop, 75 or better on mobile, accessibility 95 or better.

## 8. Accessibility

Skip link to content. All content in the DOM as headings, paragraphs and lists. Canvas is `aria-hidden`. Odometer is a live region. Visible focus ring in cobalt. Reduced motion respected. Colour contrast 4.5 to 1 or better on all panel text.

## 9. Testing

- Unit (Vitest): `roadT` plateaus and monotonicity, `currentStop` boundaries, road geometry vertex counts, recolor only touches red cells.
- Component (Vitest plus Testing Library): stop panels render the content file, odometer text updates from the store.
- End to end (Playwright, Chromium): page loads, all six stops reachable by scrolling, HUD updates, `/resume` renders and prints, WebGL disabled shows fallback and content, no serious axe violations, phone viewport shows bottom sheet.
- Lighthouse on each Vercel preview deploy, manually in session one, automated later.

## 10. Sessions

1. Scaffold, content file, scroll rig, road, car, camera, six panels, fallback, unit and e2e tests, first Vercel deploy.
2. Scenery for all six stops, milestone signposts, dusk, HUD polish, `/resume` page, phone tuning, Lighthouse pass.
3. Playground: "Take the wheel", arrow and touch driving in a bounded arena, project billboards that open cards, six skill badges, exit back to the route. Optional sound.

## 11. Out of scope for version one

Sound, custom-modelled car, textured hero pieces, a CMS, analytics beyond Vercel's built-in, a blog, dark mode.

## 12. Open items for the owner

- Custom LinkedIn URL once claimed, so the contact stop and resume match.
- Final Omnis AI title wording and The Coding Studio title, same as the resume decisions.
- Domain name, when bought, pointed at Vercel.
