# Portfolio audit, 12 September 2026

Four independent reviewers, each on one dimension, against the production build at commit 909ab44. Content (hiring-manager read), UX and accessibility (real browser, 1440, 820 and 412 px), engineering (Lighthouse, security, tests, hygiene), and the assistant (ten adversarial questions). Their full reports are summarized here in one prioritized list. Status, same day: every item below is done except 8 (team size and notice period, the owner's facts), the working-style trim in 30 (done), and the P3 hygiene items in 28 beyond the Node pin, cache headers, security headers and the powered-by header. See the session report addendum "the audit's fixes".

## Verdict in one paragraph

The site does its first job: within five seconds a recruiter sees who Dhruv is, what he builds, where he is and how to reach him, and the positioning (medical records for personal-injury law, cite the page or drop the fact) is sharper than most engineer portfolios. Contrast, layout stability and keyboard handling are solid, the 3D drive holds its frame budget on a desktop GPU, and the assistant stayed grounded on nine adversarial questions. What holds it back is a layer of small inconsistencies a careful reader catches (a stale PDF, a write-up describing a page that no longer exists, an unexplained gap behind "three and a half years"), one CSS specificity bug that flattens the type hierarchy on both main pages, 660 KB of video the home page downloads even where it is hidden, and missing safety nets on the drive (no error boundary, no context-loss handling).

## Scores measured

| Measure | Result |
|---|---|
| Lighthouse mobile, home (performance / accessibility / best practices / SEO) | 56 / 94 / 100 / 100 |
| Lighthouse mobile, resume | 79 / 100 / 100 / 100 |
| Text contrast, all main pairs | 5.3:1 to 16:1, all above WCAG AA |
| Layout shift | 0.008 at worst (phone drive) |
| 3D drive frame rate, desktop GPU, localhost | 61 fps idle, 56 to 59 scrolling |
| Assistant probes reaching the model | 9 of 10 grounded, 0 guard flags, 1.5 to 4.7 s |
| Production dependency vulnerabilities | 0 |

## P1, must fix

1. **Video download on the home page.** The three project clips autoplay and download 660 KB on every load, 55 percent of the page's transfer, including phones where they are hidden. This is most of the Lighthouse 56. Render them only when in view and never under the narrow layout. (`src/app/page.tsx`, the clips block.)
2. **Type hierarchy flattened by one rule.** `.tp p` and `.panel p` out-rank every single-class paragraph style, so the hero lede renders at 16 px instead of up to 30, eyebrows at 16 instead of 12, "Swipe for more" as loud as a heading, and drive eyebrows white instead of amber. Scope both rules to `p:not([class])`. (`src/app/globals.css`.)
3. **Drive has no safety net.** No error boundary and no WebGL context-loss listener. A failed model load or a context loss, which the session report documents on integrated graphics, replaces the whole drive page, including its HTML content, with Next's generic error. Add `src/app/drive/error.tsx` rendering the stops plus the fallback note, and a `webglcontextlost` handler that shows the fallback. (`src/components/scene/SceneMount.tsx`, `Scene.tsx`.)
4. **Stale PDF.** The downloadable resume still says "remote, open to relocation" and lists five platforms; the site says the Europe and US East line and six. Regenerate from `profile.ts`. (`C:\Projects\Resume\build_resume.js`, then copy to `public/`.)
5. **Overclaim on replay evaluation.** The site says every prompt change is replayed before it ships; the owner's own markdown says the harness covers medications and is being extended. Say the second, everywhere. (`src/content/track.ts`, `src/content/knowledge/how-medchron-works.md`.)
6. **Skip link points nowhere on the home page.** It targets `#content`; the home `main` is `#track-main`. (`src/app/page.tsx`.)
7. **Floating assistant button covers content.** On desktop it hides the "Scroll to drive" hint; on phones it covers the contact rows on the home page and sits inside the bottom sheet on every drive stop. Offset it above the sheet and the hint, and add bottom padding to the contact block. (`globals.css`, `.dbot-open` rules.)
8. **Forged history is an injection channel for the assistant.** The browser may send a previous "assistant" turn verbatim; the server forwards it. Sign each answer and require the signature on resent assistant turns, or drop assistant turns server-side and keep history only in the browser for display. (`src/lib/bot/inputGuards.ts`, `src/app/api/ask/route.ts`.)
9. **Screen-reader chatter.** The route bar's live region re-announces the distance on every scroll tick and the loader announces every percent change. Move `aria-live` to the checkpoint name only and hide the numbers. (`TrackScene.tsx`, `DriveLoader.tsx`.)
10. **The Three.js write-up describes a home page that no longer exists** and quotes a frame rate the night build no longer reaches. Rewrite the opening, re-measure, and either approve both write-ups or unlist them; their reading times are also overstated. (`src/content/writing.ts`.)
11. **"Three and a half years" hides an eight-month gap** between OTPless (October 2023) and The Coding Studio (June 2024). Say "three roles since 2023" and add one honest line about those months to the recruiter FAQ.

## P2, should fix

12. Reduced motion is not fully honored: the aurora drift, the phone hero lamp, the card stagger, the chip pop and the assistant's typing still animate. Add them to the reduce block and pass the typed text at once.
13. Assistant rules: the salary rule primes the third person ("speak for me"), the "not in my record" line is used as a hedge before a full answer, the override phrase list misses "ignore your rules", and declines sometimes omit the email. Exact replacement text is in the assistant reviewer's report.
14. The record lags the site on numbers: the pages show 53 to 26 percent, 28 defects and the cost per video; the bot has none of them and says "not in my record" to a visitor who just read them. Either accept that or add an owner file carrying exactly those figures with context.
15. Drive frame rate on integrated graphics, three cheap wins: render at device pixel ratio 1.0 when the GPU is low end, use plain PCF shadows at 1024 and update the shadow map only when the car moves, and render the contact shadow once instead of every frame. Dispose textures and geometries when the canvas remounts on rotation.
16. Assistant endpoint hardening: a client-side and upstream timeout (none today, so a stalled provider holds the function for thirty seconds), an origin check against the request host instead of a hardcoded alias, a minimum question length, and drive-route JavaScript no longer prefetched onto every page (`prefetch={false}` on the drive links, about 99 KB gzipped saved on the home page).
17. Metadata: no Open Graph image, no `metadataBase`, no robots or sitemap, no JSON-LD Person, a paper-blue theme color on a navy site, and the drive duplicates the home title.
18. Touch targets under 44 px on phones: hero buttons at 42, the assistant's close button at 34, source chips at 21, and the small text links on the drive and writing pages.
19. Skills on phones: ten mostly empty swipe cards; stack them vertically and keep the swipe row for projects only. The assistant's input never grows past one line.
20. Redundancy: the QA-tracker line appears four times, the Claude Code line four times, citations six times on the home page; achievements two to four restate experience bullets. Keep each idea once at its strongest home.
21. Content gaps hiring managers look for: team size and reporting line at Omnis AI, notice period and earliest start, a link to Omnis AI, and one honest framing line under the six platforms about for whom and alongside what.
22. Spelling: "licences" in the hero (US: licenses), "optimisations" and "rasterised" in the write-up, one curly apostrophe. Resume summary drops its subject ("Before that, shipped").
23. Resume page: 96 to 120 characters per line at 14.5 px; cap at 720 px and 15 to 16 px, and wrap it in a `main` landmark.
24. Drive loading: the HTML content, the HUD and the assistant button show for about a second before the loader appears and stay visible over it; the warm-up bar creeps slowly. Server-render the loader and hide the bottom HUD until ready.

## P3, nice

25. Unlit checkpoint dots at 2.4:1 against navy; borders at 1.2:1 rely on shadow.
26. The finish button pulses forever while the switch pulse is gated by "seen"; gate both.
27. Escape on the drive navigates home even with no dialog open.
28. `globals.css` is about 2000 lines with thirty selectors defined twice; Tailwind is imported but unused. Dead exports: `renderGateOpen`, `dashMatrices`. No Node version pin; `legacy-peer-deps` masks a conflict; textures and the sky file are served without long cache headers while models are immutable; no security headers.
29. Tests worth adding: the forged-assistant-turn case through the route, the GPU classifier against real renderer strings, the intro step function, the assistant's history builder, and a metadata smoke test. The suite never touches the real endpoint, so a missing production env var would show as "resting" without failing anything.
30. The assistant hands out the phone number; consider leaving it out of the record. The working-style file repeats two lists already in the record.

## What must not change

- The thesis and its proof chain: "features are cheap, trust is expensive" and "every fact cites its page, or it is dropped" run from the hero through the product story and the write-up to the assistant without contradiction.
- "The first thirty days on your product": four concrete commitments almost no portfolio makes.
- The honesty markers: the illustrative screen labelled as such, the assistant admitting it is an AI, problem-first bullets with real figures, a public repository and a live product.
- The engineering under the hood: the staged shader warm-up, on-demand rendering, the signed cookie bucket, guards ordered cheapest first with no message content logged, prompt caching, tests across five engines.
