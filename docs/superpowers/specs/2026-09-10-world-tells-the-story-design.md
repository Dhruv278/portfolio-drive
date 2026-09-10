# The Drive: the world tells the story, design

Date: 10 September 2026. Builds on `2026-09-07-realistic-world-design.md` (stage 1 shipped: real light, road, ground, sky) and replaces its stage 2. The HTML layer, scroll model, performance rules and content source stay.

## Why

The owner reviewed the site and said it looks too simple and not unique: the car is good, but the structure and content read like any generated portfolio. Diagnosis: six identical paper cards with resume prose, driving past scenery that has nothing to do with the words. Direction chosen by the owner: the world is the work. Each stop becomes a set piece that shows what that project does, real-looking, with mock screens in the site's own design language (no real product files). Light versions of two other ideas ride along: proof (counters, screens) and cinema (garage intro, arrival cut).

## Principles

- The scene carries the meaning at each stop. A visitor who never reads a panel still understands what was built.
- Everything shown is true to the resume content in `src/content/profile.ts`. Mock screens use the resume's own words and numbers, never invented ones.
- Mock screens are painted in the site's paper, ink and cobalt language with its two typefaces, so they read as designed, not as fake product UI.
- Budgets from the previous spec hold: 30 fps or better driving on Intel Iris Xe at dpr 1.25, zero frames idle, first-paint assets under 10 MB, all GPU set-up in the warm-up, no material recompiles mid-drive.
- Animated things move only while the idle loop is awake, as the clouds and windmills do today.
- Reduced motion: no intro, no arrival cut, no moving conveyor or ticker. Everything is still visible in its final state.
- Phones see the same set pieces from the top-down camera. Screens are large enough to read at that distance or are decorative there.

## The stops

Positions are road parameters and metres of lateral offset (positive is the camera side, frame left on desktop; negative is under the panel). Each set piece sits from `t_stop - 0.03` to `t_stop + 0.02` so it is in frame while the car parks.

### Stop 1, Start: the garage

A small workshop garage at the road's origin, behind the car's start position, with `DHRUV GOPANI` on the roller door and a workbench visible inside. It is the origin of the intro. Existing suburban houses and signposts stay for now and are replaced in the trees and terrain session.

Intro, first load only, desktop and phone, skipped under reduced motion or if the visitor scrolls: the camera starts facing the door, the door rolls up over 1.2 s, headlights come on, the car rolls forward to the start stop while the camera swings around into the chase pose, 3.5 s total. Then the normal drive.

### Stop 2, MedChron: records in, chronology out

- A records building on the camera side (textured masses: concrete base, brick, flat roof, a sign `Medical Records`), with a loading dock facing the road.
- A conveyor from the dock runs alongside the road for 24 m. Instanced paper sheets travel along it, pass through a scanner arch that glows cobalt, and continue as chronology cards.
- Past the arch, six chronology signposts stand along the road, each a card in the paper design: date, provider, finding, and a page citation such as `p. 214`. The last reads `Cited chronology`. Their text comes from a small fixture in `profile.ts` written for this purpose (plausible, clearly sample data, no real patient).
- A board on the building counts up on arrival: `53% to 26%` medication rows without a start date, `28 defects` closed, `3 QA rounds`. Numbers come from the resume bullets.
- The sheets move only while the idle loop is awake.

### Stop 3, Own products: the agent workshop and the drive-in

- An open-front workshop (corrugated steel, concrete floor) with four benches. At each bench a small robot figure built from primitives with a lit visor, labelled `Researcher`, `Writer`, `Reviewer`, `Coder`. Glowing conduits connect the benches in a dependency graph; pulses travel along them. One bench shows a red halt light, for "a failed step halts the run".
- Across the road, a drive-in screen: a mock vertical short-video frame cycles through `Trend`, `Script`, `Voice`, `Render`, `Upload` with a progress bar, and a small badge reads `59 nodes`. Three price tags on the screen post: `$0.57`, `$3.41` and the middle tier without a number (the resume gives only the two).

### Stop 4, Delivered platforms: six buildings

Six set pieces approach the harbour stop on both sides, each with a painted sign naming the platform, in resume order:

1. Wholesale quotation: a warehouse with a truck at the dock and a large QR code on its side.
2. Deposit-return recycling: a return kiosk with a bottle machine and three bins, a coin display.
3. License lifecycle: a small control tower with a windsock, a certificate board showing `Apply, Inspect, Pay, Issue, Renew` as lit stages.
4. Incentive engine: an office block with a payout leaderboard screen, bars in cobalt.
5. Food-surplus marketplace: a market hall with produce crates and a map board with pins.
6. Exchange: a slim tower with a ticker band circling it, `BTC ETH TRX XRP` prices scrolling.

