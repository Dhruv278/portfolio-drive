import { describe, expect, it } from 'vitest'
import { buildSections, estimateTokens, renderKnowledge } from './knowledge'
import { loadKnowledgeFiles } from './knowledgeFiles'

describe('knowledge base', () => {
  const owner = loadKnowledgeFiles()
  const sections = buildSections(owner)
  const titles = sections.map((s) => s.title)

  it('generates every section from the content modules', () => {
    for (const t of ['About', 'Experience', 'MedChron', 'Projects', 'Platforms', 'Skills', 'Achievements and education', 'Why hire me', 'Contact']) {
      expect(titles).toContain(t)
    }
    for (const s of sections) expect(s.text.trim().length).toBeGreaterThan(20)
  })

  it('adds the owner markdown as sections titled by their first line, and skips a file with a title only', () => {
    expect(titles).toContain('How MedChron works')
    expect(titles).toContain('Questions recruiters ask')
    expect(titles).not.toContain('Certifications')
  })

  it('keeps titles unique and renders each once', () => {
    expect(new Set(titles).size).toBe(titles.length)
    const text = renderKnowledge(sections)
    for (const t of titles) expect(text.split(`## ${t}\n`).length).toBe(2)
  })

  it('stays under the prompt budget', () => {
    expect(estimateTokens(renderKnowledge(sections))).toBeLessThan(15_000)
  })

  it('carries the facts the answers will be checked against', () => {
    const text = renderKnowledge(sections)
    expect(text).toContain('Omnis AI')
    expect(text).toContain('dhruvgopani8@gmail.com')
    expect(text).toContain('Kwik Media')
  })
})
