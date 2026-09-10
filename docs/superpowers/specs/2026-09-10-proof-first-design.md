# The Drive, proof first: design

Date: 10 September 2026. Supersedes `2026-09-10-world-tells-the-story-design.md` (its session A is kept as the hero and the play mode; sessions B to D are cancelled) and reframes the site's job.

## Why

Research on how US and EU startups hire senior full-stack and AI engineers (report of the same date, in the session log) says: referrals and recruiter sourcing produce most hires, a resume gets seven seconds, portfolio sites are a tiebreaker that backend and AI reviewers rarely open, and when a site did help it was because of proof people could find: write-ups, shipped things, numbers. Immersive 3D portfolios belong to creative developers. The owner agreed to a site that leads with proof and keeps the drive as its one signature moment.

The site's job: in ten seconds, show a hiring manager who this person is, what they have shipped, and one number they can believe. In two minutes, give them a case study they can quote in a debrief. Everything else is secondary.

## Principles

- Proof over claims. Every case study has a measured result, a real artefact where one exists (video renders, workflow graph, screenshots), and an honest label where it does not ("illustrative screen").
- One signature moment. The drive is the hero and nothing else on the page moves on its own.
- Fast and plain below the fold. The largest contentful paint is text. The 3D bundle loads after first paint and only on the home page hero and the play route.
- Same design language as the resume: paper, ink, cobalt, Bricolage Grotesque and IBM Plex Sans. Contrast comes from full-bleed ink bands and large type, not from more colours.
- The copy rules hold (`bannedPatterns`): no dashes, no semicolons, no filler adjectives, US spelling, no freelance wording, no unsupported numbers.
- Reduced motion: the hero shows a still frame of the car outside the garage; counters show final values.

## Information architecture

| Route | Job |
|---|---|
| `/` | The proof-first page described below |
| `/drive` | The full six-stop drive as it exists today (garage intro, MedChron set piece, panels, HUD). Linked from the hero as "Take the drive". Unchanged in this work except for a back link |
| `/writing/cited-chronologies` | Write-up: citation-grounded extraction over medical records, evaluation design, failure modes, cost. Drafted from resume facts, reviewed by the owner before it goes live |
| `/writing/three-js-on-integrated-graphics` | Write-up: keeping a Three.js site at 35 fps on Intel graphics, the warm-up staging, the context-loss investigation. All material exists in the session reports |
| `/resume` | Unchanged |

## The home page, section by section

1. **Hero, one viewport tall.** The 3D scene is the background: on first load the garage door lifts, the headlights come on, the car rolls out and the camera settles into the chase, then the world idles (clouds, exhaust) for as long as the visitor stays. Over it, left-aligned: the name at display size, one line that says what he does ("AI products that have to be right: medical records into cited chronologies, agents that stop when a step fails."), a meta line ("Surat, India. Remote. Full EU overlap, three to four hours with US East. Open to contract or employer of record."), and two buttons: "See the proof" (scrolls) and "Take the drive" (opens `/drive`). Scrolling past the hero fades the canvas and stops rendering.
2. **Proof strip, full-bleed ink.** Three numbers in cobalt on ink, each with a one-line source: `53% to 26%` medication rows missing a start date, replay evaluation on source records. `28` defects worked through to take Chi to release candidate, three QA rounds. `$0.57 to $3.41` per video, seven shorts rendered unattended by the pipeline. Counters run once when the strip enters view.
3. **Case studies, four, alternating text and artefact.** Each: a title that names the problem, three short paragraphs (the problem, the decision, what shipped and what it measured), a stack line, and an artefact:
   - **MedChron.** Artefact: a designed mock of the chronology view with page citations, in the site's language, labelled "illustrative, not a product screenshot". Link to the write-up.
   - **AgentFlow.** Artefact: real screenshots of the running app (agent library, a run streaming, the billing page) captured from the local build, or an honest architecture schematic if the app cannot run. Note: the repository has no deployment configuration and no live URL; a hosted demo is a separate decision.
   - **Short-video pipeline.** Artefacts: three of the seven rendered shorts on disk as muted, looping, 480 px clips labelled "rendered by the pipeline, unedited", and the 59-node workflow drawn as an SVG from the real workflow JSON.
   - **This site.** Artefact: the before-and-after frame-rate table and the start-up timing marks from the session reports, plus a real screenshot of the MedChron stop. The point: he can make WebGL run on a hiring manager's laptop.
