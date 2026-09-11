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

## Addendum: mobile check

The owner asked whether the site is properly responsive. Measured on six device profiles through the headed debug Chrome (Galaxy S8 360, iPhone SE 320, iPhone 14 390, Pixel 7 412, iPhone 14 landscape 750 by 340, iPad Mini 768 portrait): no horizontal overflow anywhere, panels never off screen, resume page fine. Three defects found and fixed:

- On a 320 px screen the top bar wrapped to two rows and covered the hero eyebrow. Screens up to 430 px now get a compact one-row bar, buttons never wrap, and the resume page shortens "Back to the drive" to "Back". The hero panel sits at max(12vh, 74px).
- In landscape (height up to 480 px) the desktop layout applied with the hero under the top bar and the odometer over the buttons. The HUD now forms one top strip (wordmark, odometer, actions), panels start at 84 px, the hero shrinks, the hint hides.
- Buttons were 38 px tall. Coarse pointers get 44 px targets.

The phone layout is now defined once: portrait screens up to 900 px wide (CSS media query and `MOBILE_QUERY` / `isMobileSize` in `src/lib/layout.ts`, which the scene uses for camera, dpr and shadows). Portrait tablets therefore get the bottom sheet; landscape phones get the desktop layout with the short-screen rules. Chips are 12 px on phones. A phone-project e2e test asserts one HUD row, no overlap with the hero, 44 px controls and no horizontal overflow.

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

## Addendum: realistic world, stage 1 (8 September 2026)

The owner said the trees, buildings and car do not look real and chose "realistic world, staged" (spec: `../specs/2026-09-07-realistic-world-design.md`). Stage 1 is real light, real road and ground, effects where the GPU allows.

- Light: Poly Haven `autumn_field_puresky` 1k as the environment map and, unblurred, as the visible sky. Neutral tone mapping set at Canvas creation. Sun, hemisphere, environment and sky intensities ease at dusk through uniforms only. Kloofendal partly cloudy and clear variants were tried and looked grey; the autumn sky read as a real blue day.
- Surfaces: the road is one draw call with a strip texture painted in Canvas 2D at load (asphalt tiled to world scale, edge lines, centre dashes, tyre wear, aged paint) plus asphalt normal and roughness maps. The dash instanced mesh and the four line meshes are gone. Ground: `leafy_grass` colour, normal and roughness, with a 2048 colour map of sixteen flipped and rotated copies under a soft light-and-shade wash so the repeat sits at 28 m. Kerbs: `concrete_pavement_02`. Hills wear the grass. Water: standard material with the sky reflection and a drifting normal map. Car paint is a standard material with a contact shadow under the car. Clouds are drei sprite clouds with a self-hosted texture.
- Context loss, the lesson of the day: mounting drei's `Environment` with the HDR lost the WebGL context every time on Intel Iris Xe, in a fresh browser too. Prefiltering the HDR, recompiling every PBR material with the environment, the shadow pass and the first frame all landed in one frame. The same work split across frames, in the warm-up before the fade-in (decode, prefilter, assign, `compileAsync`, one rendered frame), never lost the context. Rule: the environment must exist before shaders compile, and heavy GPU set-up gets its own frames.
- Effects: N8AO at half resolution and performance quality plus SMAA and a vignette measured 23 fps driving against 40 without, at dpr 1 on the owner's laptop. The chain stays in the code but runs only when the WebGL renderer string is not integrated graphics (`src/lib/gpu.ts`), or when forced with `?fx=1`. Desktop dpr cap is 1.25 now, as the spec budget states.
- Measured after the change, dpr 1, 1280 by 800, no effects: 34 to 37 fps driving across the stops, 15 to 28 idle at the 24 fps idle loop, ready in 8 to 11 s on the dev server, no console errors. Assets: models 2.3 MB, textures 2.9 MB, sky 1.1 MB; a unit test caps the total at 10 MB.
- Also fixed on the way: loader progress is read through a subscription, not a hook, which removed a React setState-in-render error raised from inside drei's loaders; textures preload with the models; the renderer, scene and camera are exposed on `window.__drive` with `?stats=1` for in-page diagnosis.
- Still to do in stage 1: the realistic CC-BY car. Downloading from Sketchfab needs the owner's account. Candidates are listed in the spec. Stage 2 replaces trees, buildings and hills.

