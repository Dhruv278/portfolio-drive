// Copy for the track page. Every claim traces to the resume or to work on disk; the banned-word test
// covers this file too. Product stories over metrics: the numbers stay in the resume and the reports.
import { identity, resume, skillGroups } from './profile'

export const track = {
  hero: {
    eyebrow: 'Senior full-stack engineer and product lead',
    line: 'I build AI products for regulated work: medical records, legal cases, payments, licences. Products that have to be right before they are fast.',
    meta: `${identity.location}. ${identity.availability}. ${identity.current}.`,
    tiles: [
      { title: 'Product lead', body: 'Roadmap, specifications and priorities for MedChron at Omnis AI, and the core features behind them.' },
      { title: 'AI you can cite', body: 'Every extracted fact carries the page it came from, or it is dropped. Evaluations before a prompt ships.' },
      { title: 'Ships end to end', body: 'TypeScript from NestJS to Next.js, PostgreSQL and MongoDB, AWS and Kubernetes, tests included.' },
    ],
  },

  why: {
    heading: 'What you get when you hire me.',
    intro: 'Three and a half years across a solutions role, a product studio and a US legal-tech startup taught me one thing: features are cheap, trust is expensive. I build for the second.',
    points: [
      {
        title: 'Product thinking, not ticket taking',
        body: 'I own the roadmap and write the specification before the code. Every feature gets an acceptance cycle with the people who will use it, and a QA round is not done until the tracker says so.',
      },
      {
        title: 'AI features that survive scrutiny',
        body: 'Citations or nothing. Deterministic guards ahead of the model. A replay evaluation before any prompt change. Cost per run known before launch. This is how MedChron went from a demo to a product attorneys rely on.',
      },
      {
        title: 'Regulated-data habits by default',
        body: 'Tenant scoping, rate limits, audit trails and identifier scrubbing go in on day one, not after the first security ticket. I wrote the secure-coding rules my current team reviews every change against.',
      },
      {
        title: 'The whole feature, delivered',
        body: 'Backend, frontend, data, deployment and tests from one engineer who has shipped six B2B platforms and two products of my own. No hand-offs, no gaps between layers.',
      },
    ],
    planHeading: 'The first thirty days on your product',
    plan: [
      'Read the code and the open tickets before I propose anything. Write down the three biggest risks I see and agree them with you.',
      'Ship one visible fix in week one, so the team sees how I work before the larger changes land.',
      'Put an evaluation or a test around the riskiest path, usually an AI output, a payment or a permission check, so we can change it without fear.',
      'Set a weekly demo. Working software, not slides, and a written note of what changed and why.',
    ],
  },

  experience: {
    heading: 'Experience.',
    roles: [
      {
        company: 'Omnis AI',
        title: 'Senior Full-Stack Engineer, Product Lead for MedChron',
        dates: 'January 2026 to now',
        where: 'Remote. US legal-technology company building an AI practice platform for personal-injury law firms.',
        points: [
          'Lead MedChron end to end: roadmap, specifications and priorities agreed with leadership, core features built with a distributed engineering team.',
          'Rebuilt the deduplication and extraction stages of the Gemini pipeline so a file from many providers comes back as one clean timeline, with deterministic merge guards ahead of the model.',
          'Introduced page-level citations for every extracted fact, with a resolver that checks each reference against the record and drops anything it cannot verify.',
          'Took Chi, the in-product assistant, from a tool-calling prototype to release candidate: cited patient-scoped answers, PDF export, three QA rounds.',
          'Closed every security finding raised against document and entity routes, enforced tenant scoping and rate limits, and maintain the secure-coding SOP the team reviews against.',
          'Built the append-only prompt registry with versioning and restore, added PHI scrubbing to the extraction prompts, and integrated MedChron with the CasePro legal CRM and the shared identity service.',
        ],
      },
      {
        company: 'The Coding Studio',
        title: 'Full-Stack Developer',
        dates: 'June 2024 to December 2025',
        where: 'Surat, India. Product studio shipping SaaS for small businesses.',
        points: [
          'Built Kwik Media, a photo-album SaaS for studios: React, Redux and TypeScript on a Node backend, MySQL on RDS, S3 and CloudFront, Kafka queues and push notifications. Live at kwikmedia.in.',
          'Built Delta Wealth, an AI personal-finance app on Next.js, Prisma and Supabase, where Gemini reads receipts so budgets stay current without manual entry.',
          'Ran Node microservices with Kafka and Redis on AWS (EC2, ECS, Lambda) with CI/CD pipelines.',
        ],
      },
      {
        company: 'OTPless',
        title: 'Solution Engineer',
        dates: 'February 2023 to October 2023',
        where: 'Delhi. Passwordless authentication company.',
        points: ['Integrated WhatsApp-based passwordless login into client applications across React, Next.js and Node stacks, replacing SMS one-time passwords and their cost and delay.'],
      },
    ],
  },

  medchron: {
    eyebrow: 'Omnis AI, January 2026 to now',
    heading: 'MedChron: a case file in, a chronology the attorney can trust out.',
    what: [
      'MedChron is the medical-records product of a US legal-technology platform for personal-injury law firms. A case arrives as thousands of pages from many providers: emergency room notes, orthopedic visits, therapy logs, imaging, pharmacy records, bills.',
      'MedChron reads all of it and produces a coded chronology, the dated story of what happened to the patient, with every fact tied to the page it came from. Attorneys use it to understand the injury, build the demand and answer questions about the history without reading the file again.',
    ],
    parts: [
      { title: 'Chronology pipeline', body: 'Deduplicate files, OCR pages, extract facts with Gemini in stages on background workers, merge duplicates with deterministic guards, cite every fact to its page.' },
      { title: 'Chi, the assistant', body: 'Answers questions about one patient with cited facts from that file only, and exports the answer as a PDF the case team can share.' },
      { title: 'Bills and injuries', body: 'Reconciles medical bills against the record and validates injury codes against ICD-10 body parts, so the numbers and the diagnoses line up.' },
      { title: 'Integrations and portal', body: 'Syncs with the CasePro legal CRM with retry and an outbox, embeds by matter, exports combined PDFs, and gives clients a hardened portal to share records.' },
    ],
    trust: [
      'Every fact cites its page or is dropped. Unverifiable output never reaches the attorney.',
      'Prompts live in an append-only registry with versions and restore, and are replayed against known records before they ship.',
      'Patient identifiers are scrubbed before the models see the text. Tenant scoping and rate limits hold on every route.',
    ],
    role: 'My role: product lead and senior engineer. I own the roadmap, write the specifications, set priorities with leadership, and build the core features with the team.',
    stack: ['NestJS', 'MongoDB', 'Gemini 2.5', 'Claude', 'BullMQ', 'Redis', 'Socket.io', 'React', 'AWS S3', 'Kubernetes on EKS', 'Better-Auth', 'Prometheus'],
  },

  projects: {
    heading: 'Projects.',
    intro: 'Two products of my own, two shipped at the studio, and the site you are reading.',
    items: [
      {
        title: 'AgentFlow',
        kind: 'Own product, 2026',
        body: 'Teams of specialized agents (researcher, writer, reviewer, coder) run as a dependency graph and stream to the browser. Each step is saved before the next starts, so a failure halts the run without losing the work. Free, Pro and bring-your-own-key plans on Stripe, with keys encrypted at rest and limits enforced in the service layer.',
        stack: ['NestJS', 'Next.js 14', 'Prisma', 'PostgreSQL', 'Redis', 'BullMQ', 'Stripe', 'OpenRouter', 'SSE'],
        link: { label: 'Frontend repository', href: 'https://github.com/Dhruv278/Agentflow-frontend' },
      },
      {
        title: 'Short-video pipeline',
        kind: 'Own product, 2025',
        body: 'A 59-node n8n workflow that researches a trend, writes the script, generates images and a voiceover, renders the video and uploads it to YouTube without anyone touching it. Three quality tiers priced at their real cost, and a fallback provider at every step so one outage does not stop a render.',
        stack: ['n8n', 'Claude', 'Replicate', 'ElevenLabs', 'Shotstack', 'YouTube API'],
        clips: true,
      },
      {
        title: 'Kwik Media',
        kind: 'The Coding Studio, 2024 to 2025',
        body: 'Photo studios had no clean way to deliver and sell albums. Kwik Media lets a studio upload a shoot, share it with the client, and sell prints and albums from the same page. Live in production.',
        stack: ['React', 'Redux', 'TypeScript', 'Node.js', 'MySQL on RDS', 'S3 and CloudFront', 'Kafka', 'FCM'],
        link: { label: 'kwikmedia.in', href: 'https://kwikmedia.in' },
      },
      {
        title: 'Delta Wealth',
        kind: 'The Coding Studio, 2025',
        body: 'A personal-finance app where you photograph a receipt and Gemini reads and categorizes the transaction, so the budget stays current without manual entry.',
        stack: ['Next.js', 'Prisma', 'Supabase', 'Gemini'],
      },
      {
        title: 'This site',
        kind: 'Own work, 2026',
        body: 'A React Three Fiber scene that renders only on demand, compiles every shader before it fades in, and holds 35 frames a second on a laptop with integrated graphics. Tested across Chromium, Firefox and WebKit, and on phones.',
        stack: ['Next.js 16', 'React Three Fiber', 'three', 'zustand', 'Playwright', 'Vitest'],
        link: { label: 'Take the 3D drive', href: '/drive' },
      },
    ],
  },

  platforms: {
    heading: 'Six platforms delivered, 2024 to 2026.',
    intro: 'Multi-tenant B2B systems for real operations: wholesale trade, recycling, aviation licensing, payroll incentives, food supply, crypto exchange.',
  },

  skills: {
    heading: 'Skills, all of them shipped to production.',
    groups: skillGroups,
    howHeading: 'How I work',
    how: [
      'Written specification before code, with the acceptance criteria agreed up front.',
      'Tenant scoping, rate limits and audit trails by default in anything multi-tenant.',
      'Evaluations and tests around the paths that can hurt a customer: AI output, payments, permissions.',
      'Claude Code, Codex and Cursor every day, and I write the prompts and tooling the team builds on.',
      'A QA round is not done until the tracker says so.',
    ],
  },

  achievements: {
    heading: 'Achievements.',
    work: [
      'Took MedChron from a working demo to a product US law firms rely on, as product lead and senior engineer, in the first eight months at Omnis AI.',
      'Took Chi, the in-product assistant, from prototype to release candidate through three QA rounds, including two critical data-isolation fixes.',
      'Closed every security finding raised against MedChron document and entity routes and wrote the eight-rule secure-coding SOP the team reviews against.',
      'Halved the share of extracted medication rows missing a start date in a replay evaluation, with no fabricated drugs or citations.',
      'Shipped Kwik Media to production, where studios sell albums from it today.',
      'Delivered six multi-tenant B2B platforms in two years across wholesale, government, HR, food and finance.',
    ],
    awards: resume.education.awards
      .split('. ')
      .filter(Boolean)
      .map((a) => a.replace(/\.$/, '') + '.'),
    education: `${resume.education.degree} ${resume.education.school}`,
  },

  writing: { heading: 'Writing.' },

  finish: {
    eyebrow: 'The map is done. The drive is waiting.',
    heading: 'Same road, in 3D.',
    body: 'Ten checkpoints on a map is the short version. The 3D drive takes you down the road itself at night: out of the garage, past the records building, to the pier.',
    button: 'Switch to the 3D drive',
  },

  contact: {
    heading: 'Say hello.',
    line: 'Email is fastest. I answer within a day, and I am happy to walk through any of this on a call.',
  },
} as const
