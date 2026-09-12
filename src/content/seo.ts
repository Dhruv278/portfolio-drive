import { identity } from './profile'

// Search snippets and entity facts. Descriptions stay under 155 characters so Google shows them
// whole. Checked by seo.test.ts and by the banned-pattern scan in profile.test.ts.
export const seo = {
  titles: {
    home: `${identity.name}, ${identity.shortHeadline}`,
    drive: `The 3D drive, ${identity.name}`,
    resume: `Resume, ${identity.name}`,
    writing: `Writing, ${identity.name}`,
  },
  descriptions: {
    home: `${identity.name}, ${identity.shortHeadline} in ${identity.location}. AI products for medical records and legal work, remote for Europe and US East.`,
    drive: `A WebGL night drive through the work of ${identity.name}: MedChron, six platforms, skills and contact, built to hold its frame rate on integrated graphics.`,
    resume: `Resume of ${identity.name}: product lead for MedChron at Omnis AI, six multi-tenant platforms shipped, TypeScript, React, Node.js and LLM evaluation.`,
    writing: `Write-ups by ${identity.name} on AI for regulated work: cited medical chronologies, LLM evaluation and a Three.js site that stays fast on integrated graphics.`,
  },
  feed: {
    title: `${identity.name}, writing`,
    description: `Write-ups by ${identity.name} on AI products for regulated work and the engineering behind this site.`,
  },
  siteAlternateName: 'The Drive',
  school: 'Sarvajanik College of Engineering and Technology',
  employer: 'Omnis AI',
  // What the Person entity is known for. Short nouns search engines can match.
  knowsAbout: [
    'TypeScript',
    'React',
    'Next.js',
    'Node.js',
    'NestJS',
    'PostgreSQL',
    'MongoDB',
    'Redis',
    'Large language model evaluation',
    'Retrieval-augmented generation with source citations',
    'Prompt versioning',
    'Medical record chronologies',
    'Multi-tenant SaaS',
    'AWS',
    'Kubernetes',
    'React Three Fiber',
  ],
} as const