## Addendum: session A of the world tells the story (10 September 2026)

Spec: `../specs/2026-09-10-world-tells-the-story-design.md`. Plan: `2026-09-10-session-a-garage-intro-medchron.md`. Delivered on branch `session-a`, merged to main.

- The Canvas painter (`scene/paint.ts`): signs, cards, boards and the garage door in the paper, ink and cobalt language, text from `profile.ts`. Painting is queued and done one canvas per frame; the boards repaint once the web fonts load.
- The piece toolkit (`scene/pieces/toolkit.tsx`): textured masses, posts, signs, screens and additive glow, with four CC0 wall and metal texture sets at 512 px (0.23 MB together).
- The intro: the car starts inside a brick garage behind the road's origin with `DHRUV GOPANI` on the roller door. After the warm-up the door lifts, the headlights come on, the car rolls out to the first stop and the camera swings from the door into the chase, 3.5 s, ended at once by a scroll, skipped under reduced motion or with `?intro=0`.
- The arrival camera: parked at a stop, the camera eases to a higher, wider pose from `ARRIVAL_POSES` that frames the set piece on the camera side, and back again when the car leaves.
- MedChron: a records building with a loading dock, a `Medical Records` sign and a board that counts 53% to 26%, 0 to 28 defects and 3 QA rounds on arrival. A conveyor of instanced paper sheets runs from the dock through a cobalt scanner arch labelled `Extract and cite` and continues as paper cards. Five chronology signposts (date, provider, finding, page citation) and a closing `Cited chronology` card stand by the kerb, turned toward the approaching car. Three Kenney buildings and two trees at the stop are gone.
- Measured on the dev server at dpr 1, 1280 by 800, no effects: 35 fps driving at the start and at the MedChron stop, 20 to 26 idle at the 24 fps idle loop, ready in 7.5 to 9 s. Draw calls 292 at the start, 332 at MedChron.
- End-to-end on the production build: 39 passed across five engines, 1 flaky then passed, 20 skipped by design (engine-specific tests). Three new tests: the intro plays and ends, the intro skips when the visitor has scrolled, the garage, the MedChron piece and the car exist in the scene.

### What went wrong and what it taught

The WebGL context was lost on roughly a third of loads while this landed. Instrumented with per-step warm-up marks and a wrapper around `gl.render` (both on `window` with `?stats=1`), four causes surfaced, all fixed:

1. Fiber requests a frame every time the scene graph changes, even with `frameloop="demand"`. When the loaded models committed, that frame drew the whole scene with every shader uncompiled: a 1.3 s stall. The Canvas now runs `frameloop="never"` until the warm-up reports ready.
2. The warm-up started before React had committed the scenery, so it compiled and drew a third of the scene. It now waits for the scenery group to hold every placement and for the mesh count to stay still.
3. Canvas 2D is GPU rasterised. Painting fifty boards plus the 2048 ground map and the road strip inside the commit task was enough GPU work to trip the Windows watchdog. Painting is queued and drained one canvas per frame.
4. The first draw with each shader program still compiles driver-side variants on ANGLE, so drawing everything in one frame after `compileAsync` took 1.2 s. The warm-up uploads textures two per frame and draws one program group per frame (17 groups, longest 150 ms).

Two more lessons: the fiber clock restarts from zero when the frameloop switches on, so anything timing across ready uses `performance.now()`. And a test harness that opens and closes WebGL contexts every few seconds makes the debug browser's GPU process lose contexts on its own; measurements need a fresh browser and ten seconds between runs. In the dev server this week `next/font` failed to fetch the Google fonts and fell back, so dev screenshots show the fallback face; the production build has the font files.

