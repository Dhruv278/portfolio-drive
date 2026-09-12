// The bot's record, built from the same content modules the pages render, plus the owner's markdown.
// Pure: no file system here, so the pages' single source of truth stays the only source.
import { identity, skillGroups, stops } from '@/content/profile'
import { track } from '@/content/track'

export type Section = { id: string; title: string; text: string }

export const OWNER_FILES = ['how-medchron-works', 'improving-medchron', 'working-style', 'certifications', 'faq'] as const
export type OwnerKey = (typeof OWNER_FILES)[number]
export type OwnerFiles = Partial<Record<OwnerKey, string>>

const SITE = 'https://portfolio-drive-mu.vercel.app'

export function buildSections(owner: OwnerFiles): Section[] {
  const out: Section[] = []
  out.push({
    id: 'about',
    title: 'About',
    text: [`${identity.name}. ${identity.headline}.`, `${identity.location}. ${identity.availability}. ${identity.current}.`, track.hero.line, ...track.hero.tiles.map((t) => `${t.title}: ${t.body}`)].join('\n'),
  })
  out.push({
    id: 'experience',
    title: 'Experience',
    text: track.experience.roles.map((r) => `${r.company}, ${r.title} (${r.dates}). ${r.where}\n${r.points.map((p) => `- ${p}`).join('\n')}`).join('\n\n'),
  })
  out.push({
    id: 'medchron',
    title: 'MedChron',
    text: [track.medchron.heading, ...track.medchron.what, ...track.medchron.parts.map((p) => `${p.title}: ${p.body}`), 'Why attorneys can trust it:', ...track.medchron.trust.map((t) => `- ${t}`), track.medchron.role, `Stack: ${track.medchron.stack.join(', ')}.`].join('\n'),
  })
  out.push({
    id: 'projects',
    title: 'Projects',
    text: track.projects.items
      .map((p) => {
        const link = 'link' in p && p.link ? ` Link: ${p.link.href.startsWith('http') ? p.link.href : SITE + p.link.href}` : ''
        return `${p.title} (${p.kind}). ${p.body} Stack: ${p.stack.join(', ')}.${link}`
      })
      .join('\n\n'),
  })
  const platforms = stops.find((s) => s.kind === 'platforms')
  if (platforms && platforms.kind === 'platforms') {
    out.push({ id: 'platforms', title: 'Platforms', text: platforms.platforms.map((p) => `${p.title} ${p.body} Stack: ${p.chips.join(', ')}.`).join('\n') })
  }
  out.push({
    id: 'skills',
    title: 'Skills',
    text: [...skillGroups.map((g) => `${g.label}: ${g.items.join(', ')}`), 'How Dhruv works:', ...track.skills.how.map((h) => `- ${h}`)].join('\n'),
  })
  out.push({
    id: 'achievements',
    title: 'Achievements and education',
    text: [...track.achievements.work.map((a) => `- ${a}`), 'Awards:', ...track.achievements.awards.map((a) => `- ${a}`), `Education: ${track.achievements.education}`].join('\n'),
  })
  out.push({
    id: 'why',
    title: 'Why hire Dhruv',
    text: [track.why.intro, ...track.why.points.map((p) => `${p.title}: ${p.body}`), `${track.why.planHeading}:`, ...track.why.plan.map((p, i) => `${i + 1}. ${p}`)].join('\n'),
  })
  out.push({
    id: 'contact',
    title: 'Contact',
    text: `Email ${identity.email}. Phone ${identity.phone}. LinkedIn ${identity.linkedin.href}. GitHub ${identity.github.href}. Resume PDF at ${SITE}${identity.resumePdf}. ${track.contact.line}`,
  })
  for (const key of OWNER_FILES) {
    const md = (owner[key] ?? '').replace(/<!--[\s\S]*?-->/g, '').trim()
    const m = md.match(/^#\s+(.+)\n?([\s\S]*)$/)
    if (!m || !m[2].trim()) continue
    out.push({ id: key, title: m[1].trim(), text: m[2].trim() })
  }
  return out
}

export function renderKnowledge(sections: Section[]): string {
  return sections.map((s) => `## ${s.title}\n${s.text}`).join('\n\n')
}

// Rough: four characters per token. Good enough for a budget check.
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}
