// Write-ups. Drafted from the resume and the session reports; each stays marked as a draft until the
// owner has reviewed it. Every claim here is one the resume already makes, or a measurement from the
// reports in docs/superpowers/plans. No customer names, no patient data.

export type Section = { heading: string; paragraphs: string[]; list?: string[] }
export type Article = {
  slug: string
  title: string
  standfirst: string
  date: string
  readingMinutes: number
  draft: boolean
  sections: Section[]
}

export const articles: Article[] = [
  {
    slug: 'cited-chronologies',
    title: 'Every fact cites its page, or it is dropped.',
    standfirst: 'How MedChron turns thousands of pages of medical records into a chronology an attorney can use, and how we measure whether it is right.',
    date: '2026-09-11',
    readingMinutes: 7,
    draft: true,
    sections: [
      {
        heading: 'The problem is not extraction. It is trust.',
        paragraphs: [
          'A personal-injury case arrives as a file: emergency room notes, orthopedic visits, physical therapy logs, imaging reports, pharmacy records and bills, often from six or more providers, often thousands of pages. Someone has to read all of it and write a chronology, the dated list of what happened to the patient. It takes days, and the same visit turns up three times because three providers each recorded it.',
          'A language model can read those pages in minutes and produce a plausible chronology. Plausible is the danger. An attorney who puts a fact in a demand letter has to be able to point at the page it came from, and a fact that cannot be found on any page is worse than no fact at all. So the design rule for MedChron is simple to state: every extracted fact carries a citation to the page it came from, and a fact whose citation cannot be verified is dropped, not shown.',
        ],
      },
      {
        heading: 'The pipeline',
        paragraphs: [
          'Files are deduplicated first, before any model sees them: the same scanned document arrives twice more often than you would think. Pages are then run through OCR and handed to extraction prompts on Gemini, in stages, on BullMQ workers so a two-thousand-page file does not block a two-hundred-page one. Each stage writes its output with the page range it read.',
          'Deduplication of facts is the hard part. I rebuilt this stage twice. The first version asked the model to merge duplicates. It merged too eagerly and occasionally invented a date to reconcile two entries. The version that shipped puts deterministic merge guards ahead of the model: entries can only be merged when provider, date window and category agree, and the model is asked to choose between candidates, never to write a new one.',
        ],
      },
      {
        heading: 'Citations that check themselves',
        paragraphs: [
          'A citation is a page number plus the span of text the fact was drawn from. A resolver checks each one against the record: the page must exist, the span must be found on it within a tolerance for OCR noise, and the date on the fact must agree with the page header where one exists. Anything that fails is dropped, and the drop is logged so we can see which prompts are producing unverifiable output.',
          'This costs recall. It is the right trade. The chronology is a working document for a lawyer, and a shorter list of facts that all survive scrutiny is worth more than a longer one with a few that do not.',
        ],
      },
      {
        heading: 'How we know it works: replay evaluation',
        paragraphs: [
          'Prompts change. Models change. Without a fixed measure, every change is a guess. We keep a set of source records with known-good extractions and replay each prompt version against them, comparing the output field by field.',
          'The clearest example is medications. Half of the extracted medication rows had no start date, which broke treatment timelines downstream. I rewrote the medications prompt, added post-extraction validators, and replayed. Rows missing a start date fell from 53% to 26%, with no fabricated drug names and no fabricated citations in the output. The remaining 26% are mostly records that genuinely do not state a start date, which is a fact about the records, not the prompt.',
        ],
        list: [
          'Every prompt lives in an append-only registry with a version, so an evaluation result always names the prompt it measured.',
          'Patient identifiers are scrubbed before the chronology and bills prompts run.',
          'Chi, the in-product assistant, answers questions about a patient only with cited facts from that patient’s file, and went through three QA rounds and 28 reported defects before release candidate, two of them data-isolation findings that were fixed and re-tested.',
        ],
      },
      {
        heading: 'What I would tell someone building this',
        paragraphs: [
          'Decide what happens to an unverifiable fact before you write the first prompt. Put deterministic guards ahead of the model wherever you can, and let the model choose rather than compose. Build the replay evaluation before the second prompt version, because you will want to compare them. And treat every number you report as something an attorney might one day ask you to defend.',
        ],
      },
    ],
  },
  {
    slug: 'three-js-on-integrated-graphics',
    title: 'Keeping a Three.js site at 35 fps on a laptop with integrated graphics.',
    standfirst: 'The measurements, the four start-up stalls that lost the WebGL context, and the rules this site now follows.',
    date: '2026-09-11',
    readingMinutes: 8,
    draft: true,
    sections: [
      {
        heading: 'Measure on the slowest machine you own',
        paragraphs: [
          'The home page of this site is a React Three Fiber scene: a road, a car, buildings, trees, a photographic sky. The first build ran at 32 frames per second on my Intel Iris Xe laptop and kept rendering while nobody scrolled, holding the GPU at over 90 percent. A performance trace showed a two-second synchronous shader compile right after load, and the renderer counters showed only 55 thousand triangles, so geometry was never the cost.',
          'Everything that follows came from measuring rather than guessing. The site exposes its renderer counters and its start-up timings behind a query flag, and every change was checked against them.',
        ],
      },
      {
        heading: 'Render on demand, and mean it',
        paragraphs: [
          'The scene renders only when something has changed. A time-based damping loop eases the road position toward the scroll target and requests frames until it settles. An idle loop requests frames at 24 per second while the tab is visible and the visitor has interacted in the last 25 seconds, so the clouds drift and the exhaust puffs, then it sleeps. When the scene has scrolled out of view on the home page, it renders nothing at all.',
          'Two things that looked like optimisations were not. Replacing the two headlight spotlights with additive cone meshes mattered because adding a light at dusk changed the light count and recompiled every material, a 1.2 second stall. Swapping the physically based materials on the kit models for Lambert mattered because the fragment cost on an integrated GPU is per pixel, and most pixels are buildings and ground.',
        ],
      },
      {
        heading: 'Four ways to lose the WebGL context',
        paragraphs: [
          'While adding a photographic sky and textured surfaces, the WebGL context was lost on about a third of loads. Windows resets a GPU that does not respond for around two seconds, and the browser reports it as a lost context. Per-step timing found four causes, each of which alone was enough.',
        ],
        list: [
          'The framework requested a frame the moment the loaded models were committed to the scene, and that frame drew everything with every shader still uncompiled: a 1.3 second stall. The canvas now runs with the frame loop switched off until the warm-up has finished.',
          'Fifty small canvases (signs, boards, a road texture, a ground texture) were painted with Canvas 2D in the same task as that commit. Canvas 2D is GPU rasterised. Painting is now queued and drained one canvas per frame.',
          'The first draw with each shader program still compiled driver-side variants, so drawing the whole scene in one frame after compilation took 1.2 seconds. The warm-up now reveals the scene one shader program at a time, 17 groups, the longest 150 milliseconds.',
          'The environment map arrived after the materials had compiled, so every physically based material recompiled at once. The sky is now decoded and prefiltered before compilation, each step in its own frame.',
        ],
      },
      {
        heading: 'What it measures now',
        paragraphs: [
          'On the same laptop, at a device pixel ratio of 1 and a 1280 by 800 window: 35 frames per second while driving on the development server and 50 on the production build, zero frames while idle, and a longest start-up frame of 150 milliseconds. Playwright runs the suite across Chromium, Firefox and WebKit, on a phone profile and with WebGL disabled, so the plain HTML fallback is tested too.',
          'The rules that fell out of this are short. Nothing renders before every shader is compiled. Heavy GPU set-up gets its own frames. Light count, environment map, tone mapping and shadow type are fixed at creation and never change at runtime. And post-processing is gated on the renderer string, because an ambient-occlusion pass that costs two milliseconds on a discrete GPU cost this laptop 40 percent of its frame rate.',
        ],
      },
    ],
  },
]
