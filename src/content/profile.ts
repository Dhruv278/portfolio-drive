// Single source of truth for every word on the site and the resume page.
// Rules inherited from the resume work: problem-first, no commit counts, no freelance or client
// wording, US spelling, no em dashes or semicolons. A unit test enforces the banned-word list.
// Project write-ups and tech stacks were pulled from the earlier portfolio site's data file and
// trimmed to what the code on disk supports.

export type Link = { label: string; value: string; href: string }

export type Bullet = { lead: string; text: string }

export type Card = { title: string; body: string; chips: string[] }

export type Platform = { title: string; body: string; chips: string[] }

export type SkillGroup = { label: string; items: string[] }

export type StopContent =
  | { kind: 'hero'; id: string; name: string; eyebrow: string; lede: string; meta: string }
  | { kind: 'bullets'; id: string; name: string; eyebrow: string; heading: string; intro: string; bullets: Bullet[]; stack: string[]; chips: string[] }
  | { kind: 'cards'; id: string; name: string; eyebrow: string; heading: string; cards: Card[] }
  | { kind: 'platforms'; id: string; name: string; eyebrow: string; heading: string; platforms: Platform[] }
  | { kind: 'skills'; id: string; name: string; eyebrow: string; heading: string; groups: SkillGroup[]; habits: string }
  | { kind: 'contact'; id: string; name: string; eyebrow: string; heading: string; links: Link[]; wheel: string }

export const identity = {
  name: 'Dhruv Gopani',
  first: 'Dhruv',
  last: 'Gopani',
  headline: 'Senior Full-Stack Engineer and Product Lead, AI products for medical records and legal workflows',
  shortHeadline: 'Senior Full-Stack Engineer and Product Lead',
  location: 'Surat, India',
  availability: 'Remote or relocation',
  current: 'Currently leading MedChron at Omnis AI',
  email: 'dhruvgopani8@gmail.com',
  phone: '+91 88499 27290',
  linkedin: { label: 'dhruv-gopani-2636361ab', href: 'https://www.linkedin.com/in/dhruv-gopani-2636361ab/' },
  github: { label: 'dhruv278', href: 'https://github.com/dhruv278' },
  resumePdf: '/Dhruv_Gopani_Resume.pdf',
} as const

export const milestones = [
  { label: 'The Coding Studio, 2024 to 2025', t: 0.115, side: 1 },
  { label: 'OTPless, 2023', t: 0.15, side: -1 },
] as const