4. **Delivered platforms.** The six platforms as a compact list: one line each, stack in small type. No cards.
5. **Writing.** The two write-ups with one-line summaries and dates.
6. **Contact.** Email, LinkedIn, GitHub, resume PDF. One line inviting a conversation.

## Visual identity

- Palette: paper `#F4EFE6`, ink `#0F1722`, ink-2 `#55627A`, cobalt `#2F5BEA`, cobalt-2 `#1E3FB0`, paper-2 `#E9E2D6`. No new accent. Contrast from alternating paper and ink sections.
- Type: Bricolage Grotesque 800 for display (hero 96 to 128 px, section titles 40 to 56 px), IBM Plex Sans 400 to 600 for body at 17 to 18 px, 65 to 75 characters a line. Numbers in the proof strip at display size with tabular figures.
- Grid: 12 columns, 1200 px maximum, left-aligned. Case studies split seven columns text and five columns artefact, alternating sides. Phones stack.
- Motion: the drive; counters once; nothing else. Hover states are colour only.
- Imagery: real renders and screenshots framed in a thin ink rule; mocks carry their label in the frame.

## Performance and delivery

- `/` ships HTML and CSS first. The 3D hero chunk is `dynamic()` with `ssr: false` and mounts after `requestIdleCallback` or 1.5 s; until then the hero shows the paper background with the type, so the first paint has no dependency on WebGL.
- Budgets as before: 30 fps or better in the hero on Intel Iris Xe, zero frames once the hero is out of view, under 10 MB of scene assets, clips under 1.5 MB each.
- Deploy to Vercel as a new project. The owner runs `npx vercel login` once, or imports the repository in the Vercel dashboard; the build has no environment variables.
- Lighthouse on the production build: accessibility, best practices and SEO at 100 as before; performance measured and recorded.

## Content sources and honesty

- All numbers come from `src/content/profile.ts`, which mirrors the reviewed resume. New copy is added there so the banned-word test covers it.
- The video clips are the pipeline's own output from April 2026 in `C:\Projects\N8N-Video-generation\cartoon-reels`, re-encoded smaller. The workflow graph is drawn from `workflows/us_cartoon_pipeline_v4_production.json`.
- The AgentFlow screenshots come from the local build. If it does not run, the case study says so and shows the architecture instead.
- The MedChron screen is a mock and says so.
- The write-ups are drafted by the assistant from resume facts and marked draft until the owner approves them.

## Sessions

- **P1. Structure and identity.** New `/` with all six sections, text-only artefacts where media is pending, `/drive` route carrying the current experience, hero scene mount and unmount, proof counters, CSS identity, e2e for the new structure. Screenshot review.
- **P2. Artefacts.** Clips re-encoded and embedded, workflow SVG, MedChron mock screen, AgentFlow screenshots or schematic, site case-study table. Review.
- **P3. Writing and launch.** Two write-ups drafted for review, resume and LinkedIn lines for remote and overlap, Vercel deployment, Lighthouse, final report.

## Risks

- The hero scene doubles the home page's JavaScript. Mitigated by deferring the mount and by the plain fallback.
- Mock screens can look like product screenshots. Every mock carries its label inside the frame.
- Title inflation. The hero avoids "Senior" and "Product Lead" as a headline and leads with what shipped; the resume keeps the official title with scope under it.
- The write-ups touch a live product. Anonymized, no customer names, no data, owner approval before publish.