The harbour water, water tower and chimney stay. The Kenney skyscrapers go.

### Stop 5, Skills: the service station

A canopy across the camera side with six pumps, each labelled with a skill group from `skillGroups` (`Frontend`, `Backend`, `Data`, `AI and LLM`, `Cloud and DevOps`, `Security and auth`). A workshop bay behind them has a tool wall with silhouettes labelled `Jest`, `Playwright`, `Claude Code`, `Codex`, `Cursor`. When the car parks, the canopy's badge strip lights up group by group. Windmills and the solar array stay.

### Stop 6, Contact: the pier at dusk

A lighthouse at the pier's end with a slowly turning beam (an additive cone, like the headlights, no real light). A moored boat. A mailbox with the email on its flag. The existing pier, posts and palms stay, retextured.

## Camera

`ChaseCamera` gains modes: `intro`, `chase`, `arrival`. On parking at a stop (the scroll model's plateau), the camera eases over 0.9 s to a higher, wider establishing pose that frames the set piece and the car; on leaving, it eases back. The pose per stop is a table in `route.ts` (`ARRIVAL_POSES`), tuned by screenshot. Under reduced motion the camera snaps. On phones the arrival pose is a slightly higher top-down.

## Mock screens and signs

`src/components/scene/paint.ts`: a Canvas 2D painter that produces `CanvasTexture`s in the design language. Primitives: `sign(text)`, `card(lines)`, `board(rows)`, `counter(label, from, to)`, `ticker(items)`, `videoFrame(step)`, `qr(seed)`. Fonts: the two site typefaces through `document.fonts` (falls back to system sans until loaded, then repaints). Animated textures update at most 24 times a second and only while the idle loop is awake or a counter is running. Texture sizes 512 by 256 or 512 by 512; total under 20 textures.

## Set-piece construction

Set pieces are React components under `src/components/scene/pieces/`, built from primitives (boxes, cylinders, extrusions, instanced meshes) and standard materials with CC0 textures. Textures, 1k WebP, from Poly Haven and ambientCG: brick, concrete wall, corrugated steel, metal plates, roof tiles, painted metal, wood planks. Each texture set is listed with source and size in `LICENSE-ASSETS.md`; the asset budget test keeps the total under 10 MB, so less prominent sets ship at 512 px. Kenney parts that still fit (containers, tanks, windmill, water tower, chimney) stay, given the Lambert-to-standard treatment where they are close to the camera.

Where a set piece stands, the placement table drops the Kenney buildings it replaces. `usedModels()` shrinks accordingly and the copy script and test follow.

## Trees and terrain

Kenney trees go last. Replacement: a procedural tree component (trunk with bark texture, canopy of four crossed leaf cards with an alpha-cut CC0 leaf texture, two or three species by parameters), instanced along the road with the existing `treeRun` positions. The sphere hills become a displaced terrain plane flattened along the road corridor, with the clearance test moved to the terrain sampler.

## Content changes

Panels stay as they are. The intro and the set pieces add no new claims. `profile.ts` gains the chronology fixture and the labels the set pieces paint, so the banned-word test covers them. The contact panel's line about a free-drive playground arriving in session three is replaced with the mailbox line, since the plan changed.

## Sessions

- A. Painter, camera modes, garage and intro, MedChron set piece with conveyor, arch, signposts and counters. Screenshot review.
- B. Agent workshop and drive-in, service station, lighthouse pier. Review.
- C. Six platform buildings, textures, removal of Kenney buildings. Review.
- D. Procedural trees, terrain, tuning, performance and Lighthouse pass, e2e for the new pieces (each stop's set piece present, counters reach their targets, intro skippable).

Each session lands with measured fps before and after in the session report.

## Risks

- Scope. Six themed buildings plus a workshop, station and pier is a lot of modelling from primitives. Kept tractable by a shared `pieces/` toolkit (textured box masses, signs, screens, poles) and by reviewing after each session.
- Draw calls. Instanced sheets, pulses and pins are single draws; every set piece targets under 25 draw calls. Total scene stays under 350.
- Readability. Signs and screens must be legible at chase distance on desktop; 512 px textures with 40 px minimum text height, checked by screenshot.
- Frame budget. Measured per session; anything under 30 fps at dpr 1.25 on Iris Xe is simplified before the next session.