## Addendum: proof first, session P1 (10 to 11 September 2026)

The owner asked whether the resume or the portfolio would get him hired and asked for a blunt critique. A research pass on how US and EU startups hire (referrals and recruiter sourcing produce most hires, portfolios are a tiebreaker backend and AI reviewers rarely open, 3D portfolios belong to creative developers) led to a new direction, spec `../specs/2026-09-10-proof-first-design.md`: the site leads with proof and keeps the drive as its signature moment. Sessions B to D of the set-piece plan are cancelled.

- `/` is new: a one-viewport hero with the scene in a hero mode (car parked at the first stop, fixed camera, mounted after first paint, rendering paused once scrolled away), a proof strip on ink with three measured results that count up once, four case studies (the problem, the call, what shipped, what it measured) with artefact frames, the six platforms as rows, and contact. The six-stop drive moved verbatim to `/drive`, linked from the hero and the top bar.
- The nature kit's mint-and-peach palette is tinted toward green leaves and brown trunks so the toy trees no longer fight the photographic ground.
- Home copy lives in `profile.ts` under the banned-word test. Numbers mirror the resume. Artefact frames for MedChron, AgentFlow and the video pipeline are honest placeholders until session P2 supplies the mock screen, the app screenshots and the rendered clips; the site case study carries a real production screenshot and a before-and-after table.
- End-to-end on the production build: 47 passed across five engines, 23 skipped by design. New tests: the home structure and counters, the hero scene mounting and pausing.
- Left for P2 and P3: artefacts, the two write-ups, the AgentFlow screenshots (the frontend repository is public at github.com/Dhruv278/Agentflow-frontend), resume and LinkedIn lines for remote and overlap, Vercel deployment.

## Addendum: proof first, sessions P2 and P3, and launch (11 September 2026)

- Artefacts. MedChron: an illustrative chronology screen drawn for the portfolio in the product's shape (six cited entries, a source page with the quoted span highlighted, a citation check), labelled inside the frame as not a product screenshot. AgentFlow: pricing and sign-in pages captured from the app running locally, with a link to the public frontend repository; the dashboard sits behind sign-in and the local API on port 3001 was not this app, so no dashboard screens. Video pipeline: three of the seven shorts rendered in April 2026 as seven-second muted loops (130 to 315 KB each) plus the 59-node workflow drawn from its own definition as a sideways-scrolling SVG. The 59-node claim matches `workflows/current_workflow.json`; the 36-node file is an earlier version. Site: the production MedChron screenshot and a before-and-after table.
- Writing. Two articles at `/writing/cited-chronologies` and `/writing/three-js-on-integrated-graphics`, drafted from the resume and these reports, marked "Draft, under review" on the page until the owner approves the wording. Listed on the home page.
- Positioning. The identity line, the resume header and the profile guide now say: remote, full overlap with Europe, three to four hours with US East, open to contract, employer of record or relocation. Resume regenerated, still two pages.
- Launch. Deployed from the CLI under the owner's personal Vercel scope as the new project `portfolio-drive`. Production alias: https://portfolio-drive-mu.vercel.app (also portfolio-drive-dhruv278s-projects.vercel.app). Per-deployment URLs sit behind Vercel's SSO protection by default; the production alias is public. `npm install` on Vercel needed `legacy-peer-deps=true` in `.npmrc`. A `.vercelignore` keeps design files, docs and tests out of the upload.
- Tests on the final production build: 52 passed across five engines, 23 skipped by design; 39 unit tests. Assets 6.8 MB of the 10 MB budget.
- Left for the owner: approve or edit the two write-ups (remove `draft: true` in `src/content/writing.ts`), confirm the Vercel project's Git connection in the dashboard so pushes to main deploy on their own, and decide on a custom domain.

## Addendum: the track, a 2D dark home (11 September 2026)

