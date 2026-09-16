import { portfolioStory } from '@/content/profile'

export function ProjectDecision() {
  return (
    <details className="story-decision">
      <summary>The difficult decision</summary>
      <p>{portfolioStory.decision}</p>
    </details>
  )
}
