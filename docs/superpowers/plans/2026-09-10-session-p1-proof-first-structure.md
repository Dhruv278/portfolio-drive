# Session P1: proof-first structure and identity. Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The home page leads with proof (hero drive, proof strip, four case studies, platforms, contact) and the full six-stop drive moves to `/drive`.

**Architecture:** `src/app/page.tsx` becomes a server-rendered proof page whose hero section hosts the existing 3D scene in a new `hero` mode (car parked at the first stop after the intro, camera fixed, rendering paused when the hero leaves the viewport). The current page moves verbatim to `src/app/drive/page.tsx`. New content lives in `profile.ts` under the banned-word test. Styles extend `globals.css` with a home section system on the same tokens.

**Tech Stack:** Next.js 16 App Router, React 19, @react-three/fiber 9.7, zustand 5, vitest 5, Playwright 1.63. Dev server `npx next dev -p 3778`. Screenshot tool: `node <scratchpad>/shot.mjs <name> <url> <stopId|start|fraction> [w] [h]`.

**Spec:** `docs/superpowers/specs/2026-09-10-proof-first-design.md`

## Global Constraints

- Copy rules in `profile.ts` `bannedPatterns` (no dashes, semicolons, filler words, freelance wording, unsupported numbers), enforced by `profile.test.ts`. Every new string goes into `profile.ts`.
- Performance: first paint on `/` is text on paper; the scene mounts after idle; zero frames once the hero is out of view; the `/drive` route keeps all its budgets.
- Reduced motion: no intro, static hero frame, counters show final values.
- React Compiler lint rules as before; `npx tsc --noEmit && npx eslint src e2e --max-warnings 0 && npx vitest run` before each commit; commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

---

### Task 1: Content for the home page

**Files:** Modify `src/content/profile.ts`, `src/content/profile.test.ts`.

**Interfaces produced:** `export const home = { hero: { line, meta, seeProof, takeDrive }, proof: Proof[], caseStudies: CaseStudy[], platformsHeading, contactHeading, contactLine }` with `type Proof = { label: string; source: string; from?: number; to?: number; suffix?: string; text?: string }` and `type CaseStudy = { id: string; title: string; problem: string; decision: string; shipped: string; result: string; stack: string[]; links: Link[]; artefact: Artefact }`, `type Artefact = { kind: 'image'; src: string; alt: string; caption: string } | { kind: 'table'; caption: string; rows: [string, string, string][] } | { kind: 'pending'; caption: string }`.

- [ ] Test: `home.caseStudies` has four entries with non-empty `result`; `home.proof` has three; `collectStrings` includes `home`.
- [ ] Content (values below in Task 1 of the implementation), run tests, commit.

### Task 2: Move the drive to `/drive`, hero mode in the store and frame loop

**Files:** Create `src/app/drive/page.tsx` (the old `page.tsx`), modify `src/store/drive.ts` (`mode: 'drive' | 'hero'`, `heroInView: boolean`, setters), `src/components/scene/useDriveFrame.ts` (hero mode targets `T_STOPS[0]`), `src/components/scene/ChaseCamera.tsx` (`HERO_POSE` when mode is hero), `src/content/route.ts` (`HERO_POSE`), `src/components/scene/Scene.tsx` (frameloop `never` while hero out of view; `hero` class on the root), `src/components/scene/SceneMount.tsx` (`hero` and `quiet` props), `src/components/hud/Hud.tsx` (wordmark links to `/`, a Home button).

- [ ] Implement, typecheck, lint, unit tests, commit.

### Task 3: The home page

**Files:** Create `src/components/home/HeroScene.tsx` (client: sets mode hero, observes the hero section for `heroInView`, cancels the intro on page scroll, mounts `SceneMount` after idle), `src/components/home/ProofStrip.tsx` (client counters, once, reduced motion aware), `src/components/home/CaseStudies.tsx`, `src/components/home/PlatformsList.tsx`, `src/components/home/Contact.tsx`; rewrite `src/app/page.tsx`; styles in `globals.css`; copy the production MedChron screenshot to `public/images/drive-medchron.webp`.

- [ ] Implement, screenshot at 1440 by 900 and 412 by 915, iterate on the hero pose and type scale, commit.

### Task 4: Tests

**Files:** Modify `e2e/drive.spec.ts` (drive tests point at `/drive`; new home tests: hero heading, proof strip counts up to 26, four case studies, six platforms, links to `/drive` and `/resume`), unit tests from Task 1.

- [ ] Build, run the suite in the foreground, commit.

### Task 5: Report, memory, push

- [ ] Addendum to the session report with measurements; memory note; merge to main; push.