The owner liked the drive but found the paper look plain, asked for a "dark navy, advanced technology" feel, and sketched a 2D idea: a path down the page with a car that moves to each checkpoint as you scroll. He also asked for far more content (experience, projects, skills from the resume) and for animated background effects, with research on libraries.

- Sample first: `design/track-2d.html`, a self-contained page. He approved the UI.
- Then the route `/track` in the app: the SVG road is built at runtime from the cards' positions so it fits any viewport, scroll maps piecewise between checkpoints so the car is at a checkpoint exactly when its card is centred, the travelled road lights in amber, cards wake and a monospace telemetry readout shows checkpoint, stop and distance. Nine checkpoints: start, experience (three roles), MedChron with the illustrative screen and tickers, own products with the rendered shorts, six platforms, ten skill groups, education and awards, writing, contact. The 3D drive is one click away.
- Effects, from the research report (zero dependencies, about 4 KB of own code): a canvas starfield over the hero that streams with scroll velocity and pauses off-screen or on a hidden tab, two compositor-only aurora drifts, a one-shot light sweep around a card border when its checkpoint turns on, and number tickers. Reduced motion stills all of it. The research advised against every WebGL background (a second GL context, 34 KB or more, runs forever), against Aceternity's beams (51 infinite gradient tweens), and against letter-split or scramble text (breaks screen readers). Motion, GSAP and tsParticles were evaluated and left out for now; `motion` with `LazyMotion` (about 20 KB) is the pick if declarative reveals are wanted later.
- Open decision for the owner: make `/track` the home page. The proof-first page would become `/proof` or fold its case-study artefacts into the track cards (the MedChron screen and the shorts are already there; the workflow drawing and the AgentFlow screens are not).

## Addendum: the track, content pass and layout audit (11 September 2026)

The owner asked for MedChron told as a product, not as percentages, more projects, separate experience and skills sections, achievements, and a "why hire me" section, then a check of padding, margins and radii, then one final HTML file.

- Copy moved to `src/content/track.ts` under the banned-word test. Ten checkpoints: start with three "what I do" tiles, why hire me (four points and a first-thirty-days plan), experience (three roles, full bullets), MedChron as a product story (what it is, its four parts, why attorneys can trust it, my role), projects (AgentFlow, the short-video pipeline with its clips, Kwik Media, Delta Wealth, this site), six platforms, skills with how I work, achievements with awards and education, writing, contact. The MedChron numbers left the page; they remain in the resume, the case study on the proof page and the write-up. Excluded on purpose: the CasePro MCP layer and the Cloudflare generator, and the identity platform is described as an integration, not as his build.
- Layout audit at 1440 and 412: every corner was square, buttons 35 px, sections a full screen each. Now a radius scale (14 card, 8 controls, 6 chips), 42 px controls, sections sized to content, wide two-column cards, stat tiles in the hero, faint numerals with names on the empty side of the road.
- Phones: the road ran under the cards and the car drove across the text. The road now runs down a rail on the left edge, cards start to its right, and cards are near-opaque.
- `design/track-final.html` is the page exported as one self-contained file (markup from the dev server, the track's CSS, Google Fonts, assets from the live site, a plain-JavaScript port of the car, road, telemetry, starfield and tickers). Regenerate with `node <scratchpad>/export_track.mjs`.
- GitHub pushes fail: Git now authenticates as a different GitHub account without access to the repository. Commits are local; the live site is deployed straight from the CLI.

## Addendum: the track is the home page (11 September 2026)

The owner said: execute, deploy, remove the old code. The track moved to the root route, /track redirects to it, and the paper proof page went with its components, content, test, CSS and images. The hero mode added for the proof page (store fields, frame-loop branch, camera pose, scene pause, quiet mount) went too, so the scene code is back to one mode. The old paper design previews under design/ are deleted; design/assets stays because the route test checks models there. The drive exit and the pier card lead home. Production build: 55 end-to-end tests passed across five engines, 20 skipped by design, 38 unit tests. Deployed from the CLI. GitHub push still refused for the signed-in account.