export const skillGroups: SkillGroup[] = [
  { label: 'Languages', items: ['TypeScript', 'JavaScript', 'SQL'] },
  { label: 'Frontend', items: ['React', 'Next.js', 'Redux', 'TanStack Query', 'Tailwind CSS', 'Material UI', 'shadcn/ui', 'Framer Motion', 'React Three Fiber'] },
  { label: 'Backend', items: ['Node.js', 'NestJS', 'Express', 'REST', 'WebSockets', 'Server-Sent Events', 'BullMQ', 'Kafka', 'tRPC', 'Payload CMS'] },
  { label: 'Data', items: ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Prisma', 'Mongoose', 'TypeORM', 'Pinecone'] },
  { label: 'AI and LLM', items: ['Gemini', 'Claude', 'OpenAI', 'OpenRouter', 'Prompt versioning', 'LLM evaluation', 'RAG with citations', 'Guardrails', 'Model Context Protocol', 'Agent orchestration', 'n8n', 'LangChain'] },
  { label: 'Cloud and DevOps', items: ['AWS S3', 'EC2', 'ECS', 'Lambda', 'SES', 'Kubernetes on EKS', 'Docker', 'GitHub Actions', 'Prometheus', 'Grafana'] },
  { label: 'Testing', items: ['Jest', 'Vitest', 'Playwright', 'Postman'] },
  { label: 'Security and auth', items: ['JWT', 'OAuth', 'Better-Auth', 'NextAuth', 'TOTP 2FA', 'Passkeys', 'Argon2id', 'Multi-tenant isolation', 'PHI handling'] },
  { label: 'Payments and integrations', items: ['Stripe', 'Razorpay', 'Twilio', 'Zoho', 'SendGrid', 'Mapbox'] },
  { label: 'Product and leadership', items: ['Roadmap', 'Specifications', 'Prioritization', 'Cross-functional delivery', 'QA and acceptance cycles', 'Stakeholder demos', 'Code review', 'Claude Code', 'Codex', 'Cursor'] },
]

export const stops: StopContent[] = [
  {
    kind: 'hero',
    id: 'start',
    name: 'Start',
    eyebrow: identity.shortHeadline,
    lede: 'AI products for medical records and legal workflows, built to be right, not just fast.',
    meta: `${identity.location}. ${identity.availability}. ${identity.current}.`,
  },
  {
    kind: 'bullets',
    id: 'medchron',
    name: 'Omnis AI, MedChron',
    eyebrow: 'Stop 2 of 6. Omnis AI, January 2026 to now',
    heading: 'MedChron: medical records in, cited chronology out.',
    intro:
      'Personal-injury firms spent days reading thousands of pages of records to build a case chronology. I lead the product that does it in hours: roadmap, specifications, priorities, and the core features.',
    bullets: [
      { lead: 'Rebuilt', text: 'the deduplication and extraction stages of the Gemini pipeline so a file from many providers comes back as one clean timeline.' },
      { lead: 'Introduced', text: 'page-level citations with a resolver that drops anything it cannot verify. An attorney cannot use a fact without its page.' },
      { lead: 'Took Chi,', text: 'the in-product AI assistant, from prototype to release candidate through three QA rounds and 28 defects.' },
      { lead: 'Cut', text: 'medication rows missing a start date from 53% to 26% in a replay evaluation, with no fabricated drugs or citations.' },
    ],
    stack: ['NestJS', 'MongoDB', 'Gemini 2.5', 'Claude', 'BullMQ', 'Redis', 'Socket.io', 'React', 'AWS S3', 'Kubernetes on EKS', 'Better-Auth', 'Prometheus'],
    chips: ['Before this', 'The Coding Studio, 2024 to 2025', 'OTPless, 2023'],
  },
  {
    kind: 'cards',
    id: 'products',
    name: 'Own products',
    eyebrow: 'Stop 3 of 6. Own products',
    heading: 'A workshop for agents, and a video factory.',
    cards: [
      {
        title: 'AgentFlow',
        body: 'Teams of specialized agents (researcher, writer, reviewer, coder) run as a dependency graph and stream to the browser over SSE. Free, Pro and bring-your-own-key plans, keys encrypted with AES-256-GCM, plan limits enforced in the service layer, and a failed step halts the run.',
        chips: ['NestJS', 'Next.js 14', 'Prisma', 'PostgreSQL', 'Redis', 'BullMQ', 'Stripe', 'OpenRouter', 'SSE'],
      },
      {
        title: 'Short-video pipeline',
        body: 'A 59-node n8n workflow researches a trend, writes the script, generates images and voiceover, renders and uploads to YouTube unattended. Three quality tiers (FLUX, Wan, Kling) from $0.57 to $3.41 a video, with provider fallbacks so one outage does not stop a render.',
        chips: ['n8n', 'Claude', 'Replicate', 'ElevenLabs', 'Shotstack', 'YouTube API'],
      },
    ],
  },
  {
    kind: 'platforms',
    id: 'platforms',
    name: 'Delivered platforms',
    eyebrow: 'Stop 4 of 6. Delivered platforms, 2024 to 2026',
    heading: 'Six platforms, six problems.',
    platforms: [
      {
        title: 'Wholesale quotation platform.',
        body: 'Island wholesalers stopped traveling shop to shop: retailers request quotes, prices stay private per quote, payment and installment options are set per island, drivers confirm delivery by QR scan.',
        chips: ['NestJS', 'Prisma', 'PostgreSQL', 'Next.js', 'TanStack Query'],
      },
      {
        title: 'Deposit-return recycling.',
        body: 'Government sets products and prices, collectors pay the public for returns, finance settles verified claims, every step permissioned and audited.',
        chips: ['NestJS 11', 'Prisma 7', 'PostgreSQL', 'Next.js 16', 'Zod'],
      },
      {
        title: 'License lifecycle.',
        body: 'An aviation regulator off paper: apply, inspect, pay, issue, renew. Three license types, PDF certificates, cron-driven renewal notices, four permission roles.',
        chips: ['Express 5', 'Prisma 6', 'PostgreSQL', 'Next.js 15', 'node-cron', 'jsPDF', 'AWS S3'],
      },
      {
        title: 'Incentive engine.',
        body: 'Disputed spreadsheet payouts replaced by a configurable slab engine fed by attendance and customer feedback, 16 data models, soft deletes and a full audit trail across locations.',
        chips: ['Express 5', 'Prisma 6', 'PostgreSQL', 'Next.js 16', 'Joi', 'AWS S3'],
      },
      {
        title: 'Food-surplus marketplace.',
        body: 'Two-sided marketplace connecting surplus-food sellers with buyers. Dual payment rails, real-time order updates, map-based discovery, seller and admin dashboards.',
        chips: ['Next.js 14', 'Payload CMS', 'tRPC', 'MongoDB', 'Stripe', 'Razorpay', 'Mapbox', 'Socket.io'],
      },
      {
        title: 'Exchange backend.',
        body: 'Real-time order matching over WebSocket for BTC, ETH, TRON and XRP, KYC document workflows, funded deposits and cron-based settlement.',
        chips: ['Express', 'MySQL', 'Socket.io', 'web3.js', 'bitcoinjs-lib', 'tronweb'],
      },
    ],
  },
  {
    kind: 'skills',
    id: 'how',
    name: 'Skills',
    eyebrow: 'Stop 5 of 6. Skills and how I work',
    heading: 'Everything here has shipped to production.',
    groups: skillGroups,
    habits: 'Written specifications before code. Tenant scoping and rate limits by default. Claude Code, Codex and Cursor every day, and I write the prompts and tooling the team builds on. A QA round is not done until the tracker says so.',
  },
  {
    kind: 'contact',
    id: 'contact',
    name: 'Contact',
    eyebrow: 'Stop 6 of 6. Contact',
    heading: 'The road ends at the pier. Say hello.',
    links: [
      { label: 'Email', value: identity.email, href: `mailto:${identity.email}` },
      { label: 'LinkedIn', value: identity.linkedin.label, href: identity.linkedin.href },
      { label: 'GitHub', value: identity.github.label, href: identity.github.href },
      { label: 'Resume', value: 'PDF, two pages', href: identity.resumePdf },
    ],
    wheel: 'Take the wheel. A free-drive playground with project billboards and skill badges arrives in session three.',
  },
]

// Resume page content. Mirrors the PDF section by section.
export const resume = {
  summary:
    'Full-stack engineer and product lead for AI products that handle regulated data. At Omnis AI I lead MedChron, a medical-chronology platform for US personal-injury law firms, where every extracted fact has to cite its page and every workflow has to survive an audit. TypeScript end to end (NestJS, Next.js, React, PostgreSQL, MongoDB, AWS, Kubernetes) with LLM pipelines on Gemini and Claude. I use Claude Code, Codex and Cursor every day and write the prompts, evaluations and tooling the team builds on. Before that, shipped SaaS products at a software studio.',
  strengths:
    'Product roadmap, specifications and prioritization, cross-functional delivery, problem solving from vague requirement to shipped feature, LLM and RAG pipelines with source citations, LLM evaluation and prompt versioning, Model Context Protocol (MCP) and agent systems, multi-tenant B2B SaaS, PHI handling, security remediation, QA and acceptance cycles.',
  experience: [
    {
      title: 'Omnis AI, Senior Full-Stack Engineer, Product Lead for MedChron',
      dates: 'Jan 2026 to present',
      where: 'Remote. Legal-technology company building an AI practice platform for personal-injury law firms.',
      bullets: [
        'Personal-injury firms spent days reading thousands of pages of medical records to build a case chronology. Lead MedChron, the product that turns those records into coded, cited chronologies in hours, own its roadmap, specifications and priorities with leadership, and build the core features with a distributed engineering team.',
        'Rebuilt the deduplication and extraction stages of the Gemini pipeline so a file from many providers comes back as one clean timeline instead of the same visit three times. Added deterministic merge guards ahead of the LLM dedup pass on BullMQ workers and benchmarked each prompt version against source records.',
        'An attorney cannot use a fact without the page it came from. Introduced page-level citations for every extracted fact, with a resolver that checks each reference against the record and drops malformed or unverifiable ones rather than showing them.',
        "Case teams needed quick answers about a patient's history without reading the whole file. Took Chi, MedChron's in-product AI assistant, from a first tool-calling prototype to release candidate, adding cited patient-scoped answers and PDF export, and drove three QA rounds that worked through 28 reported defects, including two critical data-isolation findings.",
        'Half of extracted medication rows had no start date, which broke treatment timelines. Rewrote the medications prompt, added post-extraction validators and ran a replay evaluation against source records: rows missing a start date fell from 53% to 26% with no fabricated drugs or citations. Separately rebuilt bill reconciliation and added ICD-10 body-part validation for injuries.',
        'Cross-organization access gaps were raised as security tickets against document and entity routes. Closed every finding, removed unauthenticated upload routes, enforced tenant scoping and rate limits, and maintain the eight-rule secure-coding SOP the team reviews every change against.',
        'Prompt edits shipped untracked and patient identifiers could reach the models. Built an append-only prompt registry with versioning and admin restore, and added PHI scrubbing to the chronology and bills extraction prompts.',
        "Chronology data sat in a silo, cut off from the firm's case system and its clients. Integrated MedChron with the CasePro legal CRM (sync with retry and an outbox, matter-driven embeds, combined PDF export) and the shared identity service (TOTP, passkeys, API keys), and hardened the client portal attorneys use to share records with OTP lockout, token binding and mobile fixes from QA.",
      ],
    },
    {
      title: 'The Coding Studio, Full-Stack Developer',
      dates: 'Jun 2024 to Dec 2025',
      where: 'Surat, India',
      bullets: [
        'Photo studios had no clean way to deliver and sell albums. Built Kwik Media, a photo-album SaaS on React, Redux and TypeScript with a Node backend, MySQL on RDS, S3 and CloudFront, Kafka queues and FCM push. Live at kwikmedia.in.',
        'Built Delta Wealth, an AI personal-finance app on Next.js, Prisma and Supabase, where Gemini receipt OCR categorizes transactions so budgets stay current without manual entry.',
        'Ran Node microservices with Kafka and Redis on AWS (EC2, ECS, Lambda) with CI/CD pipelines.',
      ],
    },
    {
      title: 'OTPless, Solution Engineer',
      dates: 'Feb 2023 to Oct 2023',
      where: 'Delhi',
      bullets: [
        'Clients wanted sign-in without the cost and delay of SMS one-time passwords. Integrated WhatsApp-based passwordless login into client applications across React, Next.js and Node stacks.',
      ],
    },
  ],
  projects: [
    {
      title: 'AgentFlow, AI agent orchestration platform (personal product)',
      dates: '2026',
      where: 'NestJS, Next.js 14, Prisma, PostgreSQL, Redis and BullMQ, Stripe, OpenRouter',
      bullets: [
        'Built AgentFlow so users can assemble teams of specialized agents (researcher, writer, reviewer, coder) that run as a dependency graph and stream to the browser over SSE.',
        'Priced Free, Pro and bring-your-own-key plans on Stripe, encrypted stored keys with AES-256-GCM, and enforced per-plan model allowlists and run limits in the service layer.',
        'One failed step halfway through a long run used to waste every step before it. Each step is now saved before the next starts and a failure halts the run.',
      ],
    },
    {
      title: 'Automated short-video pipeline (personal product)',
      dates: '2025',
      where: 'n8n, Claude, Replicate, ElevenLabs, Shotstack, YouTube API',
      bullets: [
        'Making one short video by hand took hours. A 59-node n8n workflow researches the trend, writes the script, generates images and voiceover, renders and uploads to YouTube unattended.',
        'One price could not cover both a $0.57 render and a $3.41 one. Set three quality tiers (FLUX, Wan, Kling) at those cost points with provider fallbacks so one outage does not stop a render.',
      ],
    },
  ],
  otherPlatforms: {
    heading: 'Other platforms built and delivered, 2024 to 2026',
    items: [
      { title: 'Wholesale demand and quotation platform', body: '(NestJS, Prisma, PostgreSQL, Next.js). Island wholesalers traveled shop to shop guessing who wanted stock. Multi-tenant B2B platform where retailers request quotations, prices stay private per quote, payment and installment options are configured per island, and drivers confirm delivery by QR scan.' },
      { title: 'Deposit-return recycling platform', body: '(NestJS, Prisma, PostgreSQL, Next.js). Government sets products and prices, collectors pay the public for returns, finance settles verified claims, every step permissioned and audited.' },
      { title: 'Regulatory license lifecycle platform', body: '(Express, Prisma, PostgreSQL, Next.js). Moved an aviation regulator off paper: apply, inspect, pay, issue and renew stages, PDF certificates, cron-driven renewal notices, four roles.' },
      { title: 'Incentive calculation engine', body: '(Express, Prisma, PostgreSQL, Next.js). Quarterly payouts were computed by hand and disputed. Configurable slab-based engine fed by attendance and customer feedback, with a full audit trail.' },
      { title: 'Food-surplus marketplace', body: '(Next.js 14, Payload CMS, tRPC, MongoDB, Stripe and Razorpay, Mapbox). Two-sided marketplace connecting surplus-food sellers with buyers, with dual payment rails, real-time order updates and map-based discovery.' },
      { title: 'Multi-blockchain exchange backend', body: '(Express, MySQL, Socket.io). Real-time order matching for BTC, ETH, TRON and XRP, KYC workflows, cron-based settlement.' },
    ],
  },
  skills: [
    { label: 'Languages', text: 'TypeScript, JavaScript, SQL' },
    { label: 'Frontend', text: 'React, Next.js, Redux, TanStack Query, Tailwind CSS, Material UI, shadcn/ui' },
    { label: 'Backend', text: 'Node.js, NestJS, Express, REST, WebSockets (Socket.io), Server-Sent Events, BullMQ, Kafka' },
    { label: 'Data', text: 'PostgreSQL, MongoDB, MySQL, Redis, Prisma, Mongoose, TypeORM' },
    { label: 'AI and LLM', text: 'Gemini, Claude, OpenAI, OpenRouter, prompt versioning, LLM evaluation, RAG with source citations, guardrails, Model Context Protocol (MCP), agent orchestration, n8n' },
    { label: 'Cloud, DevOps and testing', text: 'AWS (S3, EC2, ECS, Lambda, SES), Kubernetes on EKS, Docker, GitHub Actions CI/CD, Prometheus and Grafana observability, Jest, Playwright' },
    { label: 'Security and auth', text: 'JWT, OAuth, Better-Auth, TOTP 2FA, Passkeys (WebAuthn), Argon2id, multi-tenant isolation, PHI handling' },
    { label: 'Product and leadership', text: 'roadmap and specifications, prioritization, cross-functional delivery, QA and acceptance cycles, stakeholder demos, code review, AI-assisted development (Claude Code, Codex, Cursor)' },
  ],
  education: {
    degree: 'Bachelor of Engineering, Computer Engineering.',
    school: 'Sarvajanik College of Engineering and Technology (Gujarat Technological University), 2019 to 2023. CGPA 8.74/10.',
    awards:
      'Winner, Predictaholic AI competition (2021). Runner-up, COBWEB web-building competition, SVNIT (2021). Finalist, HackUTU hackathon (2020). Core team, Google Developer Student Club (2020 to 2021).',
  },
} as const

// Words and patterns that must never appear in shipped content. Checked by profile.test.ts.
export const bannedPatterns: RegExp[] = [
  /\bleverag/i, /\bspearhead/i, /\bseamless/i, /\brobust/i, /cutting-edge/i, /state-of-the-art/i,
  /\bpassionate/i, /\bsynerg/i, /\butiliz/i, /\binnovative/i, /results-driven/i, /proven track/i,
  /\bempower/i, /\bholistic/i, /\bdynamic\b/i, /\blandscape/i,
  /\bfreelanc/i, /\bupwork/i, /\bclient work\b/i, /\btikaj/i, /\bcloudflare/i,
  /\d[\d,]*\+?\s*commits?\b/i,
  /—/, /–/, /;/,
]
