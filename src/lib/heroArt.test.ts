import { describe, expect, it } from 'vitest'
import { heroArtMarkup } from './heroArt'

describe('heroArtMarkup', () => {
  const svg = heroArtMarkup(1440, 0, 900, 150)
  it('is deterministic, so screenshots are stable', () => {
    expect(heroArtMarkup(1440, 0, 900, 150)).toBe(svg)
  })
  it('draws the sky down to the horizon and the water below it', () => {
    expect(svg).toContain('height="150.0" fill="url(#tp-sky)"')
    expect(svg).toContain('fill="url(#tp-water)"')
  })
  it('places the sun near the horizon on the right', () => {
    expect(svg).toMatch(/<circle cx="1238\.4" cy="144\.0" r="34"/)
  })
  it('uses unique ids so it can live beside the track defs', () => {
    for (const id of ['tp-sky', 'tp-sunGlow', 'tp-water', 'tp-sunPath', 'tp-haze']) expect(svg).toContain(`id="${id}"`)
  })
})
